import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ArrowRightIcon } from './Icons';

interface Props {
  children: ReactNode;
  /** If true, render children even when profile is null (lets the page show its
   *  own empty/loading state, e.g. Orders page). Default false: show fallback. */
  allowMissing?: boolean;
}

/**
 * Renders children only when the user's Firestore profile is loaded.
 * If profile is loading, shows a spinner.
 * If profile failed to load, shows the actual error + a Retry button.
 * If profile is missing entirely (rare — Firestore write failed mid-signup),
 * offers an inline "set up your account" form.
 */
export default function ProfileGate({ children, allowMissing = false }: Props) {
  const {
    user,
    profile,
    profileLoading,
    profileError,
    refreshProfile,
    completeProfile,
  } = useAuth();

  if (profile) return <>{children}</>;

  // Still loading
  if (profileLoading) {
    return <Loading />;
  }

  // Failed to load
  if (profileError) {
    return <Failed error={profileError} retry={refreshProfile} />;
  }

  // Profile genuinely missing (signed in, no Firestore doc).
  // Either offer to recreate it, or skip if the page can handle missing.
  if (allowMissing) return <>{children}</>;

  return <CompleteProfile completeProfile={completeProfile} userPhone={user?.phoneNumber || ''} />;
}

function Loading() {
  return (
    <section className="pt-32 pb-20 min-h-[60vh]">
      <div className="max-w-md mx-auto px-5 lg:px-8 text-center">
        <div className="w-10 h-10 border-2 border-walnut/20 border-t-walnut rounded-full mx-auto mb-5 animate-spin" />
        <p className="text-muted text-sm">Loading your account…</p>
      </div>
    </section>
  );
}

function Failed({ error, retry }: { error: string; retry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    await retry();
    setBusy(false);
  };
  return (
    <section className="pt-32 pb-20 min-h-[60vh]">
      <div className="max-w-md mx-auto px-5 lg:px-8 text-center">
        <h2 className="text-3xl mb-3">Couldn't load your account</h2>
        <p className="text-muted text-sm mb-2">
          We hit a hiccup talking to our database.
        </p>
        <p className="text-[12px] text-muted mb-6 font-mono bg-cream-2 p-3 rounded-sm">
          {error}
        </p>
        <p className="text-[12px] text-muted mb-6 leading-relaxed">
          This is usually a network or extension issue. Try opening this site in
          an incognito window with extensions disabled.
        </p>
        <button
          onClick={handle}
          disabled={busy}
          className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
        >
          {busy ? 'Retrying…' : 'Retry'}
        </button>
        <Link
          to="/"
          className="block mt-4 text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}

function CompleteProfile({
  completeProfile,
  userPhone,
}: {
  completeProfile: (name: string, email?: string) => Promise<void>;
  userPhone: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await completeProfile(name.trim(), email.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 border border-line bg-cream rounded-sm font-sans text-sm outline-none focus:border-gold transition-colors';
  const labelCls = 'block text-[11px] tracking-[0.2em] uppercase text-muted mb-2';

  return (
    <section className="pt-32 pb-20 min-h-[60vh]">
      <div className="max-w-md mx-auto px-5 lg:px-8">
        <div className="text-center mb-8">
          <span className="section-tag">One Last Step</span>
          <h2 className="text-3xl mb-3">Complete Your Account</h2>
          <p className="text-muted text-sm">
            We're almost there — tell us your name to finish setting up.
          </p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl p-7 border border-line space-y-5">
          {userPhone && (
            <div>
              <label className={labelCls}>Mobile</label>
              <div className="px-4 py-3 border border-line bg-cream-2 rounded-sm font-sans text-sm text-walnut">
                {userPhone}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Full Name</label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          {error && (
            <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || name.trim().length < 2}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all disabled:opacity-60"
          >
            {busy ? 'Saving…' : <>Save & Continue <ArrowRightIcon /></>}
          </button>
        </form>
      </div>
    </section>
  );
}
