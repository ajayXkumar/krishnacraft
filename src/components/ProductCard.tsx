import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatPrice } from '../data/products';
import { useCart } from '../store/CartContext';
import { useWishlist } from '../store/WishlistContext';
import { HeartIcon, StarIcon } from './Icons';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const wishlisted = has(product.id);
  const outOfStock = (product as any).inStock === false;

  const tagBadge = (() => {
    if (outOfStock)
      return (
        <span className="absolute top-3.5 left-3.5 bg-ink/80 text-cream text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-sm font-medium">
          Out of Stock
        </span>
      );
    if (product.tag === 'new')
      return (
        <span className="absolute top-3.5 left-3.5 bg-walnut text-cream text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-sm font-medium">
          New
        </span>
      );
    if (product.tag === 'sacred')
      return (
        <span className="absolute top-3.5 left-3.5 bg-maroon text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-sm font-medium">
          Sacred
        </span>
      );
    if (product.oldPrice)
      return (
        <span className="absolute top-3.5 left-3.5 bg-gold text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-sm font-medium">
          Sale
        </span>
      );
    return null;
  })();

  return (
    <article className={`group bg-white rounded-xl overflow-hidden transition-all duration-500 ${outOfStock ? 'opacity-70' : 'hover:-translate-y-1.5 hover:shadow-soft'}`}>
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-cream-2">
        {tagBadge}
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-700 ${outOfStock ? 'grayscale-[30%]' : 'group-hover:scale-105'}`}
        />
        {/* Wishlist heart */}
        <button
          onClick={e => { e.preventDefault(); toggle(product.id); }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            wishlisted
              ? 'bg-maroon text-white'
              : 'bg-white/80 text-walnut hover:bg-maroon hover:text-white opacity-0 group-hover:opacity-100'
          }`}
        >
          <HeartIcon size={14} />
        </button>
        {!outOfStock && (
          <button
            onClick={e => { e.preventDefault(); add(product.id); }}
            className="absolute bottom-3.5 left-3.5 right-3.5 bg-walnut hover:bg-gold text-cream py-3 text-xs tracking-[0.15em] uppercase font-medium rounded-sm opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400"
          >
            + Add to Cart
          </button>
        )}
      </Link>
      <div className="p-6 text-center">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
          {product.category}
        </div>
        <h3 className="font-display text-lg mb-2 leading-snug">
          <Link to={`/product/${product.id}`} className="hover:text-gold transition-colors">
            {product.name}
          </Link>
        </h3>
        {/* Star rating */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <div className="flex gap-0.5 text-gold">
            {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} size={11} />)}
          </div>
          <span className="text-[11px] text-muted">4.8</span>
        </div>
        <div className="text-walnut text-base font-medium">
          {product.oldPrice && (
            <span className="text-muted line-through font-normal mr-2">
              {formatPrice(product.oldPrice)}
            </span>
          )}
          {formatPrice(product.price)}
        </div>
        <p className="text-[10px] text-muted mt-1.5">
          {outOfStock ? 'Currently unavailable' : 'COD Available · Free Shipping'}
        </p>
      </div>
    </article>
  );
}
