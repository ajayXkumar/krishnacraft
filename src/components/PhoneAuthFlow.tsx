import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ArrowRightIcon } from './Icons';

type Step = 'details' | 'phone' | 'otp' | 'profile';

interface Props {
  /** 'signup' collects name (and optional email) BEFORE phone. 'signin' goes straight to phone. */
  mode?: 'signin' | 'signup';
  /** Where to land after a successful sign-in or sign-up. Overridden by ?next= query param. */
  defaultNext?: string;
}

export default function PhoneAuthFlow({ mode = 'signin', defaultNext = '/account' }: Props) {
  const { sendOTP, verifyOTP, completeProfile, resetOTPSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || defaultNext;

  const [step, setStep] = useState<Step>(mode === 'signup' ? 'details' : 'phone');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const recaptchaId = useRef(`recaptcha-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    return () => {
      resetOTPSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  // Step 0 (signup only) — capture name + optional email before phone
  const handleDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    setStep('phone');
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendOTP(phone, recaptchaId.current);
      setStep('otp');
      setResendIn(30);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { isNewUser } = await verifyOTP(otp);

      if (isNewUser) {
        if (mode === 'signup') {
          // We already collected name + email at step 'details' — save profile and finish.
          await completeProfile(name.trim(), email.trim() || undefined);
          navigate(next, { replace: true });
        } else {
          // Sign-in flow but the user is new → ask for profile inline.
          setStep('profile');
        }
      } else {
        // Existing user. Their saved profile is preserved; no re-prompt.
        navigate(next, { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not verify code';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await completeProfile(name.trim(), email.trim() || undefined);
      navigate(next, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save profile';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full px-4 py-3 border border-line bg-cream rounded-sm font-sans text-sm outline-none focus:border-gold transition-colors';
  const labelCls = 'block text-[11px] tracking-[0.2em] uppercase text-muted mb-2';

  return (
    <div className="bg-white rounded-xl p-8 border border-line">
      {/* Invisible reCAPTCHA mount point */}
      <div id={recaptchaId.current} />

      {step === 'details' && (
        <form onSubmit={handleDetails} className="space-y-5">
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
              placeholder="Your full name"
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
            <div className="text-[11px] text-muted mt-2">
              For order receipts and updates. Not required.
            </div>
          </div>

          {error && (
            <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
          >
            Continue <ArrowRightIcon />
          </button>
        </form>
      )}

      {step === 'phone' && (
        <form onSubmit={handleSendOTP} className="space-y-5">
          {mode === 'signup' && name && (
            <div className="text-sm text-muted">
              Hi <span className="text-walnut font-medium">{name}</span> — enter your mobile number to verify.
            </div>
          )}
          <div>
            <label className={labelCls}>Mobile Number</label>
            <div className="flex gap-2">
              <span className="px-4 py-3 border border-line bg-cream-2 rounded-sm font-sans text-sm text-walnut">
                +91
              </span>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="text-[11px] text-muted mt-2">
              We'll send you a one-time code via SMS.
            </div>
          </div>

          {error && (
            <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || phone.length !== 10}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
          >
            {busy ? 'Sending OTP…' : <>Send OTP <ArrowRightIcon /></>}
          </button>

          {mode === 'signup' && (
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setError('');
              }}
              className="block text-center w-full text-xs tracking-[0.15em] uppercase text-muted hover:text-walnut"
            >
              ← Back
            </button>
          )}
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP} className="space-y-5">
          <div className="text-sm text-muted">
            Enter the 6-digit code sent to{' '}
            <span className="text-walnut font-medium">+91 {phone}</span>{' '}
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
                resetOTPSession();
              }}
              className="text-gold underline ml-1"
            >
              change
            </button>
          </div>

          <div>
            <label className={labelCls}>One-Time Password</label>
            <input
              type="text"
              required
              pattern="[0-9]{6}"
              inputMode="numeric"
              placeholder="6-digit code"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${inputCls} text-center text-xl tracking-[0.5em] font-medium`}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
          >
            {busy
              ? mode === 'signup'
                ? 'Creating account…'
                : 'Verifying…'
              : (
                <>
                  {mode === 'signup' ? 'Verify & Create Account' : 'Verify & Sign In'}
                  <ArrowRightIcon />
                </>
              )}
          </button>

          <div className="text-center text-[12px]">
            {resendIn > 0 ? (
              <span className="text-muted">Resend code in {resendIn}s</span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOTP()}
                className="text-gold underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleCompleteProfile} className="space-y-5">
          <div className="text-sm text-walnut">
            Welcome! Tell us a little about yourself to finish creating your account.
          </div>

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
            <div className="text-[11px] text-muted mt-2">
              Optional — for order confirmations and receipts.
            </div>
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
            {busy ? 'Saving…' : <>Create Account <ArrowRightIcon /></>}
          </button>
        </form>
      )}
    </div>
  );
}
