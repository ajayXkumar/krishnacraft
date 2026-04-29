import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './config';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;     // 1–5
  title: string;
  body: string;
  createdAt: number;
  featured?: boolean; // admin can feature for homepage
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
}

export async function getFeaturedReviews(limit = 6): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('featured', '==', true),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs
    .slice(0, limit)
    .map(d => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
}

export async function hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
  const q = query(
    collection(db, 'reviews'),
    where('userId', '==', userId),
    where('productId', '==', productId),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function submitReview(review: Omit<Review, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'reviews'), review);
  return ref.id;
}
