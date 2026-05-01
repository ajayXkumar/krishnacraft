import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import type { UserAddress } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { formatPrice } from '../data/products';
// import { createOrder, verifyPayment } from '../firebase/orders';       // ← Re-enable for Razorpay
// import { openRazorpayCheckout } from '../components/RazorpayCheckout'; // ← Re-enable for Razorpay
// import { RAZORPAY_KEY_ID } from '../firebase/config';                  // ← Re-enable for Razorpay
import { saveWhatsAppOrder } from '../firebase/orders';
import type { OrderItemSnapshot } from '../firebase/orders';
import AddressForm from '../components/AddressForm';
import ProfileGate from '../components/ProfileGate';
import { ArrowRightIcon, CheckIcon, WhatsAppIcon } from '../components/Icons';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const WA_NUMBER = '917426861002'; // Client's WhatsApp — swap to Razorpay when ready

type Step = 'address' | 'review' | 'paying' | 'sent';

function buildWhatsAppMessage(
  address: UserAddress,
  email: string | null | undefined,
  items: OrderItemSnapshot[],
  totals: { subtotal: number; shipping: number; discount: number; total: number; couponCode?: string },
): string {
  const lines: string[] = [];
  lines.push("Hi! I'm interested in placing an order from Krishna Craft.");
  lines.push('');
  lines.push('*My Details*');
  lines.push(`Name: ${address.name}`);
  lines.push(`Phone: ${address.phone}`);
  if (email) lines.push(`Email: ${email}`);
  lines.push('');
  lines.push('*Deliver to*');
  lines.push(address.line1 + (address.line2 ? `, ${address.line2}` : ''));
  lines.push(`${address.city}, ${address.state} - ${address.pincode}`);
  lines.push('');
  lines.push('*Items*');
  items.forEach(it => {
    lines.push(`- ${it.name} x ${it.qty}  ${formatPrice(it.price * it.qty)}`);
    if (it.customSize) lines.push(`  Custom size: ${it.customSize}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${formatPrice(totals.subtotal)}`);
  lines.push(`Shipping: ${totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}`);
  if (totals.discount > 0 && totals.couponCode) lines.push(`Discount (${totals.couponCode}): -${formatPrice(totals.discount)}`);
  lines.push(`*Total: ${formatPrice(totals.total)}*`);
  lines.push('');
  lines.push('Please confirm availability and let me know how to proceed.');
  return lines.join('\n');
}

export default function Checkout() {
  return (
    <ProfileGate>
      <CheckoutInner />
    </ProfileGate>
  );
}

function CheckoutInner() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { items, productMap, subtotal, shipping, discount, total, clear, appliedCoupon } = useCart();
  const [step, setStep] = useState<Step>('address');
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [waUrl, setWaUrl] = useState('');

  const selectedAddress = useMemo<UserAddress | null>(() => {
    if (!profile) return null;
    return profile.addresses.find(a => a.id === selectedAddrId) || null;
  }, [profile, selectedAddrId]);

  // Pick default address on load
  useEffect(() => {
    if (profile && !selectedAddrId && profile.addresses.length > 0) {
      const def = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
      setSelectedAddrId(def.id);
    }
  }, [profile, selectedAddrId]);

  // Empty cart guard
  useEffect(() => {
    if (items.length === 0 && step !== 'paying' && step !== 'sent') {
      navigate('/cart', { replace: true });
    }
  }, [items.length, step, navigate]);

  const saveNewAddress = async (a: UserAddress) => {
    if (!user || !profile) return;
    setBusy(true);
    try {
      const merged = [...profile.addresses, a];
      if (merged.length === 1) merged[0].isDefault = true;
      await updateDoc(doc(db, 'users', user.uid), { addresses: merged });
      await refreshProfile();
      setSelectedAddrId(a.id);
      setShowNewAddr(false);
    } finally {
      setBusy(false);
    }
  };

  /* ── Razorpay placeOrder — uncomment imports above + remove WA code to re-enable ──
  const placeOrder = async () => {
    if (!user || !profile || !selectedAddress) return;
    setBusy(true);
    setError('');
    const outOfStock = items.filter(it => {
      const p = productMap[it.id];
      return p && (p as any).inStock === false;
    });
    if (outOfStock.length > 0) {
      const names = outOfStock.map(it => (productMap[it.id]?.name || it.id)).join(', ');
      setError(`The following items are out of stock: ${names}. Please remove them from your cart.`);
      setBusy(false);
      return;
    }
    setStep('paying');
    try {
      const { data } = await createOrder({ items, shippingAddress: selectedAddress });
      await openRazorpayCheckout({
        key: data.keyId || RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Krishna Craft',
        description: `Order ${data.firestoreOrderId.slice(0, 8)}`,
        order_id: data.orderId,
        prefill: { name: selectedAddress.name || profile.displayName, email: profile.email || undefined, contact: selectedAddress.phone },
        notes: { firestoreOrderId: data.firestoreOrderId },
        theme: { color: '#3E2723' },
        handler: async response => {
          try {
            const verifyRes = await verifyPayment({
              firestoreOrderId: data.firestoreOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) { clear(); showToast('Payment successful'); navigate(`/order/${data.firestoreOrderId}/success`, { replace: true }); }
            else { setError('Payment could not be verified. Please contact support.'); setStep('review'); }
          } catch (err) { setError(err instanceof Error ? err.message : 'Verification failed'); setStep('review'); }
        },
        modal: { ondismiss: () => { setStep('review'); setBusy(false); } },
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not start payment'); setStep('review'); }
    finally { setBusy(false); }
  };
  ── end Razorpay ─────────────────────────────────────────────────────────── */

  // ── WhatsApp order flow ──────────────────────────────────────────────────
  const sendWhatsAppOrder = async () => {
    if (!user || !profile || !selectedAddress) return;
    setBusy(true);
    setError('');

    const outOfStock = items.filter(it => {
      const p = productMap[it.id];
      return p && (p as any).inStock === false;
    });
    if (outOfStock.length > 0) {
      const names = outOfStock.map(it => (productMap[it.id]?.name || it.id)).join(', ');
      setError(`The following items are out of stock: ${names}. Please remove them from your cart.`);
      setBusy(false);
      return;
    }

    const orderItems: OrderItemSnapshot[] = items.map(it => {
      const p = productMap[it.id]!;
      return { productId: it.id, name: p.name, image: p.img, price: p.price, qty: it.qty, category: p.category, wood: (p as any).wood || '', ...(it.customSize ? { customSize: it.customSize } : {}) };
    });

    try {
      await saveWhatsAppOrder({
        userId: user.uid,
        userEmail: profile.email || undefined,
        items: orderItems,
        subtotal, shipping, tax: 0, discount, total,
        shippingAddress: selectedAddress,
        couponCode: appliedCoupon?.code,
      });

      const msg = buildWhatsAppMessage(selectedAddress, profile.email, orderItems, { subtotal, shipping, discount, total, couponCode: appliedCoupon?.code });
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      setWaUrl(url);
      window.open(url, '_blank');
      clear();
      setStep('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <>
      <section className="bg-cream-2 pt-32 pb-12">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/cart" className="hover:text-gold">Cart</Link>
            <span className="mx-2">/</span>
            <span className="text-walnut">Place Order</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
            Place Order
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-6 text-xs tracking-[0.15em] uppercase">
            <Step n={1} label="Address" active={step === 'address'} done={step !== 'address'} />
            <span className="text-line">—</span>
            <Step n={2} label="Review" active={step === 'review'} done={step === 'sent'} />
            <span className="text-line">—</span>
            <Step n={3} label="Confirm" active={step === 'sent'} done={false} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8 grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <div className="space-y-8">
            {step === 'address' && (
              <div className="bg-white border border-line rounded-xl p-7">
                <h2 className="text-2xl mb-5">Shipping Address</h2>

                {profile.addresses.length > 0 && !showNewAddr && (
                  <div className="space-y-3 mb-5">
                    {profile.addresses.map(a => (
                      <label
                        key={a.id}
                        className={`block border rounded-sm p-4 cursor-pointer transition-colors ${
                          selectedAddrId === a.id
                            ? 'border-gold bg-cream-2'
                            : 'border-line hover:border-walnut'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={selectedAddrId === a.id}
                            onChange={() => setSelectedAddrId(a.id)}
                            className="mt-1.5 accent-walnut"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-medium text-walnut text-sm">{a.name}</span>
                              {a.isDefault && (
                                <span className="text-[10px] tracking-[0.15em] uppercase bg-gold text-white px-2 py-0.5 rounded-sm">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-walnut-soft leading-relaxed">
                              {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}<br />
                              Phone: {a.phone}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {showNewAddr ? (
                  <div className="bg-cream-2 p-5 rounded-sm">
                    <h4 className="text-lg mb-4">New Address</h4>
                    <AddressForm
                      onSubmit={saveNewAddress}
                      busy={busy}
                      submitLabel="Save & Use"
                    />
                    {profile.addresses.length > 0 && (
                      <button
                        onClick={() => setShowNewAddr(false)}
                        className="text-xs text-muted underline mt-3"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewAddr(true)}
                    className="text-xs tracking-[0.15em] uppercase text-gold hover:text-walnut"
                  >
                    + Add a new address
                  </button>
                )}

                {!showNewAddr && profile.addresses.length > 0 && (
                  <button
                    onClick={() => setStep('review')}
                    disabled={!selectedAddrId}
                    className="mt-7 w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
                  >
                    Continue to Review <ArrowRightIcon />
                  </button>
                )}
              </div>
            )}

            {step === 'review' && selectedAddress && (
              <div className="space-y-6">
                <div className="bg-white border border-line rounded-xl p-7">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-2xl">Shipping to</h2>
                    <button
                      onClick={() => setStep('address')}
                      className="text-xs tracking-[0.15em] uppercase text-gold hover:text-walnut"
                    >
                      Change
                    </button>
                  </div>
                  <div className="text-sm text-walnut-soft leading-relaxed">
                    <span className="font-medium text-walnut">{selectedAddress.name}</span><br />
                    {selectedAddress.line1}{selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}<br />
                    {selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}<br />
                    Phone: {selectedAddress.phone}
                  </div>
                </div>

                <div className="bg-white border border-line rounded-xl p-7">
                  <h2 className="text-2xl mb-5">Order Items</h2>
                  <div className="space-y-4">
                    {items.map(it => {
                      const p = productMap[it.id];
                      if (!p) return null;
                      return (
                        <div key={it.id} className="flex gap-4 items-center">
                          <img
                            src={p.img}
                            alt={p.name}
                            className="w-16 h-16 object-cover rounded-sm"
                          />
                          <div className="flex-1">
                            <div className="font-display text-walnut text-sm">{p.name}</div>
                            {it.customSize && (
                              <div className="text-[11px] text-gold">Custom: {it.customSize}</div>
                            )}
                            <div className="text-xs text-muted">Qty {it.qty}</div>
                          </div>
                          <div className="text-sm text-walnut font-medium">
                            {formatPrice(p.price * it.qty)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm text-sm text-maroon">
                    {error}
                  </div>
                )}

                {/* ── WhatsApp order button ── */}
                <div className="space-y-3">
                  <button
                    onClick={sendWhatsAppOrder}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold rounded-sm bg-[#25D366] text-white hover:bg-[#1fba5b] transition-all disabled:opacity-60"
                  >
                    {busy ? 'Preparing…' : (
                      <><WhatsAppIcon size={20} /> Order via WhatsApp — {formatPrice(total)}</>
                    )}
                  </button>
                  <p className="text-[11px] text-muted text-center">
                    Opens WhatsApp with your order details. Just tap <strong>Send</strong> to confirm.
                  </p>
                </div>

                {/* ── Razorpay pay button — uncomment to re-enable ──
                {!error && (
                  <>
                    <button onClick={placeOrder} disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all disabled:opacity-60">
                      {busy ? 'Starting payment…' : <>Pay {formatPrice(total)} <ArrowRightIcon /></>}
                    </button>
                    <p className="text-[11px] text-muted text-center">Secured by Razorpay · UPI, Cards, Net Banking, Wallets</p>
                  </>
                )}
                ── end Razorpay button ── */}
              </div>
            )}

            {/* ── Razorpay 'paying' screen — uncomment to re-enable ──
            {step === 'paying' && (
              <div className="bg-white border border-line rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-cream-2 flex items-center justify-center text-gold">
                  <CheckIcon size={28} />
                </div>
                <h2 className="text-2xl mb-2">Awaiting payment confirmation…</h2>
                <p className="text-muted text-sm">Don't close this window. The Razorpay window will appear shortly.</p>
              </div>
            )}
            ── end Razorpay screen ── */}

            {/* ── WhatsApp order sent confirmation ── */}
            {step === 'sent' && (
              <div className="bg-white border border-line rounded-xl p-10 text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                  <WhatsAppIcon size={36} className="text-[#25D366]" />
                </div>
                <h2 className="font-display text-walnut text-2xl mb-2">Order request sent!</h2>
                <p className="text-muted text-sm leading-relaxed mb-1">
                  WhatsApp opened with your order details already written.
                </p>
                <p className="text-muted text-sm leading-relaxed mb-7">
                  Just <strong className="text-walnut">tap Send</strong> in WhatsApp and we'll confirm your order and share payment details shortly.
                </p>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mb-7 text-[#25D366] text-sm font-medium hover:underline">
                    <WhatsAppIcon size={15} /> WhatsApp didn't open? Tap here to retry
                  </a>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/orders"
                    className="inline-flex items-center justify-center px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all">
                    View My Orders
                  </Link>
                  <Link to="/products"
                    className="inline-flex items-center justify-center px-7 py-3 text-xs font-medium uppercase tracking-[0.2em] rounded-sm border border-line text-walnut hover:bg-cream-2 transition-all">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* SUMMARY — hidden on confirmation screen */}
          {step !== 'sent' && <aside className="bg-white border border-line rounded-xl p-7 h-fit lg:sticky lg:top-28">
            <h3 className="text-xl mb-5 pb-4 border-b border-line">Order Summary</h3>
            <div className="space-y-2 text-sm text-walnut-soft mb-3">
              <div className="flex justify-between"><span>Items ({items.length})</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-gold font-medium">
                  <span>Discount {appliedCoupon && `(${appliedCoupon.code})`}</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-4 border-t border-line text-lg font-semibold text-walnut">
              <span>Total</span>
              <span className="font-display">{formatPrice(total)}</span>
            </div>
          </aside>}
        </div>
      </section>
    </>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <span
      className={`flex items-center gap-2 ${
        active ? 'text-walnut font-medium' : done ? 'text-gold' : 'text-muted'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
          active
            ? 'bg-walnut text-cream'
            : done
            ? 'bg-gold text-white'
            : 'bg-cream-2 text-muted'
        }`}
      >
        {done ? <CheckIcon size={12} strokeWidth={2.5} /> : n}
      </span>
      {label}
    </span>
  );
}
