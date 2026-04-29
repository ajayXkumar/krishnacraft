import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../store/WishlistContext';
import { getFirestoreProducts } from '../firebase/productsClient';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { ids, count } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFirestoreProducts()
      .then(all => setProducts(all.filter(p => ids.includes(p.id))))
      .finally(() => setLoading(false));
  // Re-run whenever wishlist changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <>
      <section className="bg-cream-2 pt-32 pb-12">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-walnut">Wishlist</span>
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
            My Wishlist
          </h1>
          {!loading && count > 0 && (
            <p className="text-muted mt-2">{count} saved {count === 1 ? 'piece' : 'pieces'}</p>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-cream-2 rounded-xl animate-pulse h-80" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4 text-line">♡</div>
              <h2 className="text-2xl mb-3">Your wishlist is empty</h2>
              <p className="text-muted mb-8">Save pieces you love by clicking the heart icon.</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
