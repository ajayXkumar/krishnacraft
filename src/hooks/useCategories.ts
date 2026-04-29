import { useEffect, useState } from 'react';
import { getSiteSettings } from '../firebase/siteSettings';

const DEFAULT_CATEGORIES = ['Ladoo Gopal', 'Beds', 'Almirahs', 'Doors', 'Tables'];

let cached: string[] | null = null;
const listeners: Array<(cats: string[]) => void> = [];

export function notifyCategoryChange(cats: string[]) {
  cached = cats;
  listeners.forEach(fn => fn(cats));
}

export function useCategories(): string[] {
  const [categories, setCategories] = useState<string[]>(cached ?? DEFAULT_CATEGORIES);

  useEffect(() => {
    listeners.push(setCategories);

    if (!cached) {
      getSiteSettings().then(s => {
        cached = s.categories;
        listeners.forEach(fn => fn(s.categories));
      });
    }

    return () => {
      const idx = listeners.indexOf(setCategories);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return categories;
}
