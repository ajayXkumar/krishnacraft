import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import GoogleAuthButton from './GoogleAuthButton';

interface Props {
  children: ReactNode;
  allowMissing?: boolean;
}

export default function ProfileGate({ children, allowMissing = false }: Props) {
  const { user, profile, profileLoading, profileError, refreshProfile } = useAuth();

  if (profile) return <>{children}</>;
  if (profileLoading) return <Loading />;
  if (profileError) return <Failed error={profileError} retry={refreshProfile} />;

  // Not signed in at all
  if (!user) return <SignInPrompt />;

  // Signed in but Firestore doc missing (rare edge case — retry re-creates it)
  if (allowMissing) return <>{children}</>;

  return <RetryProfile retry={refreshProfile} />;
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
        <p className="text-muted text-sm mb-2">We hit a hiccup talking to our database.</p>
        <p className="text-[12px] text-muted mb-6 font-mono bg-cream-2 p-3 rounded-sm">{error}</p>
        <p className="text-[12px] text-muted mb-6 leading-relaxed">
          Usually a network or extension issue. Try opening in incognito with extensions disabled.
        </p>
        <button
          onClick={handle}
          disabled={busy}
          className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
        >
          {busy ? 'Retrying…' : 'Retry'}
        </button>
        <Link to="/" className="block mt-4 text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut">
          Back to Home
        </Link>
      </div>
    </section>
  );
}

function SignInPrompt() {
  return (
    <section className="pt-32 pb-20 min-h-[60vh]">
      <div className="max-w-sm mx-auto px-5 lg:px-8 text-center">
        <h2 className="text-3xl mb-3">Sign in to continue</h2>
        <p className="text-muted text-sm mb-8">You need an account to access this page.</p>
        <GoogleAuthButton />
      </div>
    </section>
  );
}

function RetryProfile({ retry }: { retry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    await retry();
    setBusy(false);
  };
  return (
    <section className="pt-32 pb-20 min-h-[60vh]">
      <div className="max-w-md mx-auto px-5 lg:px-8 text-center">
        <h2 className="text-3xl mb-3">Profile not found</h2>
        <p className="text-muted text-sm mb-6">
          Your account data didn't save properly. Try signing in again.
        </p>
        <button
          onClick={handle}
          disabled={busy}
          className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
        >
          {busy ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    </section>
  );
}
