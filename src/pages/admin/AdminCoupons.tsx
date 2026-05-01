import { useEffect, useState } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Coupon } from '../../firebase/coupons';
import Select from '../../components/Select';

const EMPTY: Omit<Coupon, 'code'> = {
  type: 'percent',
  value: 10,
  minOrder: undefined,
  active: true,
  usageLimit: undefined,
  usedCount: 0,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Coupon, 'code'> & { code: string }>({ code: '', ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = () => {
    setLoading(true);
    getDocs(collection(db, 'coupons'))
      .then(snap => setCoupons(snap.docs.map(d => d.data() as Coupon)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return setError('Coupon code is required.');
    setSaving(true); setError('');
    try {
      const code = form.code.trim().toUpperCase();
      await setDoc(doc(db, 'coupons', code), {
        code,
        type: form.type,
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        active: form.active,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        usedCount: form.usedCount ?? 0,
      });
      setForm({ code: '', ...EMPTY });
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    await updateDoc(doc(db, 'coupons', c.code), { active: !c.active });
    setCoupons(prev => prev.map(x => x.code === c.code ? { ...x, active: !x.active } : x));
  };

  const deleteCoupon = async (code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await deleteDoc(doc(db, 'coupons', code));
    setCoupons(prev => prev.filter(x => x.code !== code));
  };

  const startEdit = (c: Coupon) => {
    setForm({ ...c });
    setEditing(true);
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-walnut text-3xl">Coupons</h1>
        {!editing && (
          <button
            onClick={() => { setForm({ code: '', ...EMPTY }); setEditing(true); }}
            className="px-5 py-2.5 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink transition-all"
          >
            + New Coupon
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-line rounded-xl p-7 mb-8 space-y-4">
          <h2 className="text-lg font-medium text-walnut mb-2">{form.usedCount === 0 && !coupons.find(c => c.code === form.code.toUpperCase()) ? 'New Coupon' : 'Edit Coupon'}</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Code *</label>
              <input
                required value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WOOD20"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Type</label>
              <Select
                value={form.type}
                onChange={val => setForm(p => ({ ...p, type: val as 'percent' | 'flat' }))}
                options={[
                  { value: 'percent', label: 'Percent (%)' },
                  { value: 'flat', label: 'Flat (₹)' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
                Value ({form.type === 'percent' ? '%' : '₹'}) *
              </label>
              <input
                required type="number" min={1} value={form.value}
                onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Min Order (₹)</label>
              <input
                type="number" min={0} value={form.minOrder ?? ''}
                onChange={e => setForm(p => ({ ...p, minOrder: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="No minimum"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Usage Limit</label>
              <input
                type="number" min={1} value={form.usageLimit ?? ''}
                onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="Unlimited"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[11px] tracking-[0.2em] uppercase text-muted">Active</label>
            <button type="button" onClick={() => setForm(p => ({ ...p, active: !p.active }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.active ? 'bg-walnut' : 'bg-line'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.active ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {error && <p className="text-xs text-maroon">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink transition-all disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Coupon'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="px-6 py-2.5 text-xs tracking-widest uppercase border border-line text-muted rounded-sm hover:text-walnut transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">No coupons yet.</div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-cream-2">
              <tr>
                {['Code', 'Type', 'Value', 'Min Order', 'Used', 'Active', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] tracking-[0.15em] uppercase text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map(c => (
                <tr key={c.code} className="hover:bg-cream-2/50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-walnut">{c.code}</td>
                  <td className="px-5 py-3 text-muted capitalize">{c.type}</td>
                  <td className="px-5 py-3 text-walnut">{c.type === 'percent' ? `${c.value}%` : `₹${c.value.toLocaleString('en-IN')}`}</td>
                  <td className="px-5 py-3 text-muted">{c.minOrder ? `₹${c.minOrder.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-5 py-3 text-muted">{c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(c)}
                      className={`relative w-9 h-[18px] rounded-full transition-colors ${c.active ? 'bg-walnut' : 'bg-line'}`}>
                      <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${c.active ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(c)} className="text-xs text-gold hover:text-walnut">Edit</button>
                      <button onClick={() => deleteCoupon(c.code)} className="text-xs text-maroon/60 hover:text-maroon">Delete</button>
                    </div>
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
