import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';
import type { CartItem, OrderStatus } from '../types';
import type { UserAddress } from '../store/AuthContext';

export type { OrderStatus };

export interface OrderItemSnapshot {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  category: string;
  wood: string;
}

export interface Order {
  id: string;
  userId: string;
  userPhone: string;
  userEmail?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: UserAddress;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed';
  razorpay?: {
    orderId: string;
    paymentId?: string;
    signature?: string;
  };
  createdAt: number;
  paidAt?: number;
  updatedAt: number;
  statusHistory?: { status: OrderStatus; at: number; note?: string }[];
}

interface CreateOrderRequest {
  items: CartItem[];
  shippingAddress: UserAddress;
}

interface CreateOrderResponse {
  orderId: string; // Razorpay order id
  amount: number; // in paise
  currency: string;
  firestoreOrderId: string;
  keyId: string;
}

interface VerifyPaymentRequest {
  firestoreOrderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  orderId: string;
}

export const createOrder = httpsCallable<CreateOrderRequest, CreateOrderResponse>(
  functions,
  'createOrder',
);

export const verifyPayment = httpsCallable<VerifyPaymentRequest, VerifyPaymentResponse>(
  functions,
  'verifyPayment',
);

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
}

export async function cancelOrder(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'cancelled',
    updatedAt: Date.now(),
    statusHistory: arrayUnion({ status: 'cancelled', at: Date.now(), note: 'Cancelled by customer' }),
  });
}

export async function getUserOrders(uid: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
