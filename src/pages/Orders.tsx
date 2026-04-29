import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getUserOrders } from '../firebase/orders';
import type { Order } from '../firebase/orders';
import { formatPrice } from '../data/products';
import { ArrowRightIcon, BagIcon } from '../components/Icons';
import ProfileGate from '../components/ProfileGate';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-cream-2 text-walnut-soft',
  paid: 'bg-gold/15 text-gold',
  shipped: 'bg-walnut text-cream',
  delivered: 'bg-walnut text-cream',
  failed: 'bg-maroon/15 text-maroon',
  cancelled: 'bg-maroon/15 text-maroon',
};

export default function Orders() {
  return (
    <ProfileGate allowMissing>
      <OrdersInner />
    </ProfileGate>
  );
}

function OrdersInner() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    getUserOrders(user.uid)
      .then(setOrders)
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load orders'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <section className="bg-cream-2 pt-32 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/account" className="hover:text-gold">Account</Link>
            <span className="mx-2">/</span>
            <span className="text-walnut">Orders</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
            My Orders
          </h1>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8">
          {loading ? (
            <div className="text-center py-20 text-muted">Loading orders…</div>
          ) : error ? (
            <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-5 py-4 rounded-sm">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-line">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream-2 flex items-center justify-center text-muted">
                <BagIcon size={28} />
              </div>
              <h3 className="text-2xl mb-2">No orders yet</h3>
              <p className="text-muted text-sm mb-6">
                Begin your journey through our heritage collection.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
              >
                Browse Collection <ArrowRightIcon />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(o => (
                <Link
                  key={o.id}
                  to={`/order/${o.id}`}
                  className="block bg-white border border-line rounded-xl p-6 hover:border-walnut transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">
                        Order #{o.id.slice(0, 10).toUpperCase()}
                      </div>
                      <div className="text-sm text-walnut">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-sm ${
                          STATUS_STYLES[o.status] || STATUS_STYLES.pending
                        }`}
                      >
                        {o.status}
                      </span>
                      {o.status === 'delivered' && (
                        <span className="text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-sm bg-gold/15 text-gold border border-gold/30">
                          ★ Leave a Review
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                      {o.items.slice(0, 4).map(it => (
                        <img
                          key={it.productId}
                          src={it.image}
                          alt={it.name}
                          className="w-14 h-14 object-cover rounded-sm border border-line"
                        />
                      ))}
                      {o.items.length > 4 && (
                        <div className="w-14 h-14 rounded-sm bg-cream-2 flex items-center justify-center text-xs text-muted">
                          +{o.items.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] tracking-[0.15em] uppercase text-muted">
                        {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                      </div>
                      <div className="font-display text-walnut text-lg">
                        {formatPrice(o.total)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
