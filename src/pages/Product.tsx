import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestoreProductById, getFirestoreProducts } from '../firebase/productsClient';
import { formatPrice } from '../data/products';
import type { Product } from '../types';
import { useCart } from '../store/CartContext';
import ProductCard from '../components/ProductCard';
import { StarIcon, PlusIcon, MinusIcon, HeartIcon, TruckIcon, ShieldIcon, LeafIcon, PlayIcon } from '../components/Icons';
import { useWishlist } from '../store/WishlistContext';
import ReviewSection from '../components/ReviewSection';
import { extractVideoId, embedUrl } from '../firebase/videos';
import VideoThumb from '../components/VideoThumb';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toggle, has } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [customSize, setCustomSize] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setQty(1);
    setActiveImg(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    getFirestoreProductById(id).then(async p => {
      setProduct(p || null);
      if (p) {
        const all = await getFirestoreProducts();
        setRelated(all.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4));
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 pb-20">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-16">
          <div className="aspect-square bg-cream-2 rounded-xl animate-pulse" />
          <div className="space-y-4 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-cream-2 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-32 text-center px-5">
        <h1 className="text-3xl mb-4">Product not found</h1>
        <Link to="/products" className="text-gold underline">Browse our collection →</Link>
      </div>
    );
  }

  // Use admin-uploaded images array, fallback to single img
  const galleryImgs: string[] = (product as any).images?.length
    ? (product as any).images
    : [product.img];

  const videoUrl = product.videoUrl || null;
  const videoId = videoUrl ? extractVideoId(videoUrl) : null;
  const hasMedia = galleryImgs.length > 1 || !!videoId;

  const outOfStock = (product as any).inStock === false;
  const trimmedSize = customSize.trim();

  const handleBuyNow = () => {
    add(product.id, qty, trimmedSize || undefined);
    setTimeout(() => navigate('/cart'), 400);
  };

  return (
    <>
      <section className="pt-32 pb-20">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.15em] uppercase text-muted mb-8">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-gold">Shop</Link>
            <span className="mx-2">/</span>
            <Link to={`/products?cat=${encodeURIComponent(product.category)}`} className="hover:text-gold">
              {product.category}
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16">
            {/* GALLERY */}
            <div className="flex flex-col gap-3">
              {/* Main display */}
              <div className={`bg-ink rounded-xl overflow-hidden ${showVideo ? 'aspect-video' : 'aspect-square'}`}>
                {showVideo && videoId ? (
                  <iframe
                    src={embedUrl(videoUrl!, true)}
                    title={product.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={galleryImgs[activeImg]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Thumbnail strip */}
              {hasMedia && (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImgs.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveImg(i); setShowVideo(false); }}
                      className={`aspect-square bg-cream-2 rounded-sm overflow-hidden border-2 transition-colors ${
                        !showVideo && activeImg === i ? 'border-gold' : 'border-transparent hover:border-line'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}

                  {/* Video thumbnail slot */}
                  {videoId && videoUrl && (
                    <button
                      onClick={() => setShowVideo(true)}
                      className={`aspect-square bg-cream-2 rounded-sm overflow-hidden border-2 transition-colors relative group ${
                        showVideo ? 'border-gold' : 'border-transparent hover:border-line'
                      }`}
                    >
                      <VideoThumb url={videoUrl} alt="Watch video" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-ink/40 group-hover:bg-ink/30 transition-colors flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-walnut/90 flex items-center justify-center">
                          <PlayIcon size={14} className="text-cream ml-0.5" />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* INFO */}
            <div className="pt-2">
              <div className="text-[11px] tracking-[0.3em] uppercase text-gold mb-3">
                {product.category}
              </div>
              <h1 className="font-display leading-tight mb-4"
                  style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}>
                {product.name}
              </h1>

              {/* Stars + reviews */}
              <div className="flex items-center gap-3 mb-5">
                <a href="#reviews" className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} />)}
                </a>
                <a href="#reviews" className="text-sm text-muted hover:text-gold transition-colors">4.8 · See reviews</a>
              </div>

              {/* Price */}
              <div className="font-display text-3xl text-walnut mb-2">
                {product.oldPrice && (
                  <span className="text-muted line-through text-2xl mr-3 font-normal">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                {formatPrice(product.price)}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  COD Available
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-cream-2 text-walnut border border-line px-3 py-1 rounded-full">
                  <TruckIcon size={11} /> Free Shipping
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-cream-2 text-walnut border border-line px-3 py-1 rounded-full">
                  <ShieldIcon size={11} /> Lifetime Warranty
                </span>
              </div>

              {/* Delivery estimate */}
              <div className="flex items-center gap-2 text-sm text-walnut mb-6 bg-cream-2 border border-line rounded-sm px-4 py-2.5">
                <TruckIcon size={15} className="text-gold shrink-0" />
                <span>
                  Estimated delivery by{' '}
                  <strong>
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short'
                    })}
                  </strong>
                  {' '}· Made to order, 3–4 weeks lead time
                </span>
              </div>

              <p className="text-muted leading-relaxed mb-8">{product.desc}</p>

              <div className="grid grid-cols-2 gap-4 py-6 border-t border-line mb-0">
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Wood</div>
                  <div className="text-sm text-walnut font-medium">{product.wood}</div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Dimensions</div>
                  <div className="text-sm text-walnut font-medium">{product.dimensions}</div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Finish</div>
                  <div className="text-sm text-walnut font-medium">Hand-rubbed Oil</div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">Lead Time</div>
                  <div className="text-sm text-walnut font-medium">3–4 Weeks</div>
                </div>
              </div>

              {/* Custom size input */}
              <div className="py-5 border-y border-line mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Custom Size</span>
                  <span className="text-[10px] tracking-[0.15em] uppercase bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded-sm font-medium">
                    Available
                  </span>
                </div>
                <p className="text-xs text-muted mb-3">
                  All pieces are handcrafted to order. Enter your preferred dimensions and we'll make it to fit your space perfectly.
                </p>
                <input
                  type="text"
                  value={customSize}
                  onChange={e => setCustomSize(e.target.value)}
                  placeholder={`e.g. ${product.dimensions} (default)`}
                  className="w-full px-4 py-2.5 border border-line rounded-sm text-sm text-walnut outline-none focus:border-gold bg-cream placeholder:text-muted/60 font-mono"
                />
                {trimmedSize && (
                  <p className="text-[11px] text-gold mt-1.5">✓ Custom size will be noted with your order</p>
                )}
              </div>

              {outOfStock ? (
                <div className="mb-6 space-y-3">
                  <div className="w-full py-4 text-center text-sm font-medium uppercase tracking-[0.2em] rounded-sm bg-cream-2 text-muted border border-line">
                    Currently Not Available
                  </div>
                  <button
                    onClick={() => toggle(product.id)}
                    aria-label={has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`w-full py-3 flex items-center justify-center gap-2 border rounded-sm transition-colors text-xs tracking-[0.15em] uppercase ${
                      has(product.id)
                        ? 'bg-maroon border-maroon text-white'
                        : 'border-line text-walnut hover:bg-walnut hover:text-cream'
                    }`}
                  >
                    <HeartIcon size={14} />
                    {has(product.id) ? 'Saved to Wishlist' : 'Save to Wishlist'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 items-center mb-6">
                  <div className="inline-flex border border-line rounded-sm overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-11 h-12 bg-cream hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
                    >
                      <MinusIcon />
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 text-center bg-transparent border-none font-sans text-sm text-walnut outline-none"
                    />
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="w-11 h-12 bg-cream hover:bg-walnut hover:text-cream text-walnut flex items-center justify-center transition-colors"
                    >
                      <PlusIcon />
                    </button>
                  </div>

                  <button
                    onClick={() => add(product.id, qty, trimmedSize || undefined)}
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all"
                  >
                    Buy Now
                  </button>

                  <button
                    onClick={() => toggle(product.id)}
                    aria-label={has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    className={`w-12 h-12 flex items-center justify-center border rounded-sm transition-colors ${
                      has(product.id)
                        ? 'bg-maroon border-maroon text-white'
                        : 'border-line text-walnut hover:bg-walnut hover:text-cream'
                    }`}
                  >
                    <HeartIcon />
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-5 text-xs text-muted pt-4 border-t border-line">
                <span className="inline-flex items-center gap-2"><TruckIcon size={16} /> Free shipping over ₹50,000</span>
                <span className="inline-flex items-center gap-2"><ShieldIcon size={16} /> Lifetime warranty</span>
                <span className="inline-flex items-center gap-2"><LeafIcon size={16} /> 100% solid wood</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-20 bg-cream-2">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
            <div className="text-center mb-12">
              <span className="section-tag">More you might love</span>
              <h2 className="text-3xl lg:text-4xl">Related pieces</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <div id="reviews">
        <ReviewSection productId={product.id} />
      </div>
    </>
  );
}
