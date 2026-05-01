import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FadeIn from '../components/FadeIn';
import { CATEGORIES as STATIC_CATEGORIES } from '../data/products';
import { useCategories } from '../hooks/useCategories';
import { getSiteSettings, type SiteSettings } from '../firebase/siteSettings';
import { getFeaturedReviews, type Review } from '../firebase/reviews';
import { getFirestoreProducts } from '../firebase/productsClient';
import type { Product } from '../types';

import {
  ArrowRightIcon,
  StarIcon,
  LeafIcon,
  HammerIcon,
  ShieldIcon,
  TruckIcon,
} from '../components/Icons';


const STRIP_ITEMS = [
  'Free Shipping over ₹50,000',
  'Lifetime Craftsmanship Warranty',
  '30-Day Easy Returns',
  'Pan-India Assembly',
];

const TESTIMONIALS = [
  {
    name: 'Anjali Sharma',
    role: 'Mumbai',
    rating: 5,
    quote:
      'The Maharaja bed is a masterpiece. The carving detail is breathtaking, and the wood feels solid and substantial — like an heirloom we will pass down.',
    initials: 'AS',
  },
  {
    name: 'Ravi Mehta',
    role: 'Delhi',
    rating: 5,
    quote:
      'Ordered the Ladoo Gopal singhasan and it brought tears to my eyes. So beautifully crafted that it has become the centerpiece of our pooja room.',
    initials: 'RM',
  },
  {
    name: 'Priya Iyer',
    role: 'Bangalore',
    rating: 5,
    quote:
      'White-glove delivery, careful assembly, and an almirah that fits our home like it has always been there. Premium experience from start to finish.',
    initials: 'PI',
  },
];

const STATIC_META = Object.fromEntries(STATIC_CATEGORIES.map(c => [c.name, c]));

export default function Home() {
  const categories = useCategories();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [featuredReviews, setFeaturedReviews] = useState<Review[]>([]);

  useEffect(() => {
    getSiteSettings().then(setSiteSettings);
    getFeaturedReviews(3).then(setFeaturedReviews);
    // Load first 4 products from Firestore as featured
    getFirestoreProducts().then(all => setFeatured(all.slice(0, 4)));
  }, []);

  const heroImage = siteSettings?.heroImage ?? null;
  const artisanImage = siteSettings?.artisanImage ?? null;
  const categoryImages = siteSettings?.categoryImages || {};

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div
          className="absolute inset-0 bg-cover bg-center bg-ink transition-opacity duration-700"
          style={heroImage ? { backgroundImage: `url('${heroImage}')` } : undefined}
        />
        {/* Rugged tonal overlay — keeps the chopped-wood texture visible while text stays legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/45 to-ink/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-ink/30" />

        <div className="relative max-w-[1280px] w-full mx-auto px-5 lg:px-8 text-center">
          <div className="max-w-2xl text-cream mx-auto">
            <span className="inline-block text-[11px] tracking-[0.3em] uppercase text-gold-soft mb-6 px-4 py-2 border border-gold-soft/40 rounded-sm">
              Est. 1968 — Khopda, Rajasthan
            </span>
            <h1 className="font-display font-normal leading-[1.05] mb-6 text-cream"
                style={{ fontSize: 'clamp(40px, 6vw, 76px)' }}>
              Puja furniture your <em className="text-gold-soft italic">Thakurji deserves</em>.
            </h1>
            <p className="text-base sm:text-lg text-cream/85 max-w-xl mx-auto mb-8 leading-relaxed">
              Solid wood furniture and sacred decor for Ladoo Gopal, hand-carved by
              third-generation artisans. Built to outlive trends and pass to the next generation.
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} size={14} className="text-gold" />
                ))}
              </div>
              <span className="text-cream/70 text-sm">Trusted by <strong className="text-cream">12,000+</strong> families across India</span>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-cream text-walnut hover:bg-gold hover:text-white transition-all duration-300 hover:-translate-y-0.5"
              >
                Shop Collection <ArrowRightIcon />
              </Link>
              <Link
                to="/products?cat=Ladoo+Gopal"
                className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm border border-cream text-cream hover:bg-cream hover:text-walnut transition-all duration-300"
              >
                Sacred Pieces
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-cream text-[11px] tracking-[0.3em] uppercase opacity-70 flex flex-col items-center gap-3">
          Scroll
          <span className="block w-px h-10 bg-cream animate-scroll-pulse" />
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <section className="bg-walnut text-cream py-5 overflow-hidden">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {[...STRIP_ITEMS, ...STRIP_ITEMS, ...STRIP_ITEMS].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-16 text-xs tracking-[0.25em] uppercase"
            >
              {item}
              <span className="text-gold">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="section-tag">Our Collections</span>
            <h2 className="text-4xl lg:text-5xl mb-3" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Browse by category
            </h2>
            <div className="w-15 h-px bg-gold mx-auto my-5" style={{ width: 60 }} />
            <p className="text-muted max-w-xl mx-auto">
              From sacred singhasans for your Bal Gopal to royal bedroom suites — every piece tells
              a story of craftsmanship.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-4 h-[640px] max-lg:h-auto max-lg:grid-rows-none">
            {categories.map((cat, i) => {
              const meta = STATIC_META[cat];
              const bg = categoryImages[cat] || meta?.img || '';
              const tag = meta?.tag;
              return (
                <Link
                  key={cat}
                  to={`/products?cat=${encodeURIComponent(cat)}`}
                  className={`group relative overflow-hidden rounded-xl bg-walnut cursor-pointer ${
                    i === 0
                      ? 'lg:row-span-2 max-lg:col-span-2 max-lg:aspect-video'
                      : 'max-lg:aspect-square'
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                    style={{ backgroundImage: bg ? `url('${bg}')` : undefined }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  {tag && (
                    <span className="absolute top-6 left-6 z-10 bg-maroon text-white px-4 py-2 text-[10px] tracking-[0.2em] uppercase rounded-sm">
                      {tag}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 z-10 p-7 text-white">
                    <div className="text-[11px] tracking-[0.25em] uppercase text-gold-soft mb-2">Collection</div>
                    <h3 className={`text-white font-display ${i === 0 ? 'text-4xl' : 'text-2xl'}`}>{cat}</h3>
                    <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase mt-3 transition-all duration-300 group-hover:gap-4">
                      Explore <ArrowRightIcon size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 lg:py-28 bg-cream">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="section-tag">Best Sellers</span>
            <h2 className="text-4xl lg:text-5xl mb-3" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Featured pieces
            </h2>
            <div className="w-15 h-px bg-gold mx-auto my-5" style={{ width: 60 }} />
            <p className="text-muted max-w-xl mx-auto">
              Hand-picked favorites from our atelier — each one a celebration of solid wood and
              old-world technique.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm border border-walnut text-walnut hover:bg-walnut hover:text-cream transition-all duration-300"
            >
              View All Pieces <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FadeIn className="relative h-[400px] lg:h-[600px] rounded-xl overflow-hidden order-2 lg:order-1">
            <div className="absolute -top-6 -left-6 lg:top-8 lg:left-8 w-full h-full border border-gold rounded-xl -z-10" />
            {artisanImage && (
              <img
                src={artisanImage}
                alt="Artisan at work"
                className="w-full h-full object-cover rounded-xl"
              />
            )}
          </FadeIn>

          <FadeIn className="order-1 lg:order-2">
            <span className="section-tag">Our Story</span>
            <h2 className="mb-6" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
              Three generations of <em className="italic text-gold">wood whisperers</em>
            </h2>
            <p className="text-muted mb-4 leading-relaxed">
              From a small workshop in Khopda in 1968 to homes across India and the world —
              our craft has been carried by hand, never by machine.
            </p>
            <p className="text-muted mb-4 leading-relaxed">
              We work with seasoned solid sheesham, mango, teak and walnut. Each piece is hand-cut,
              hand-carved and hand-finished by master artisans whose families have been carving
              wood for over five decades.
            </p>

            <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-line">
              <div>
                <div className="font-display text-4xl text-gold mb-1">56+</div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-muted">Years</div>
              </div>
              <div>
                <div className="font-display text-4xl text-gold mb-1">12k</div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-muted">Homes</div>
              </div>
              <div>
                <div className="font-display text-4xl text-gold mb-1">100%</div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-muted">Solid Wood</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 lg:py-28 bg-cream-2">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="section-tag">Why Krishna Craft</span>
            <h2 className="text-4xl lg:text-5xl mb-3" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              The mark of true craft
            </h2>
            <div className="w-15 h-px bg-gold mx-auto my-5" style={{ width: 60 }} />
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: LeafIcon, title: 'Solid Wood', desc: 'No MDF, no veneer. Only seasoned solid timber.' },
              { Icon: HammerIcon, title: 'Hand-Carved', desc: 'Every motif chiseled by master artisans.' },
              { Icon: ShieldIcon, title: 'Lifetime Care', desc: 'A warranty that lasts as long as the wood.' },
              { Icon: TruckIcon, title: 'White-Glove', desc: 'Pan-India delivery and assembly included.' },
            ].map(({ Icon, title, desc }) => (
              <FadeIn key={title} className="text-center p-8 group">
                <div className="w-16 h-16 mx-auto mb-6 border border-gold rounded-full flex items-center justify-center text-gold transition-all duration-500 group-hover:bg-gold group-hover:text-white group-hover:rotate-[360deg]">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* KRISHNA SECTION */}
      <section className="py-24 lg:py-32 relative overflow-hidden text-cream"
               style={{ background: 'linear-gradient(135deg, #2C0E0E 0%, #4A1717 50%, #2C0E0E 100%)' }}>
        <div
          className="absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(212, 164, 54, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212, 164, 54, 0.08) 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-[1280px] mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <FadeIn>
            <span className="inline-block text-[11px] tracking-[0.3em] uppercase text-gold-soft mb-5">
              Sacred Collection
            </span>
            <h2 className="text-cream mb-6" style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}>
              For your beloved <em className="italic text-gold-soft">Ladoo Gopal</em>
            </h2>
            <p className="text-cream/75 mb-8 leading-relaxed">
              A devoted line of hand-carved singhasans, palangs, jhulas and pooja mandirs —
              crafted with the same reverence with which you serve Bal Gopal each day.
              Finished with food-safe natural lacquer, blessed before despatch.
            </p>
            <Link
              to="/products?cat=Ladoo+Gopal"
              className="inline-flex items-center gap-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all duration-300 hover:-translate-y-0.5"
            >
              Shop Sacred Pieces <ArrowRightIcon />
            </Link>
          </FadeIn>

          <FadeIn className="relative h-[400px] lg:h-[540px] rounded-xl overflow-hidden shadow-deep">
            <img
              src="https://images.unsplash.com/photo-1631689644455-b570154363e2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Ladoo Gopal singhasan"
              className="w-full h-full object-cover"
            />
          </FadeIn>
        </div>
      </section>

      {/* OCCASIONS / GIFTING */}
      <section className="py-20 lg:py-24 bg-cream">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-12">
            <span className="section-tag">Shop for the Occasion</span>
            <h2 className="mb-3" style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}>
              Every celebration, a handcrafted gift
            </h2>
            <div className="w-15 h-px bg-gold mx-auto my-4" style={{ width: 60 }} />
          </FadeIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Janmashtami', sublabel: 'Ladoo Gopal setups', to: '/products?cat=Ladoo+Gopal', emoji: '🪔', bg: '#2C0E0E' },
              { label: 'Griha Pravesh', sublabel: 'Furniture for your new home', to: '/products?cat=Beds', emoji: '🏡', bg: '#1A2C0E' },
              { label: 'Wedding Gift', sublabel: 'Heirloom bedroom pieces', to: '/products?cat=Almirahs', emoji: '💛', bg: '#2C200E' },
              { label: 'Navratri', sublabel: 'Sacred decor & mandirs', to: '/products?cat=Ladoo+Gopal', emoji: '🌸', bg: '#2C0E2C' },
            ].map(({ label, sublabel, to, emoji, bg }) => (
              <FadeIn key={label}>
                <Link
                  to={to}
                  className="group block rounded-xl p-7 text-center hover:-translate-y-1 transition-all duration-300 hover:shadow-soft"
                  style={{ background: bg }}
                >
                  <div className="text-4xl mb-4">{emoji}</div>
                  <h3 className="font-display text-cream text-lg mb-1">{label}</h3>
                  <p className="text-cream/50 text-xs leading-relaxed mb-4">{sublabel}</p>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-gold group-hover:gap-2 inline-flex items-center gap-1.5 transition-all">
                    Shop <ArrowRightIcon size={12} />
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 lg:py-28">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <FadeIn className="text-center mb-14">
            <span className="section-tag">Kind Words</span>
            <h2 className="text-4xl lg:text-5xl mb-3" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              From our family of patrons
            </h2>
            <div className="w-15 h-px bg-gold mx-auto my-5" style={{ width: 60 }} />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(featuredReviews.length > 0 ? featuredReviews : TESTIMONIALS).map((t, idx) => {
              const isReview = 'body' in t;
              const name = isReview ? (t as Review).userName : (t as typeof TESTIMONIALS[0]).name;
              const quote = isReview ? (t as Review).body : (t as typeof TESTIMONIALS[0]).quote;
              const rating = isReview ? (t as Review).rating : (t as typeof TESTIMONIALS[0]).rating;
              const sub = isReview ? '' : (t as typeof TESTIMONIALS[0]).role;
              const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
              <FadeIn
                key={isReview ? (t as Review).id : (t as typeof TESTIMONIALS[0]).name}
                className="bg-white p-10 pt-12 rounded-xl border border-line relative"
              >
                <span className="absolute top-3 left-7 font-display text-7xl text-gold/30 leading-none select-none">
                  &ldquo;
                </span>
                <div className="flex gap-1 text-gold mb-4 relative">
                  {Array.from({ length: rating }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p className="text-walnut-soft italic leading-relaxed mb-6 relative">
                  {quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-cream-2 flex items-center justify-center text-sm font-semibold text-walnut">
                    {initials || `${idx + 1}`}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-walnut">{name}</div>
                    {sub && <div className="text-xs text-muted">{sub}</div>}
                  </div>
                </div>
              </FadeIn>
            );
          })}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-walnut text-cream text-center py-20">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <FadeIn>
            <h2 className="text-cream mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              Join the heritage circle
            </h2>
            <p className="text-cream/70 mb-8 max-w-md mx-auto">
              Be first to know about new arrivals, artisan stories, and exclusive pre-sales.
            </p>
            <form
              onSubmit={e => e.preventDefault()}
              className="flex flex-col sm:flex-row max-w-md mx-auto gap-2"
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                className="flex-1 px-5 py-4 bg-white/8 border border-white/15 text-cream placeholder-cream/50 rounded-sm focus:border-gold outline-none transition-colors"
              />
              <button
                type="submit"
                className="px-7 py-4 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-gold text-white hover:bg-gold-soft transition-all"
              >
                Subscribe
              </button>
            </form>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
