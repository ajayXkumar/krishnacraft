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
      .sort((a, b) => {
        // In-stock items first, then sort by sortOrder within each group
        const aOut = (a as any).inStock === false ? 1 : 0;
        const bOut = (b as any).inStock === false ? 1 : 0;
        if (aOut !== bOut) return aOut - bOut;
        return ((a as any).sortOrder ?? 999) - ((b as any).sortOrder ?? 999);
      });
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
