import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetDashboardStats, type DashboardStats } from '../../firebase/adminOps';
import { formatPrice } from '../../data/products';
import { ORDER_STATUS_LABEL } from '../../types';
import type { OrderStatus } from '../../firebase/orders';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-muted text-sm">Loading dashboard…</div>
    );
  }

  if (!stats) return null;

  const activeCount = Object.entries(stats.ordersByStatus)
    .filter(([s]) => !['pending', 'delivered', 'failed', 'cancelled'].includes(s))
    .reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-walnut text-3xl">Dashboard</h1>
        <p className="text-muted text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), sub: 'all time' },
          { label: 'Today Revenue', value: formatPrice(stats.revenueToday), sub: 'today' },
          { label: 'Total Orders', value: stats.totalOrders.toString(), sub: 'all time' },
          { label: 'In Workshop', value: activeCount.toString(), sub: 'active' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-line rounded-xl p-5">
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">{card.label}</div>
            <div className="font-display text-walnut text-2xl">{card.value}</div>
            <div className="text-xs text-muted mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Recent orders */}
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <h2 className="font-display text-walnut text-lg">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs tracking-widest uppercase text-gold hover:text-walnut">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-line">
            {stats.recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted text-sm">No orders yet</div>
            ) : (
              stats.recentOrders.map(o => (
                <Link
                  key={o.id}
                  to={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-cream-2/50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-walnut">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {o.shippingAddress?.name} · {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm ${STATUS_COLOR[o.status] || STATUS_COLOR.pending}`}>
                      {ORDER_STATUS_LABEL[o.status as OrderStatus] || o.status}
                    </span>
                    <span className="text-sm font-medium text-walnut">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white border border-line rounded-xl overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-line">
            <h2 className="font-display text-walnut text-lg">By Status</h2>
          </div>
          <div className="px-4 py-3 space-y-1">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-1.5">
                <span className={`text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm ${STATUS_COLOR[status] || STATUS_COLOR.pending}`}>
                  {ORDER_STATUS_LABEL[status as OrderStatus] || status}
                </span>
                <span className="text-sm font-medium text-walnut">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
