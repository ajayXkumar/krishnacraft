import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
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
  displayName: string;
  email: string;
  addresses: UserAddress[];
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then(v => { window.clearTimeout(timer); resolve(v); })
     .catch(err => { window.clearTimeout(timer); reject(err); });
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = async (u: User) => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      // Load user profile and admin status in parallel
      const [profileSnap, adminSnap] = await Promise.all([
        withTimeout(getDoc(doc(db, 'users', u.uid)), 15000, 'Loading profile'),
        withTimeout(getDoc(doc(db, 'admins', u.uid)), 15000, 'Checking admin'),
      ]);

      if (profileSnap.exists()) {
        setProfile({ uid: u.uid, ...(profileSnap.data() as Omit<UserProfile, 'uid'>) });
      } else {
        setProfile(null);
      }

      setIsAdmin(adminSnap.exists());
    } catch (err) {
      console.error('[Auth] loadProfile failed:', err);
      setProfile(null);
      setIsAdmin(false);
      setProfileError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        loadProfile(u);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const u = cred.user;

    const ref = doc(db, 'users', u.uid);
    const snap = await withTimeout(getDoc(ref), 15000, 'Checking profile');

    if (!snap.exists()) {
      await withTimeout(
        setDoc(ref, {
          displayName: u.displayName || '',
          email: u.email || '',
          addresses: [],
          createdAt: serverTimestamp(),
        }),
        15000,
        'Creating profile',
      );
    }
    await loadProfile(u);
  };

  const updateUserProfile = async (updates: { displayName?: string }) => {
    if (!auth.currentUser) throw new Error('Not signed in.');
    const u = auth.currentUser;

    if (updates.displayName !== undefined) {
      await updateProfile(u, { displayName: updates.displayName });
    }

    const docUpdates: Record<string, string> = {};
    if (updates.displayName !== undefined) docUpdates.displayName = updates.displayName;

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
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        profileLoading,
        profileError,
        signInWithGoogle,
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
