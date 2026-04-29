import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import type { Category } from '../types';

export interface SiteSettings {
  heroImage: string;
  artisanImage: string;
  categoryImages: Partial<Record<Category, string>>;
  categories: string[];
}

const DEFAULTS: SiteSettings = {
  heroImage: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=2200&q=85',
  artisanImage: 'https://i.pinimg.com/1200x/55/29/82/552982431c45ab8479c50edd7c6575de.jpg',
  categoryImages: {},
  categories: ['Ladoo Gopal', 'Beds', 'Almirahs', 'Doors', 'Tables'],
};

const REF = () => doc(db, 'siteSettings', 'main');

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(REF());
    if (!snap.exists()) return DEFAULTS;
    const data = snap.data() as Partial<SiteSettings>;
    return {
      heroImage: data.heroImage || DEFAULTS.heroImage,
      artisanImage: data.artisanImage || DEFAULTS.artisanImage,
      categoryImages: data.categoryImages || {},
      categories: data.categories?.length ? data.categories : DEFAULTS.categories,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function updateSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  await setDoc(REF(), patch, { merge: true });
}
