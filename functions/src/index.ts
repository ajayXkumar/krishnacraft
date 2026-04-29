import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { findProduct } from './catalog';

admin.initializeApp();
const db = admin.firestore();

// Secrets — set via `firebase functions:secrets:set RAZORPAY_KEY_SECRET`
const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

interface CartItemInput {
  id: string;
  qty: number;
}

interface AddressInput {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

// =============================================================
// createOrder — callable
// Recomputes amount from product IDs, creates Razorpay order,
// writes a Firestore order doc with status: pending.
// =============================================================
export const createOrder = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], region: 'us-central1' },
  async request => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const { items, shippingAddress } = request.data as {
      items: CartItemInput[];
      shippingAddress: AddressInput;
    };

    if (!Array.isArray(items) || items.length === 0) {
      throw new HttpsError('invalid-argument', 'Cart is empty.');
    }

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.line1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      throw new HttpsError('invalid-argument', 'Shipping address is incomplete.');
    }

    // Recompute prices server-side from authoritative catalog
    const itemSnapshots: Array<{
      productId: string;
      name: string;
      image: string;
      price: number;
      qty: number;
      category: string;
      wood: string;
    }> = [];
    let subtotal = 0;

    for (const it of items) {
      const p = findProduct(it.id);
      if (!p) {
        throw new HttpsError('not-found', `Product not found: ${it.id}`);
      }
      const qty = Math.max(1, Math.min(99, Math.floor(it.qty)));
      itemSnapshots.push({
        productId: p.id,
        name: p.name,
        image: p.img,
        price: p.price,
        qty,
        category: p.category,
        wood: p.wood,
      });
      subtotal += p.price * qty;
    }

    const shipping = subtotal === 0 ? 0 : subtotal > 50000 ? 0 : 1499;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping + tax;
    const amountInPaise = total * 100;

    // Get user identity (phone is primary; email is optional)
    const userRecord = await admin.auth().getUser(uid);
    const userPhone = userRecord.phoneNumber || '';
    const userEmail = userRecord.email || '';

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID.value(),
      key_secret: RAZORPAY_KEY_SECRET.value(),
    });

    let rzOrder;
    try {
      rzOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `wh_${uid.slice(0, 8)}_${Date.now()}`,
        notes: {
          userId: uid,
          itemCount: String(itemSnapshots.length),
        },
      });
    } catch (err) {
      logger.error('Razorpay order creation failed', err);
      throw new HttpsError('internal', 'Could not create payment order.');
    }

    // Persist order in Firestore
    const orderDoc = {
      userId: uid,
      userPhone,
      userEmail,
      items: itemSnapshots,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      razorpay: {
        orderId: rzOrder.id,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      statusHistory: [
        { status: 'pending' as const, at: Date.now(), note: 'Order created' },
      ],
    };

    const ref = await db.collection('orders').add(orderDoc);

    return {
      orderId: rzOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      firestoreOrderId: ref.id,
      keyId: RAZORPAY_KEY_ID.value(),
    };
  },
);

// =============================================================
// verifyPayment — callable
// Verifies HMAC signature; on success, marks the Firestore order paid.
// =============================================================
export const verifyPayment = onCall(
  { secrets: [RAZORPAY_KEY_SECRET], region: 'us-central1', invoker: 'public' },
  async request => {
    const uid = request.auth?.uid;
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You must be signed in.');
    }

    const {
      firestoreOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = request.data as {
      firestoreOrderId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (
      !firestoreOrderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      throw new HttpsError('invalid-argument', 'Missing payment fields.');
    }

    const orderRef = db.collection('orders').doc(firestoreOrderId);
    const snap = await orderRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = snap.data()!;
    if (order.userId !== uid) {
      throw new HttpsError('permission-denied', 'Not your order.');
    }
    if (order.razorpay?.orderId !== razorpay_order_id) {
      throw new HttpsError('invalid-argument', 'Order ID mismatch.');
    }

    // Verify HMAC SHA256
    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const valid =
      expected.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

    if (!valid) {
      logger.warn('Invalid Razorpay signature', { firestoreOrderId, uid });
      await orderRef.update({
        status: 'failed',
        paymentStatus: 'failed',
        updatedAt: Date.now(),
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: 'failed',
          at: Date.now(),
          note: 'Signature mismatch',
        }),
      });
      throw new HttpsError('invalid-argument', 'Invalid payment signature.');
    }

    await orderRef.update({
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: Date.now(),
      updatedAt: Date.now(),
      'razorpay.paymentId': razorpay_payment_id,
      'razorpay.signature': razorpay_signature,
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status: 'paid',
        at: Date.now(),
        note: 'Payment verified',
      }),
    });

    return { success: true, orderId: firestoreOrderId };
  },
);

// =============================================================
// razorpayWebhook — HTTPS endpoint
// Belt-and-suspenders insurance against the user closing the tab
// before verifyPayment runs. Razorpay calls this on payment events.
// =============================================================
export const rzpWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET], region: 'us-central1', invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!signature || !rawBody) {
      res.status(400).send('Missing signature or body');
      return;
    }

    const webhookSecret = RAZORPAY_WEBHOOK_SECRET.value();
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (
      expected.length !== signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      logger.warn('Invalid webhook signature');
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.body as {
      event: string;
      payload: {
        payment?: {
          entity: {
            id: string;
            order_id: string;
            status: string;
          };
        };
        order?: { entity: { id: string } };
      };
    };

    try {
      const rzOrderId =
        event.payload.payment?.entity.order_id || event.payload.order?.entity.id;
      if (!rzOrderId) {
        res.status(200).send('No order id in event');
        return;
      }

      const ordersSnap = await db
        .collection('orders')
        .where('razorpay.orderId', '==', rzOrderId)
        .limit(1)
        .get();

      if (ordersSnap.empty) {
        logger.warn(`Webhook: no Firestore order matches ${rzOrderId}`);
        res.status(200).send('Order not found');
        return;
      }

      const orderRef = ordersSnap.docs[0].ref;
      const data = ordersSnap.docs[0].data();

      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        if (data.status !== 'paid') {
          await orderRef.update({
            status: 'paid',
            paymentStatus: 'paid',
            paidAt: Date.now(),
            updatedAt: Date.now(),
            'razorpay.paymentId':
              event.payload.payment?.entity.id || data.razorpay?.paymentId || null,
            statusHistory: admin.firestore.FieldValue.arrayUnion({
              status: 'paid',
              at: Date.now(),
              note: `Webhook: ${event.event}`,
            }),
          });
        }
      } else if (event.event === 'payment.failed') {
        if (data.status === 'pending') {
          await orderRef.update({
            status: 'failed',
            paymentStatus: 'failed',
            updatedAt: Date.now(),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
              status: 'failed',
              at: Date.now(),
              note: 'Webhook: payment.failed',
            }),
          });
        }
      }

      res.status(200).send('OK');
    } catch (err) {
      logger.error('Webhook handler error', err);
      res.status(500).send('Webhook handler error');
    }
  },
);
