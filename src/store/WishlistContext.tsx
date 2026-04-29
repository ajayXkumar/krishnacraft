import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const LS_KEY = 'wh_wishlist';

function readLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function writeLocal(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>(readLocal);

  // Load from Firestore when user signs in
  useEffect(() => {
    if (!user) {
      setIds(readLocal());
      return;
    }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        const remote: string[] = data.wishlist || [];
        // Merge local + remote
        const local = readLocal();
        const merged = Array.from(new Set([...remote, ...local]));
        setIds(merged);
        writeLocal(merged);
        if (merged.length !== remote.length) {
          updateDoc(doc(db, 'users', user.uid), { wishlist: merged }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [user]);

  const toggle = (productId: string) => {
    setIds(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      writeLocal(next);
      if (user) {
        updateDoc(doc(db, 'users', user.uid), { wishlist: next }).catch(() => {});
      }
      return next;
    });
  };

  return (
    <WishlistContext.Provider value={{
      ids,
      toggle,
      has: (id) => ids.includes(id),
      count: ids.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
