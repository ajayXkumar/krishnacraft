import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, cancelOrder } from '../firebase/orders';
import { printInvoice } from '../utils/invoicePrint';
import type { Order, OrderStatus } from '../firebase/orders';
import { formatPrice } from '../data/products';
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW } from '../types';
import ProfileGate from '../components/ProfileGate';
import { hasUserReviewedProduct, submitReview } from '../firebase/reviews';
import { useAuth } from '../store/AuthContext';
import { StarIcon } from '../components/Icons';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-cream-2 text-walnut-soft',
  paid: 'bg-gold/15 text-gold',
  wood_sourcing: 'bg-amber-100 text-amber-700',
  cutting: 'bg-amber-100 text-amber-700',
  carving: 'bg-amber-100 text-amber-700',
  assembly: 'bg-amber-100 text-amber-700',
  finishing: 'bg-amber-100 text-amber-700',
  quality_check: 'bg-blue-50 text-blue-600',
  packed: 'bg-indigo-50 text-indigo-600',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-50 text-green-600',
  failed: 'bg-red-50 text-red-600',
  cancelled: 'bg-red-50 text-red-600',
};

export default function OrderDetail() {
  return (
    <ProfileGate allowMissing>
      <OrderDetailInner />
    </ProfileGate>
  );
}

function OrderDetailInner() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(o => {
        if (!o) setError('Order not found');
        else setOrder(o);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="pt-40 pb-32 text-center text-muted">Loading order…</div>;

  if (error || !order) {
    return (
      <div className="pt-40 pb-32 text-center px-5">
        <h1 className="text-3xl mb-4">{error || 'Order not found'}</h1>
        <Link to="/orders" className="text-gold underline">View all orders →</Link>
      </div>
    );
  }

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status as OrderStatus);
  const isTerminal = ['failed', 'cancelled'].includes(order.status);
  const canCancel = ['pending', 'paid'].includes(order.status);

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      setConfirmCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <section className="bg-cream-2 pt-32 pb-12">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/orders" className="hover:text-gold">Orders</Link>
            <span className="mx-2">/</span>
            <span className="text-walnut">#{order.id.slice(0, 10).toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
                Order #{order.id.slice(0, 10).toUpperCase()}
              </h1>
              <div className="text-sm text-muted mt-1">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm ${STATUS_COLOR[order.status] || STATUS_COLOR.pending}`}>
                {ORDER_STATUS_LABEL[order.status as OrderStatus] || order.status}
              </span>
              {order.paymentStatus === 'paid' && (
                <button
                  onClick={() => printInvoice(order)}
                  className="text-[11px] tracking-widest uppercase px-4 py-1.5 border border-walnut/30 text-walnut rounded-sm hover:bg-walnut hover:text-cream transition-all"
                >
                  ↓ Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8 grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <div className="space-y-6">

            {/* Tracking banner — shown only while order is in transit */}
            {(order as any).trackingNumber && order.status === 'shipped' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-800 mb-0.5">Your order is on the way!</p>
                  <p className="text-xs text-indigo-600 mb-2">Use the tracking number below on your courier's website.</p>
                  <div className="inline-flex items-center gap-2 bg-white border border-indigo-200 rounded-sm px-3 py-1.5">
                    <span className="text-[11px] uppercase tracking-widest text-indigo-400">Tracking</span>
                    <span className="font-mono font-semibold text-indigo-900">{(order as any).trackingNumber}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Workshop timeline */}
            {!isTerminal && (
              <div className="bg-white border border-line rounded-xl p-7">
                <h2 className="text-xl mb-6">Workshop Progress</h2>
                <div className="relative pl-1">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-line" />
                  <div className="space-y-0">
                    {ORDER_STATUS_FLOW.map((s, i) => {
                      const isDelivered = order.status === 'delivered';
                      const done = isDelivered ? true : i < currentIdx;
                      const active = isDelivered ? false : i === currentIdx;
                      const upcoming = isDelivered ? false : i > currentIdx;
                      const note = (order.statusHistory || []).find(h => h.status === s && h.note)?.note;
                      return (
                        <div key={s} className={`flex gap-4 pb-5 last:pb-0 relative ${upcoming ? 'opacity-35' : ''}`}>
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${
                            done    ? 'bg-gold border-gold' :
                            active  ? 'bg-walnut border-walnut' :
                                      'bg-white border-line'
                          }`}>
                            {done && (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            {active && <div className="w-2.5 h-2.5 rounded-full bg-cream" />}
                          </div>
                          <div className="pt-1">
                            <div className={`text-sm font-medium leading-none ${
                              active ? 'text-walnut' : done ? 'text-walnut-soft' : 'text-muted'
                            }`}>
                              {ORDER_STATUS_LABEL[s]}
                            </div>
                            {note && <div className="text-xs text-muted mt-1">{note}</div>}
                    
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-white border border-line rounded-xl p-7">
              <h2 className="text-xl mb-5">Items</h2>
              <div className="space-y-5">
                {order.items.map(it => (
                  <div key={it.productId} className="flex gap-4 items-center pb-4 border-b border-line last:border-0 last:pb-0">
                    <img src={it.image} alt={it.name} className="w-20 h-20 object-cover rounded-sm" />
                    <div className="flex-1">
                      <div className="font-display text-walnut">{it.name}</div>
                      <div className="text-[11px] tracking-[0.15em] uppercase text-muted mt-1">
                        {it.category} · {it.wood}
                      </div>
                      <div className="text-sm text-muted mt-1">Qty {it.qty}</div>
                    </div>
                    <div className="text-walnut font-medium">{formatPrice(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Rate Your Purchase (shown only when delivered) ── */}
            {order.status === 'delivered' && (
              <RateYourPurchase order={order} />
            )}

            {/* Shipping */}
            <div className="bg-white border border-line rounded-xl p-7">
              <h2 className="text-xl mb-4">Shipping Address</h2>
              <div className="text-sm text-walnut-soft leading-relaxed">
                <span className="font-medium text-walnut">{order.shippingAddress.name}</span><br />
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                {order.shippingAddress.pincode}<br />
                Phone: {order.shippingAddress.phone}
              </div>
              {(order as any).trackingNumber && (
                <div className="mt-4 text-sm">
                  <span className="text-muted">Tracking Number: </span>
                  <span className="font-mono font-medium text-walnut">{(order as any).trackingNumber}</span>
                </div>
              )}
            </div>

            {order.razorpay && (
              <div className="bg-white border border-line rounded-xl p-7">
                <h2 className="text-xl mb-4">Payment</h2>
                <div className="text-sm text-walnut-soft space-y-1">
                  <div>
                    <span className="text-muted">Razorpay Order ID: </span>
                    <span className="font-mono">{order.razorpay.orderId}</span>
                  </div>
                  {order.razorpay.paymentId && (
                    <div>
                      <span className="text-muted">Payment ID: </span>
                      <span className="font-mono">{order.razorpay.paymentId}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted">Status: </span>
                    <span className="text-walnut font-medium uppercase tracking-wider text-xs">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-white border border-line rounded-xl p-7 h-fit lg:sticky lg:top-28">
            <h3 className="text-xl mb-5 pb-4 border-b border-line">Summary</h3>
            <div className="space-y-2 text-sm text-walnut-soft mb-3">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span></div>
              <div className="flex justify-between"><span>GST</span><span>{formatPrice(order.tax)}</span></div>
            </div>
            <div className="flex justify-between pt-4 border-t border-line text-lg font-semibold text-walnut">
              <span>Total</span>
              <span className="font-display">{formatPrice(order.total)}</span>
            </div>

            {canCancel && (
              <div className="mt-6 pt-5 border-t border-line">
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-2.5 text-xs tracking-widest uppercase border border-maroon/40 text-maroon rounded-sm hover:bg-maroon/5 transition-colors"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted text-center">Are you sure? This cannot be undone.</p>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="w-full py-2.5 text-xs tracking-widest uppercase bg-maroon text-white rounded-sm hover:bg-maroon/90 transition-colors disabled:opacity-60"
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="w-full py-2 text-xs text-muted hover:text-walnut transition-colors"
                    >
                      Keep Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}

// ── Star picker ──────────────────────────────────────────────────────────────
function Stars({ rating, onChange }: { rating: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'} ${
            n <= (hover || rating) ? 'text-gold' : 'text-line'
          }`}
          disabled={!onChange}
        >
          <StarIcon size={onChange ? 26 : 16} />
        </button>
      ))}
    </div>
  );
}

// ── Per-item review card ─────────────────────────────────────────────────────
type ItemState = 'loading' | 'idle' | 'open' | 'submitted' | 'already';

function ItemReviewCard({ item, userId, userName }: {
  item: Order['items'][number];
  userId: string;
  userName: string;
}) {
  const [state, setState] = useState<ItemState>('loading');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    hasUserReviewedProduct(userId, item.productId)
      .then(reviewed => setState(reviewed ? 'already' : 'idle'))
      .catch(() => setState('idle'));
  }, [userId, item.productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true); setError('');
    try {
      await submitReview({
        productId: item.productId,
        userId,
        userName,
        rating,
        title: title.trim() || item.name,
        body: body.trim(),
        createdAt: Date.now(),
      });
      setState('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') return null;

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      state === 'submitted' ? 'bg-green-50 border-green-200' :
      state === 'already'   ? 'bg-cream-2 border-line opacity-70' :
                              'bg-white border-line'
    }`}>
      {/* Item row */}
      <div className="flex items-center gap-4 mb-4">
        <Link to={`/product/${item.productId}`}>
          <img src={item.image} alt={item.name}
            className="w-16 h-16 object-cover rounded-sm border border-line" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/product/${item.productId}`}
            className="font-display text-walnut hover:text-gold transition-colors leading-tight line-clamp-2">
            {item.name}
          </Link>
          <p className="text-xs text-muted mt-0.5">{item.category}</p>
        </div>

        {/* Status badges */}
        {state === 'submitted' && (
          <span className="text-xs font-medium text-green-600 shrink-0 flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
              <polyline points="3.5,7 6,9.5 10.5,4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Submitted
          </span>
        )}
        {state === 'already' && (
          <span className="text-xs text-muted shrink-0">Already reviewed</span>
        )}
        {state === 'idle' && (
          <button
            onClick={() => setState('open')}
            className="shrink-0 px-4 py-2 text-xs tracking-widest uppercase border border-walnut text-walnut rounded-sm hover:bg-walnut hover:text-cream transition-all"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Inline form */}
      {state === 'open' && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-line pt-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
              Your Rating *
            </label>
            <Stars rating={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
              Review Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Summarise your experience"
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
              Your Review
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Tell others about the quality, craftsmanship, and delivery experience…"
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm resize-none outline-none focus:border-gold bg-white"
            />
          </div>
          {error && <p className="text-xs text-maroon">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink transition-all disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
            <button type="button" onClick={() => setState('idle')}
              className="px-6 py-2.5 text-xs tracking-widest uppercase border border-line text-muted rounded-sm hover:text-walnut">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function RateYourPurchase({ order }: { order: Order }) {
  const { user, profile } = useAuth();
  if (!user) return null;

  const userName = profile?.displayName || 'Customer';

  return (
    <div className="bg-white border border-line rounded-xl p-7">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xl">Rate Your Purchase</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-gold bg-gold/10 px-3 py-1 rounded-full">
          Order Delivered
        </span>
      </div>
      <p className="text-sm text-muted mb-6">
        Your review helps other customers and our craftsmen. It takes less than a minute.
      </p>
      <div className="space-y-4">
        {order.items.map(item => (
          <ItemReviewCard
            key={item.productId}
            item={item}
            userId={user.uid}
            userName={userName}
          />
        ))}
      </div>
    </div>
  );
}
