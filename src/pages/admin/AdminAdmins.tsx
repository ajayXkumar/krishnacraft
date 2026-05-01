import { useEffect, useState } from 'react';
import { listAdmins, addAdmin, removeAdmin, type AdminRecord } from '../../firebase/adminOps';
import { useAuth } from '../../store/AuthContext';

export default function AdminAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUid, setNewUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () =>
    listAdmins()
      .then(setAdmins)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newUid.trim()) return;
    setBusy(true);
    try {
      await addAdmin(newUid.trim());
      setSuccess('Admin added successfully.');
      setNewUid('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (uid: string) => {
    if (uid === user?.uid) {
      setError("You can't remove yourself.");
      return;
    }
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      await removeAdmin(uid);
      setSuccess('Admin removed.');
      await load();
    } catch {
      setError('Failed to remove admin.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-walnut text-3xl">Admins</h1>
        <p className="text-muted text-sm mt-1">
          Manage who has access to this admin panel.
        </p>
      </div>

      {/* Your UID */}
      <div className="bg-cream-2 border border-line rounded-xl p-5 mb-8">
        <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Your UID</div>
        <div className="font-mono text-sm text-walnut break-all">{user?.uid}</div>
        <div className="text-[11px] text-muted mt-2">
          Share this with another admin to grant you access, or copy it to add yourself.
        </div>
      </div>

      {/* Current admins */}
      <div className="bg-white border border-line rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="text-base font-medium text-walnut">Current Admins</h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-muted text-sm text-center">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-8 text-muted text-sm text-center">No admins yet.</div>
        ) : (
          <ul className="divide-y divide-line">
            {admins.map(a => (
              <li key={a.uid} className="flex items-center justify-between px-6 py-4 gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-walnut truncate">
                    {a.displayName || '—'}
                    {a.uid === user?.uid && (
                      <span className="ml-2 text-[10px] tracking-[0.15em] uppercase bg-gold/15 text-gold px-2 py-0.5 rounded-sm">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted truncate">{a.email}</div>
                  <div className="font-mono text-[11px] text-muted/60 truncate">{a.uid}</div>
                </div>
                <button
                  onClick={() => handleRemove(a.uid)}
                  disabled={busy || a.uid === user?.uid}
                  className="shrink-0 text-[11px] tracking-[0.15em] uppercase text-maroon hover:underline disabled:opacity-30"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add admin */}
      <div className="bg-white border border-line rounded-xl p-6">
        <h2 className="text-base font-medium text-walnut mb-4">Add Admin by UID</h2>
        <p className="text-xs text-muted mb-5 leading-relaxed">
          The person must sign in to the website with Google first so their account exists.
          Then paste their UID below.
        </p>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
              User UID
            </label>
            <input
              type="text"
              value={newUid}
              onChange={e => setNewUid(e.target.value)}
              placeholder="Paste UID here…"
              className="w-full px-4 py-3 border border-line bg-cream rounded-sm font-mono text-sm outline-none focus:border-gold transition-colors"
            />
          </div>

          {error && (
            <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="text-[13px] text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !newUid.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
          >
            {busy ? 'Adding…' : 'Grant Admin Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
