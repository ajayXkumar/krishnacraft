import { Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { findProduct, formatPrice } from '../data/products';
import { PlusIcon, MinusIcon, BagIcon, ArrowRightIcon } from '../components/Icons';
import { useEffect, useState } from 'react';
import { validateCoupon } from '../firebase/coupons';
import { getFirestoreProducts } from '../firebase/productsClient';
import type { Product } from '../types';

export default function Cart() {
  const { items, setQty, remove, subtotal, shipping, discount, total, appliedCoupon, setAppliedCoupon } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [productMap, setProductMap] = useState<Record<string, Product>>({});

  useEffect(() => {
    getFirestoreProducts().then(list => {
      const map: Record<string, Product> = {};
      list.forEach(p => { map[p.id] = p; });
      setProductMap(map);
    });
  }, []);

  return (
    <>
      <section className="bg-cream-2 pt-32 pb-16 text-center">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-walnut">Cart</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>
            Your Cart
          </h1>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cream-2 flex items-center justify-center text-muted">
                <BagIcon size={32} />
              </div>
              <h2 className="text-3xl mb-3">Your cart is empty</h2>
              <p className="text-muted mb-8 max-w-md mx-auto">
                Looks like you haven't added any heritage pieces yet. Begin your journey through our collection.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
              >
                Browse Collection <ArrowRightIcon />
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
              <div className="bg-white rounded-xl p-6 lg:p-8 border border-line">
                {items.map(item => {
                  const p = productMap[item.id] || findProduct(item.id);
                  if (!p) return null;
                  const outOfStock = (p as any).inStock === false;
                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr_auto_auto] gap-4 sm:gap-6 items-center py-6 border-b border-line last:border-0 ${outOfStock ? 'opacity-60' : ''}`}
                    >
                      <Link to={`/product/${p.id}`}>
                        <img
                          src={p.img}
                          alt={p.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-sm"
                        />
                      </Link>
                      <div>
                        <Link
                          to={`/product/${p.id}`}
                          className="font-display text-lg text-walnut block leading-tight mb-1 hover:text-gold transition-colors"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] tracking-[0.15em] uppercase text-muted">{p.category} · {p.wood}</span>
                          {outOfStock && (
                            <span className="text-[10px] tracking-[0.15em] uppercase bg-maroon/10 text-maroon px-2 py-0.5 rounded-sm">Out of Stock</span>
                          )}
                        </div>
                        <button
                          onClick={() => remove(item.id)}
                          className="text-xs text-muted hover:text-maroon underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="inline-flex border border-line rounded-sm overflow-hidden col-start-2 sm:col-auto justify-self-start">
                        <button
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="w-8 h-8 bg-cream-2 hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
                        >
                          <MinusIcon />
                        </button>
                        <span className="px-3 text-sm flex items-center min-w-[28px] justify-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="w-8 h-8 bg-cream-2 hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <div className="font-display text-lg text-walnut col-start-2 sm:col-auto text-right">
                        {formatPrice(p.price * item.qty)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="bg-white border border-line rounded-xl p-8 h-fit lg:sticky lg:top-28">
                <h3 className="text-2xl mb-5 pb-4 border-b border-line">Order Summary</h3>

                <div className="flex justify-between py-2 text-sm text-walnut-soft">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-walnut-soft">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-2 text-sm text-gold font-medium">
                    <span>Discount</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}

                {/* Coupon */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between my-5 px-4 py-3 bg-gold/10 border border-gold/30 rounded-sm">
                    <div>
                      <div className="text-xs tracking-widest uppercase text-gold font-medium">{appliedCoupon.code}</div>
                      <div className="text-xs text-muted mt-0.5">−{formatPrice(appliedCoupon.discount)} saved</div>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-xs text-muted hover:text-maroon underline">Remove</button>
                  </div>
                ) : (
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      if (!coupon.trim()) return;
                      setCouponBusy(true);
                      setCouponError('');
                      try {
                        const { discount: d, coupon: c } = await validateCoupon(coupon, subtotal);
                        setAppliedCoupon({ code: c.code, discount: d });
                        setCoupon('');
                      } catch (err) {
                        setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
                      } finally {
                        setCouponBusy(false);
                      }
                    }}
                    className="my-5"
                  >
                    <div className="flex gap-2">
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value); setCouponError(''); }}
                        placeholder="Coupon code"
                        className="flex-1 px-4 py-3 border border-line bg-cream font-sans rounded-sm outline-none text-[13px] focus:border-gold"
                      />
                      <button
                        type="submit"
                        disabled={couponBusy}
                        className="px-5 py-3 bg-walnut text-cream text-xs tracking-[0.15em] uppercase rounded-sm hover:bg-gold transition-colors disabled:opacity-60"
                      >
                        {couponBusy ? '…' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-maroon mt-1.5">{couponError}</p>}
                  </form>
                )}

                <div className="flex justify-between pt-5 mt-3 border-t border-line text-xl font-semibold text-walnut">
                  <span>Total</span>
                  <span className="font-display">{formatPrice(total)}</span>
                </div>

                <p className="text-[11px] text-muted leading-relaxed mt-6 mb-4 text-center">
                  Enter your address in the next step, then place your order directly via WhatsApp. We'll confirm and share payment details.
                </p>

                <Link
                  to="/checkout"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-[#25D366] text-white hover:bg-[#1fba5b] transition-all"
                >
                  Place Order via WhatsApp <ArrowRightIcon />
                </Link>

                <Link
                  to="/products"
                  className="block w-full mt-3 text-center text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut py-2"
                >
                  Continue Shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
