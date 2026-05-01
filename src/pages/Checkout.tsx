import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import type { UserAddress } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { formatPrice } from '../data/products';
import { createOrder, verifyPayment } from '../firebase/orders';
import { openRazorpayCheckout } from '../components/RazorpayCheckout';
import { RAZORPAY_KEY_ID } from '../firebase/config';
import AddressForm from '../components/AddressForm';
import ProfileGate from '../components/ProfileGate';
import { ArrowRightIcon, CheckIcon } from '../components/Icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

type Step = 'address' | 'review' | 'paying';

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
  const { items, productMap, subtotal, shipping, tax, discount, total, clear, showToast, appliedCoupon } = useCart();
  const [step, setStep] = useState<Step>('address');
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    if (items.length === 0 && step !== 'paying') {
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

  const placeOrder = async () => {
    if (!user || !profile || !selectedAddress) return;
    setBusy(true);
    setError('');

    // Check all items are in stock before proceeding
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
      // 1. Create Razorpay order via Cloud Function
      const { data } = await createOrder({
        items,
        shippingAddress: selectedAddress,
      });

      // 2. Open Razorpay modal
      await openRazorpayCheckout({
        key: data.keyId || RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Krishna Craft',
        description: `Order ${data.firestoreOrderId.slice(0, 8)}`,
        order_id: data.orderId,
        prefill: {
          name: selectedAddress.name || profile.displayName,
          email: profile.email || undefined,
          contact: selectedAddress.phone,
        },
        notes: {
          firestoreOrderId: data.firestoreOrderId,
        },
        theme: { color: '#3E2723' },
        handler: async response => {
          try {
            const verifyRes = await verifyPayment({
              firestoreOrderId: data.firestoreOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.success) {
              clear();
              showToast('Payment successful');
              navigate(`/order/${data.firestoreOrderId}/success`, { replace: true });
            } else {
              setError('Payment could not be verified. Please contact support.');
              setStep('review');
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Verification failed';
            setError(msg);
            setStep('review');
          }
        },
        modal: {
          ondismiss: () => {
            setStep('review');
            setBusy(false);
          },
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start payment';
      setError(msg);
      setStep('review');
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
            <span className="text-walnut">Checkout</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
            Checkout
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-6 text-xs tracking-[0.15em] uppercase">
            <Step n={1} label="Address" active={step === 'address'} done={step !== 'address'} />
            <span className="text-line">—</span>
            <Step n={2} label="Review" active={step === 'review'} done={false} />
            <span className="text-line">—</span>
            <Step n={3} label="Payment" active={step === 'paying'} done={false} />
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
                  <div className="bg-maroon/5 border border-maroon/20 px-4 py-4 rounded-sm">
                    <p className="text-[13px] text-maroon font-medium mb-1">Payment failed</p>
                    <p className="text-[12px] text-maroon/80 mb-3">{error}</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={placeOrder}
                        disabled={busy}
                        className="px-5 py-2 text-xs tracking-widest uppercase bg-maroon text-white rounded-sm hover:bg-maroon/90 disabled:opacity-60"
                      >
                        {busy ? 'Retrying…' : 'Retry Payment'}
                      </button>
                      <a
                        href="mailto:support@woodenheritage.in?subject=Payment Issue"
                        className="px-5 py-2 text-xs tracking-widest uppercase border border-maroon/30 text-maroon rounded-sm hover:bg-maroon/5"
                      >
                        Contact Support
                      </a>
                    </div>
                  </div>
                )}

                {!error && (
                  <>
                    <button
                      onClick={placeOrder}
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all disabled:opacity-60"
                    >
                      {busy ? 'Starting payment…' : <>Pay {formatPrice(total)} <ArrowRightIcon /></>}
                    </button>
                    <p className="text-[11px] text-muted text-center">
                      Secured by Razorpay · UPI, Cards, Net Banking, Wallets
                    </p>
                  </>
                )}
              </div>
            )}

            {step === 'paying' && (
              <div className="bg-white border border-line rounded-xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-cream-2 flex items-center justify-center text-gold">
                  <CheckIcon size={28} />
                </div>
                <h2 className="text-2xl mb-2">Awaiting payment confirmation…</h2>
                <p className="text-muted text-sm">
                  Don't close this window. The Razorpay window will appear shortly.
                </p>
              </div>
            )}
          </div>

          {/* SUMMARY */}
          <aside className="bg-white border border-line rounded-xl p-7 h-fit lg:sticky lg:top-28">
            <h3 className="text-xl mb-5 pb-4 border-b border-line">Order Summary</h3>
            <div className="space-y-2 text-sm text-walnut-soft mb-3">
              <div className="flex justify-between"><span>Items ({items.length})</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between"><span>GST (5%)</span><span>{formatPrice(tax)}</span></div>
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
          </aside>
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
