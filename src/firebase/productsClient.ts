import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './config';
import type { Product } from '../types';
import { PRODUCTS } from '../data/products';

export async function getFirestoreProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) return PRODUCTS;
    return snap.docs
      .map(d => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
      .filter(p => (p as any).inStock !== false)
      .sort((a, b) => ((a as any).sortOrder ?? 999) - ((b as any).sortOrder ?? 999));
  } catch {
    return PRODUCTS;
  }
}

export async function getFirestoreProductById(id: string): Promise<Product | undefined> {
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
    }
    return PRODUCTS.find(p => p.id === id);
  } catch {
    return PRODUCTS.find(p => p.id === id);
  }
}
