import { Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { formatPrice } from '../data/products';
import { CloseIcon, PlusIcon, MinusIcon, BagIcon, ArrowRightIcon } from './Icons';

const CROSS_SELL = [
  { label: 'Sacred Pieces', to: '/products?cat=Ladoo+Gopal', desc: 'Singhasans, jhulas & more' },
  { label: 'Bedroom', to: '/products?cat=Beds', desc: 'Hand-carved solid wood beds' },
  { label: 'Storage', to: '/products?cat=Almirahs', desc: 'Almirahs & wardrobes' },
];

export default function CartDrawer() {
  const {
    items,
    productMap,
    isOpen,
    closeCart,
    setQty,
    remove,
    subtotal,
    shipping,
    discount,
    total,
  } = useCart();

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-[80] bg-ink/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-cream z-[81] flex flex-col shadow-deep transition-transform duration-500 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-line">
          <div>
            <h3 className="text-xl font-display">Your Cart</h3>
            {items.length > 0 && (
              <p className="text-xs text-muted mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="w-9 h-9 rounded-full bg-cream-2 hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Trust strip */}
        <div className="flex justify-center gap-6 px-8 py-2.5 bg-walnut/5 border-b border-line">
          {['COD Available', 'Free Shipping >₹50k', '30-Day Returns'].map(t => (
            <span key={t} className="text-[10px] text-muted tracking-wide">{t}</span>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-8">
          {items.length === 0 ? (
            <>
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream-2 flex items-center justify-center text-muted">
                  <BagIcon size={28} />
                </div>
                <h4 className="text-xl font-display mb-2">Your cart is empty</h4>
                <p className="text-muted text-sm mb-6">Discover handcrafted heritage pieces.</p>
                <Link
                  to="/products"
                  onClick={closeCart}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.15em] rounded-sm border border-walnut text-walnut hover:bg-walnut hover:text-cream transition-all"
                >
                  Browse Collection
                </Link>
              </div>

              {/* Cross-sell when empty */}
              <div className="border-t border-line pt-6 pb-4">
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-4">You might like</p>
                <div className="space-y-2">
                  {CROSS_SELL.map(({ label, to, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeCart}
                      className="flex items-center justify-between group p-3 rounded-sm hover:bg-cream-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-walnut group-hover:text-gold transition-colors">{label}</p>
                        <p className="text-xs text-muted">{desc}</p>
                      </div>
                      <ArrowRightIcon size={14} className="text-muted group-hover:text-gold transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              {items.map(item => {
                const p = productMap[item.id];
                if (!p) return null;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[72px_1fr_auto] gap-4 py-5 border-b border-line items-center"
                  >
                    <Link to={`/product/${p.id}`} onClick={closeCart}>
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-[72px] h-[72px] object-cover rounded-sm"
                      />
                    </Link>
                    <div>
                      <div className="text-[10px] tracking-[0.15em] uppercase text-muted mb-0.5">
                        {p.category}
                      </div>
                      <div className="font-display text-walnut text-[14px] mb-2 leading-tight">
                        {p.name}
                      </div>
                      <div className="inline-flex items-center border border-line rounded-sm overflow-hidden">
                        <button
                          onClick={() => setQty(item.id, item.qty - 1)}
                          className="w-7 h-7 bg-cream-2 hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
                        >
                          <MinusIcon />
                        </button>
                        <span className="px-3 text-[13px] min-w-[28px] text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => setQty(item.id, item.qty + 1)}
                          className="w-7 h-7 bg-cream-2 hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-walnut font-medium text-sm">
                        {formatPrice(p.price * item.qty)}
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-[11px] text-muted hover:text-maroon underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Cross-sell when cart has items */}
              <div className="py-5 border-b border-line">
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-3">Complete your setup</p>
                <div className="flex gap-2 flex-wrap">
                  {CROSS_SELL.map(({ label, to }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeCart}
                      className="text-[11px] font-medium text-walnut hover:text-gold border border-line hover:border-gold rounded-full px-3 py-1.5 transition-all"
                    >
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer checkout */}
        {items.length > 0 && (
          <div className="border-t border-line bg-white px-8 py-6">
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-gold font-medium">
                  <span>Discount</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-4 border-t border-line text-lg font-semibold text-walnut mb-5">
              <span>Total</span>
              <span className="font-display">{formatPrice(total)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/checkout"
                onClick={closeCart}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.15em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all"
              >
                Checkout — {formatPrice(total)}
              </Link>
              <Link
                to="/cart"
                onClick={closeCart}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.15em] rounded-sm bg-cream-2 text-walnut hover:bg-walnut hover:text-cream transition-all"
              >
                View Cart
              </Link>
            </div>
            <p className="text-center text-[10px] text-muted mt-3 tracking-wide">
              COD Available · Secure Checkout · 30-Day Returns
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
