import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetAllOrders } from '../../firebase/adminOps';
import { formatPrice } from '../../data/products';
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW, type OrderStatus } from '../../types';
import type { Order } from '../../firebase/orders';
import Select from '../../components/Select';

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

const ALL_STATUSES: OrderStatus[] = [
  ...ORDER_STATUS_FLOW,
  'failed',
  'cancelled',
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminGetAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || o.id.toLowerCase().includes(q)
      || o.shippingAddress?.name?.toLowerCase().includes(q)
      || o.userPhone?.includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-walnut text-3xl">Orders</h1>
        <p className="text-muted text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search order ID, name, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-line rounded-sm text-sm bg-white outline-none focus:border-gold w-full sm:w-72"
        />
        <Select
          value={filter}
          onChange={val => setFilter(val as OrderStatus | 'all')}
          options={[
            { value: 'all', label: 'All statuses' },
            ...ALL_STATUSES.map(s => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
          ]}
          className="w-52"
          size="sm"
        />
      </div>

      {loading ? (
        <div className="text-muted text-sm py-10 text-center">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-10 text-center text-muted text-sm">
          No orders found
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-cream-2 border-b border-line">
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] tracking-[0.2em] uppercase text-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-cream-2/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-walnut">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-walnut font-medium">{o.shippingAddress?.name}</div>
                    <div className="text-muted text-xs">{o.userPhone}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {o.items.slice(0, 3).map(it => (
                        <img key={it.productId} src={it.image} alt={it.name}
                          className="w-9 h-9 object-cover rounded-sm border border-line" />
                      ))}
                      {o.items.length > 3 && (
                        <div className="w-9 h-9 rounded-sm bg-cream-2 flex items-center justify-center text-xs text-muted">
                          +{o.items.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-walnut">{formatPrice(o.total)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm ${STATUS_COLOR[o.status] || STATUS_COLOR.pending}`}>
                      {ORDER_STATUS_LABEL[o.status as OrderStatus] || o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted text-xs">
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/admin/orders/${o.id}`}
                      className="text-[11px] tracking-widest uppercase text-gold hover:text-walnut">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
