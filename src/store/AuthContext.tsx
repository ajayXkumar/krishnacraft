import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as fbSignOut,
  updateProfile,
  getAdditionalUserInfo,
} from 'firebase/auth';
import type { User, ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export interface UserAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  phone: string;
  displayName: string;
  email?: string;
  addresses: UserAddress[];
  role?: 'admin' | 'customer';
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  // Phone OTP flow
  sendOTP: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<{ isNewUser: boolean }>;
  resetOTPSession: () => void;
  // Profile management
  completeProfile: (name: string, email?: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; email?: string }) => Promise<void>;
  // Auth
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Convert any input (with or without country code) to E.164 +91xxxxxxxxxx for India.
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (input.startsWith('+')) return input.replace(/\s/g, '');
  return `+${digits}`;
}

// Reject a promise after `ms` if it hasn't settled.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then(v => {
      window.clearTimeout(timer);
      resolve(v);
    }).catch(err => {
      window.clearTimeout(timer);
      reject(err);
    });
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // loadProfile NEVER throws and NEVER hangs — it sets profile=null on any error.
  // The OTP/auth flow doesn't depend on this; it runs in background.
  const loadProfile = async (u: User) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const ref = doc(db, 'users', u.uid);
      const snap = await withTimeout(getDoc(ref), 15000, 'Loading profile');
      if (snap.exists()) {
        const data = snap.data() as Omit<UserProfile, 'uid'>;
        setProfile({ uid: u.uid, ...data });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[Auth] loadProfile failed:', err);
      setProfile(null);
      setProfileError(
        err instanceof Error ? err.message : 'Failed to load profile',
      );
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        // Fire-and-forget — don't block the UI on profile load.
        loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearRecaptcha = () => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* ignore */
    }
    recaptchaRef.current = null;
  };

  const sendOTP = async (phoneNumber: string, recaptchaContainerId: string) => {
    const e164 = normalizePhone(phoneNumber);
    if (!/^\+\d{11,15}$/.test(e164)) {
      throw new Error('Enter a valid 10-digit mobile number.');
    }

    clearRecaptcha();
    recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });

    confirmationRef.current = await signInWithPhoneNumber(
      auth,
      e164,
      recaptchaRef.current,
    );
  };

  // verifyOTP no longer touches Firestore. It uses Firebase Auth's own
  // `getAdditionalUserInfo().isNewUser`, returned directly in the OTP response.
  // This means a blocked Firestore endpoint can NEVER hang the OTP step.
  const verifyOTP = async (otp: string) => {
    if (!confirmationRef.current) {
      throw new Error('OTP session expired. Please request a new code.');
    }
    const cred = await confirmationRef.current.confirm(otp);
    const additionalInfo = getAdditionalUserInfo(cred);
    const isNewUser = additionalInfo?.isNewUser ?? false;

    confirmationRef.current = null;
    clearRecaptcha();
    return { isNewUser };
  };

  const resetOTPSession = () => {
    confirmationRef.current = null;
    clearRecaptcha();
  };

  // setDoc with merge: true so calling this for an existing user doesn't wipe
  // their addresses or other profile fields — only updates name/email.
  const completeProfile = async (name: string, email?: string) => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    const u = auth.currentUser;
    const phone = u.phoneNumber || '';

    if (name) await updateProfile(u, { displayName: name });

    const profileDoc: Record<string, unknown> = {
      phone,
      displayName: name,
      email: email || '',
    };

    // Only set createdAt + addresses on first creation. The merge below preserves
    // any pre-existing values for these fields.
    const ref = doc(db, 'users', u.uid);
    const existing = await withTimeout(getDoc(ref), 15000, 'Saving profile').catch(
      () => null,
    );
    if (!existing || !existing.exists()) {
      profileDoc.createdAt = serverTimestamp();
      profileDoc.addresses = [];
    }

    await withTimeout(
      setDoc(ref, profileDoc, { merge: true }),
      15000,
      'Saving profile',
    );
    await loadProfile(u);
  };

  const updateUserProfile = async (updates: { displayName?: string; email?: string }) => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    const u = auth.currentUser;

    if (updates.displayName !== undefined) {
      await updateProfile(u, { displayName: updates.displayName });
    }

    const docUpdates: Record<string, string> = {};
    if (updates.displayName !== undefined) docUpdates.displayName = updates.displayName;
    if (updates.email !== undefined) docUpdates.email = updates.email;

    if (Object.keys(docUpdates).length > 0) {
      await withTimeout(
        updateDoc(doc(db, 'users', u.uid), docUpdates),
        15000,
        'Updating profile',
      );
    }
    await loadProfile(u);
  };

  const signOut = async () => {
    await fbSignOut(auth);
    confirmationRef.current = null;
    clearRecaptcha();
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        loading,
        profileLoading,
        profileError,
        sendOTP,
        verifyOTP,
        resetOTPSession,
        completeProfile,
        updateUserProfile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
