import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFirestoreProducts } from '../firebase/productsClient';
import { formatPrice } from '../data/products';
import type { Product } from '../types';
import { CloseIcon, SearchIcon } from './Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all products once on first open
  const loadedRef = useRef(false);
  useEffect(() => {
    if (open && !loadedRef.current) {
      setLoading(true);
      getFirestoreProducts()
        .then(p => { setProducts(p); loadedRef.current = true; })
        .finally(() => setLoading(false));
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = q.length < 2
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.desc?.toLowerCase().includes(q) ||
        p.wood?.toLowerCase().includes(q)
      ).slice(0, 8);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 bg-cream w-full shadow-2xl">
        <div className="max-w-[760px] mx-auto px-5 py-5">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b-2 border-walnut pb-3">
            <SearchIcon size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products by name, category, wood type…"
              className="flex-1 bg-transparent text-lg text-walnut placeholder-muted outline-none"
            />
            <button
              onClick={onClose}
              aria-label="Close search"
              className="text-muted hover:text-walnut transition-colors"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="py-3 max-h-[70vh] overflow-y-auto">
            {loading && (
              <div className="text-sm text-muted py-4 text-center">Loading…</div>
            )}

            {!loading && q.length >= 2 && results.length === 0 && (
              <div className="text-sm text-muted py-6 text-center">
                No products found for "<span className="text-walnut">{query}</span>"
              </div>
            )}

            {!loading && q.length < 2 && (
              <div className="text-xs text-muted py-4 text-center tracking-wider uppercase">
                Type at least 2 characters to search
              </div>
            )}

            {results.length > 0 && (
              <ul className="divide-y divide-line">
                {results.map(p => (
                  <li key={p.id}>
                    <Link
                      to={`/product/${p.id}`}
                      onClick={onClose}
                      className="flex items-center gap-4 py-3 hover:bg-cream-2 px-2 rounded-sm transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-sm overflow-hidden bg-cream-2 shrink-0">
                        <img
                          src={p.img}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-walnut group-hover:text-gold transition-colors truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-muted mt-0.5">{p.category}</div>
                      </div>
                      <div className="text-sm font-medium text-walnut shrink-0">
                        {formatPrice(p.price)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
