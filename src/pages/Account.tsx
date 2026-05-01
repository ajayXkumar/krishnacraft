import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import type { UserAddress } from '../store/AuthContext';
import AddressForm from '../components/AddressForm';
import ProfileGate from '../components/ProfileGate';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRightIcon } from '../components/Icons';

export default function Account() {
  return (
    <ProfileGate>
      <AccountInner />
    </ProfileGate>
  );
}

function AccountInner() {
  const { user, profile, signOut, refreshProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    displayName: profile?.displayName || '',
  });

  if (!user || !profile) return null;

  const saveAddress = async (a: UserAddress) => {
    setBusy(true);
    try {
      const existing = profile.addresses.filter(x => x.id !== a.id);
      const merged = [...existing, a];
      if (merged.length === 1) merged[0].isDefault = true;
      await updateDoc(doc(db, 'users', user.uid), { addresses: merged });
      await refreshProfile();
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteAddress = async (id: string) => {
    setBusy(true);
    try {
      const next = profile.addresses.filter(a => a.id !== id);
      await updateDoc(doc(db, 'users', user.uid), { addresses: next });
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (id: string) => {
    setBusy(true);
    try {
      const next = profile.addresses.map(a => ({ ...a, isDefault: a.id === id }));
      await updateDoc(doc(db, 'users', user.uid), { addresses: next });
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  };

  const startEditProfile = () => {
    setProfileForm({
      displayName: profile.displayName || '',
    });
    setEditingProfile(true);
    setProfileError('');
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setProfileError('');
    try {
      await updateUserProfile({
        displayName: profileForm.displayName.trim(),
      });
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <section className="bg-cream-2 pt-32 pb-14">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-walnut">Account</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
            Hello, {profile.displayName || 'Friend'}
          </h1>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 grid lg:grid-cols-[260px_1fr] gap-12">
          <aside>
            <nav className="bg-white border border-line rounded-xl p-5">
              <Link
                to="/account"
                className="block px-4 py-3 text-sm text-walnut bg-cream-2 rounded-sm font-medium"
              >
                Profile
              </Link>
              <Link
                to="/orders"
                className="block px-4 py-3 text-sm text-walnut hover:bg-cream-2 rounded-sm transition-colors"
              >
                My Orders
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-3 text-sm text-maroon hover:bg-maroon/5 rounded-sm transition-colors"
              >
                Sign Out
              </button>
            </nav>
          </aside>

          <div className="space-y-10">
            {/* Profile */}
            <div className="bg-white border border-line rounded-xl p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl">Profile</h3>
                {!editingProfile && (
                  <button
                    onClick={startEditProfile}
                    className="text-xs tracking-[0.15em] uppercase text-gold hover:text-walnut"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={saveProfile} className="space-y-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
                      Google Account
                    </label>
                    <div className="px-4 py-3 border border-line bg-cream-2 rounded-sm font-sans text-sm text-walnut">
                      {profile.email}
                    </div>
                    <div className="text-[11px] text-muted mt-2">
                      Managed by Google — cannot be changed here.
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={profileForm.displayName}
                      onChange={e =>
                        setProfileForm(s => ({ ...s, displayName: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-line bg-cream rounded-sm font-sans text-sm outline-none focus:border-gold"
                    />
                  </div>

                  {profileError && (
                    <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
                      {profileError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Name</div>
                    <div className="text-walnut">{profile.displayName || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Google Account</div>
                    <div className="text-walnut">{profile.email}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Addresses */}
            <div className="bg-white border border-line rounded-xl p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl">Saved Addresses</h3>
                {editing !== 'new' && (
                  <button
                    onClick={() => setEditing('new')}
                    className="text-xs tracking-[0.15em] uppercase text-gold hover:text-walnut"
                  >
                    + Add New
                  </button>
                )}
              </div>

              {editing === 'new' && (
                <div className="bg-cream-2 p-5 rounded-sm mb-6">
                  <h4 className="text-lg mb-4">New Address</h4>
                  <AddressForm onSubmit={saveAddress} busy={busy} submitLabel="Save Address" />
                  <button
                    onClick={() => setEditing(null)}
                    className="text-xs text-muted underline mt-3"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {profile.addresses.length === 0 && editing !== 'new' ? (
                <p className="text-muted text-sm">
                  No addresses saved yet. Add one to checkout faster.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.addresses.map(a => (
                    <div key={a.id} className="border border-line rounded-sm p-5">
                      {editing === a.id ? (
                        <>
                          <AddressForm
                            initial={a}
                            onSubmit={saveAddress}
                            busy={busy}
                            submitLabel="Update"
                          />
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs text-muted underline mt-3"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-walnut text-sm">{a.name}</div>
                            {a.isDefault && (
                              <span className="text-[10px] tracking-[0.15em] uppercase bg-gold text-white px-2 py-0.5 rounded-sm">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-walnut-soft leading-relaxed mb-3">
                            {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                            {a.city}, {a.state} — {a.pincode}<br />
                            Phone: {a.phone}
                          </div>
                          <div className="flex gap-3 text-[11px] tracking-[0.15em] uppercase">
                            <button
                              onClick={() => setEditing(a.id)}
                              className="text-walnut hover:text-gold"
                            >
                              Edit
                            </button>
                            {!a.isDefault && (
                              <button
                                onClick={() => setDefault(a.id)}
                                className="text-walnut hover:text-gold"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => deleteAddress(a.id)}
                              className="text-maroon hover:underline ml-auto"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-sm text-walnut hover:text-gold"
            >
              View order history <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
