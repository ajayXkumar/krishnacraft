import { useEffect, useState } from 'react';
import { adminGetCustomers, type CustomerWithOrders } from '../../firebase/adminOps';
import { formatPrice } from '../../data/products';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminGetCustomers()
      .then(list => setCustomers(list.sort((a, b) => (b.lastOrderAt || 0) - (a.lastOrderAt || 0))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q
      || c.displayName?.toLowerCase().includes(q)
      || c.phone?.includes(q)
      || c.email?.toLowerCase().includes(q);
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-walnut text-3xl">Customers</h1>
        <p className="text-muted text-sm mt-1">{customers.length} registered customers</p>
      </div>

      <input
        type="text"
        placeholder="Search by name, phone, or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="px-4 py-2 border border-line rounded-sm text-sm bg-white outline-none focus:border-gold w-80 mb-6"
      />

      {loading ? (
        <div className="text-muted text-sm py-10 text-center">Loading customers…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-10 text-center text-muted text-sm">
          No customers found
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-2 border-b border-line">
              <tr>
                {['Customer', 'Phone', 'Orders', 'Total Spent', 'Last Order'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] tracking-[0.2em] uppercase text-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(c => (
                <tr key={c.uid} className="hover:bg-cream-2/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-walnut">{c.displayName || '—'}</div>
                    {c.email && <div className="text-xs text-muted">{c.email}</div>}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-walnut-soft">{c.phone}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm ${
                      c.orderCount > 0 ? 'bg-gold/10 text-gold' : 'bg-cream-2 text-muted'
                    }`}>
                      {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-walnut">
                    {c.totalSpent > 0 ? formatPrice(c.totalSpent) : '—'}
                  </td>
                  <td className="px-5 py-4 text-muted text-xs">
                    {c.lastOrderAt
                      ? new Date(c.lastOrderAt).toLocaleDateString('en-IN')
                      : '—'}
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
