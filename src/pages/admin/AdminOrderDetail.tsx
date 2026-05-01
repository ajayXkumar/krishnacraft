import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../../firebase/orders';
import { adminUpdateOrderStatus, adminSetTrackingNumber } from '../../firebase/adminOps';
import { formatPrice } from '../../data/products';
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW, type OrderStatus } from '../../types';
import type { Order } from '../../firebase/orders';

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

const TERMINAL: OrderStatus[] = ['delivered', 'failed', 'cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingEdit, setTrackingEdit] = useState('');
  const [trackingSaved, setTrackingSaved] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getOrder(id)
      .then(o => setOrder(o))
      .finally(() => setLoading(false));
  }, [id]);

  const saveTracking = async () => {
    if (!order || !trackingEdit.trim()) return;
    setBusy(true);
    try {
      await adminSetTrackingNumber(order.id, trackingEdit.trim());
      setOrder(prev => prev ? { ...prev, trackingNumber: trackingEdit.trim() } as any : null);
      setTrackingSaved(true);
      setTrackingEdit('');
      setTimeout(() => setTrackingSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tracking number');
    } finally {
      setBusy(false);
    }
  };

  const moveToStatus = async (status: OrderStatus) => {
    if (!order) return;
    setBusy(true);
    setSuccess('');
    setError('');
    try {
      await adminUpdateOrderStatus(order.id, status, note, status === 'shipped' ? tracking : undefined);
      setOrder(prev => prev ? {
        ...prev,
        status,
        trackingNumber: status === 'shipped' && tracking ? tracking : (prev as any).trackingNumber,
        statusHistory: [
          ...(prev.statusHistory || []),
          { status, at: Date.now(), note },
        ],
      } : null);
      setSuccess(`Status updated to "${ORDER_STATUS_LABEL[status]}"`);
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-10 text-muted text-sm">Loading order…</div>;
  if (!order) return <div className="p-10 text-muted text-sm">Order not found.</div>;

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status as OrderStatus);
  const nextStatuses = ORDER_STATUS_FLOW.slice(currentIdx + 1);
  const isTerminal = TERMINAL.includes(order.status as OrderStatus);

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-xs tracking-widest uppercase text-muted mb-5">
        <Link to="/admin/orders" className="hover:text-gold">Orders</Link>
        <span className="mx-2">/</span>
        <span className="text-walnut">#{order.id.slice(0, 10).toUpperCase()}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-walnut text-3xl">Order #{order.id.slice(0, 10).toUpperCase()}</h1>
          <p className="text-muted text-sm mt-1">
            Placed {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <span className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm ${STATUS_COLOR[order.status] || STATUS_COLOR.pending}`}>
          {ORDER_STATUS_LABEL[order.status as OrderStatus] || order.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-5">
          {/* Items */}
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-lg font-display text-walnut mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map(it => (
                <div key={it.productId} className="flex gap-4 items-center">
                  <img src={it.image} alt={it.name} className="w-16 h-16 object-cover rounded-sm border border-line" />
                  <div className="flex-1">
                    <div className="text-walnut font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-muted">{it.category} · {it.wood} · Qty {it.qty}</div>
                  </div>
                  <div className="text-sm font-medium text-walnut">{formatPrice(it.price * it.qty)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-lg font-display text-walnut mb-4">Status History</h2>
            <div className="space-y-3">
              {(order.statusHistory || []).slice().reverse().map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-gold shrink-0 mt-1.5" />
                  <div>
                    <span className="font-medium text-walnut">
                      {ORDER_STATUS_LABEL[h.status as OrderStatus] || h.status}
                    </span>
                    {h.note && <span className="text-muted ml-2">— {h.note}</span>}
                    <div className="text-xs text-muted mt-0.5">
                      {new Date(h.at).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-lg font-display text-walnut mb-3">Shipping Address</h2>
            <div className="text-sm text-walnut-soft leading-relaxed">
              <div className="font-medium text-walnut">{order.shippingAddress.name}</div>
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}<br />
              Phone: {order.shippingAddress.phone}
            </div>
            {(order as any).trackingNumber && (
              <div className="mt-3 text-sm">
                <span className="text-muted">Tracking: </span>
                <span className="font-mono text-walnut">{(order as any).trackingNumber}</span>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          {/* Order summary */}
          <div className="bg-white border border-line rounded-xl p-6">
            <h3 className="text-lg font-display text-walnut mb-4">Summary</h3>
            <div className="space-y-2 text-sm text-walnut-soft mb-3">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span></div>
              <div className="flex justify-between"><span>GST</span><span>{formatPrice(order.tax)}</span></div>
            </div>
            <div className="flex justify-between pt-3 border-t border-line font-semibold text-walnut">
              <span>Total</span>
              <span className="font-display">{formatPrice(order.total)}</span>
            </div>
            <div className="mt-3 text-xs text-muted">
              Customer: {order.userPhone}
              {order.userEmail && <><br />{order.userEmail}</>}
            </div>
          </div>

          {/* Update status */}
          {!isTerminal && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h3 className="text-lg font-display text-walnut mb-4">Update Status</h3>

              <textarea
                placeholder="Add a note for the customer (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 border border-line rounded-sm text-sm resize-none outline-none focus:border-gold mb-3"
              />

              {nextStatuses.includes('shipped') && (
                <input
                  type="text"
                  placeholder="Tracking number (for Shipped)"
                  value={tracking}
                  onChange={e => setTracking(e.target.value)}
                  className="w-full px-3 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold mb-3"
                />
              )}

              {success && (
                <div className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-sm mb-3">
                  {success}
                </div>
              )}
              {error && (
                <div className="text-xs text-maroon bg-maroon/5 border border-maroon/20 px-3 py-2 rounded-sm mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                {nextStatuses.map(s => (
                  <button
                    key={s}
                    onClick={() => moveToStatus(s)}
                    disabled={busy}
                    className="w-full px-4 py-2.5 text-xs font-medium tracking-widest uppercase rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-50"
                  >
                    → {ORDER_STATUS_LABEL[s]}
                  </button>
                ))}
                <button
                  onClick={() => moveToStatus('cancelled')}
                  disabled={busy}
                  className="w-full px-4 py-2.5 text-xs font-medium tracking-widest uppercase rounded-sm border border-maroon/30 text-maroon hover:bg-maroon/5 transition-all disabled:opacity-50 mt-2"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          )}

          {isTerminal && (
            <div className="bg-white border border-line rounded-xl p-6 text-center text-sm text-muted">
              Order is <span className="font-medium text-walnut">{ORDER_STATUS_LABEL[order.status as OrderStatus]}</span>
            </div>
          )}

          {/* Tracking number — always editable once shipped */}
          {['shipped', 'delivered', 'packed'].includes(order.status) && (
            <div className="bg-white border border-line rounded-xl p-6">
              <h3 className="text-sm font-medium text-walnut mb-3 tracking-wide uppercase text-[11px]">Tracking Number</h3>
              {(order as any).trackingNumber && (
                <div className="font-mono text-sm text-walnut bg-cream-2 px-3 py-2 rounded-sm mb-3">
                  {(order as any).trackingNumber}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={(order as any).trackingNumber ? 'Update tracking number' : 'Enter tracking number'}
                  value={trackingEdit}
                  onChange={e => setTrackingEdit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveTracking()}
                  className="flex-1 px-3 py-2 border border-line rounded-sm text-sm outline-none focus:border-gold"
                />
                <button
                  onClick={saveTracking}
                  disabled={!trackingEdit.trim() || busy}
                  className="px-4 py-2 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink disabled:opacity-50 transition-all"
                >
                  {trackingSaved ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
