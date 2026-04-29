import { useState } from 'react';
import type { UserAddress } from '../store/AuthContext';

interface Props {
  initial?: Partial<UserAddress>;
  onSubmit: (a: UserAddress) => void | Promise<void>;
  submitLabel?: string;
  busy?: boolean;
}

const empty: Omit<UserAddress, 'id'> = {
  name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

export default function AddressForm({
  initial,
  onSubmit,
  submitLabel = 'Save Address',
  busy = false,
}: Props) {
  const [form, setForm] = useState<Omit<UserAddress, 'id'>>({
    ...empty,
    ...initial,
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(s => ({ ...s, [k]: e.target.value }));

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const id = initial?.id || `addr_${Date.now()}`;
    onSubmit({ id, ...form });
  };

  const inputCls =
    'w-full px-4 py-3 border border-line bg-cream rounded-sm font-sans text-sm outline-none focus:border-gold transition-colors';
  const labelCls = 'block text-[11px] tracking-[0.2em] uppercase text-muted mb-2';

  return (
    <form onSubmit={handle} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Full Name</label>
          <input required value={form.name} onChange={update('name')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            required
            type="tel"
            pattern="[0-9]{10}"
            placeholder="10-digit number"
            value={form.phone}
            onChange={update('phone')}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Address Line 1</label>
        <input
          required
          value={form.line1}
          onChange={update('line1')}
          placeholder="Flat / House no., Building"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Address Line 2 (optional)</label>
        <input
          value={form.line2 || ''}
          onChange={update('line2')}
          placeholder="Area, Landmark"
          className={inputCls}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <div>
          <label className={labelCls}>City</label>
          <input required value={form.city} onChange={update('city')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input required value={form.state} onChange={update('state')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Pincode</label>
          <input
            required
            pattern="[0-9]{6}"
            value={form.pincode}
            onChange={update('pincode')}
            className={inputCls}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
