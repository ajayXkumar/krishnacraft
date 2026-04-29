import { doc, getDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from './config';

export interface Coupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;        // % or ₹ off
  minOrder?: number;    // min subtotal to apply
  active: boolean;
  usageLimit?: number;
  usedCount?: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ discount: number; coupon: Coupon }> {
  const snap = await getDoc(doc(db, 'coupons', code.toUpperCase().trim()));
  if (!snap.exists()) throw new Error('Invalid coupon code.');

  const coupon = snap.data() as Coupon;
  if (!coupon.active) throw new Error('This coupon is no longer active.');
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    throw new Error(`Minimum order of ₹${coupon.minOrder.toLocaleString('en-IN')} required.`);
  }
  if (coupon.usageLimit != null && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
    throw new Error('This coupon has reached its usage limit.');
  }

  const discount = coupon.type === 'percent'
    ? Math.round(subtotal * coupon.value / 100)
    : coupon.value;

  return { discount: Math.min(discount, subtotal), coupon };
}

export async function redeemCoupon(code: string): Promise<void> {
  await updateDoc(doc(db, 'coupons', code.toUpperCase().trim()), {
    usedCount: increment(1),
  });
}
