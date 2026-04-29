import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '../types';
import { findProduct } from '../data/products';

const CART_KEY = 'wooden_heritage_cart';

type CartAction =
  | { type: 'add'; id: string; qty?: number }
  | { type: 'remove'; id: string }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'clear' }
  | { type: 'load'; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'load':
      return action.items;
    case 'add': {
      const existing = state.find(i => i.id === action.id);
      if (existing) {
        return state.map(i =>
          i.id === action.id ? { ...i, qty: i.qty + (action.qty ?? 1) } : i,
        );
      }
      return [...state, { id: action.id, qty: action.qty ?? 1 }];
    }
    case 'remove':
      return state.filter(i => i.id !== action.id);
    case 'setQty':
      return state.map(i =>
        i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i,
      );
    case 'clear':
      return [];
    default:
      return state;
  }
}

export interface AppliedCoupon {
  code: string;
  discount: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  isOpen: boolean;
  toast: string | null;
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  showToast: (msg: string) => void;
  setAppliedCoupon: (c: AppliedCoupon | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) dispatch({ type: 'load', items: parsed });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // persist
  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const add = useCallback(
    (id: string, qty = 1) => {
      dispatch({ type: 'add', id, qty });
      showToast('Added to cart');
    },
    [showToast],
  );
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const setQty = useCallback(
    (id: string, qty: number) => dispatch({ type: 'setQty', id, qty }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(o => !o), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => {
    const p = findProduct(i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
  // Tiered shipping: free above ₹50k, ₹999 up to ₹10k, ₹1499 up to ₹25k, ₹1999 up to ₹50k
  const shipping = subtotal === 0 ? 0
    : subtotal >= 50000 ? 0
    : subtotal >= 25000 ? 1999
    : subtotal >= 10000 ? 1499
    : 999;
  const tax = Math.round(subtotal * 0.05);
  const discount = appliedCoupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shipping + tax - discount);

  // lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    appliedCoupon,
    isOpen,
    toast,
    add,
    remove,
    setQty,
    clear,
    openCart,
    closeCart,
    toggleCart,
    showToast,
    setAppliedCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
