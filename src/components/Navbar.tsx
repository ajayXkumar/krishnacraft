import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { BagIcon, SearchIcon, MenuIcon, CloseIcon, HeartIcon } from './Icons';
import SearchOverlay from './SearchOverlay';
import { useWishlist } from '../store/WishlistContext';
import { useCategories } from '../hooks/useCategories';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop', dropdown: true },
  { to: '/videos', label: 'Videos' },
  { to: '/about', label: 'Story' },
];

const TRUST_ITEMS = [
  'Free Shipping over ₹50,000',
  'COD Available',
  'Handmade in India',
  '30-Day Returns',
  'Lifetime Warranty',
];

export default function Navbar() {
  const { count, openCart } = useCart();
  const { user, isAdmin } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const categories = useCategories();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-300 ${
        scrolled ? 'bg-cream/95 border-b border-line' : 'bg-cream/90'
      } backdrop-blur-xl`}>

        {/* ── Trust bar ── */}
        <div className="bg-walnut text-cream/80 text-[10px] tracking-[0.2em] uppercase hidden sm:flex justify-center overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap py-1.5">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-5 mx-5">
                {item}
                {i < TRUST_ITEMS.length * 2 - 1 && <span className="text-gold opacity-60">✦</span>}
              </span>
            ))}
          </div>
        </div>

        {/* ── Main nav — 3-column grid keeps logo left, nav centred, icons right ── */}
        <div className="max-w-[1400px] w-full mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-5 lg:px-8 py-4 gap-4">
          {/* Left: Logo */}
          <Link to="/" className="font-display text-2xl font-semibold text-walnut tracking-wide justify-self-start">
            Krishna <span className="text-gold italic font-medium">Craft</span>
          </Link>

          {/* Centre: Nav links */}
          <nav className="hidden lg:flex gap-8">
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-[13px] font-medium tracking-wide relative py-1 transition-colors hover:text-gold ${
                    isActive ? 'text-gold' : 'text-walnut'
                  }`
                }
              >
                Dashboard
              </NavLink>
            )}
            {NAV_LINKS.map(l => l.dropdown ? (
              <div key={l.label} className="relative group">
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `text-[13px] font-medium tracking-wide relative py-1 transition-colors hover:text-gold flex items-center gap-1 ${
                      isActive ? 'text-gold' : 'text-walnut'
                    }`
                  }
                >
                  {l.label}
                  <span className="text-[10px] transition-transform group-hover:rotate-180">▾</span>
                </NavLink>
                <div className="absolute top-full left-0 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
                  <div className="bg-cream border border-line rounded-sm shadow-soft py-2 w-44">
                    <Link to="/products" className="block px-4 py-2 text-[12px] text-muted hover:text-gold transition-colors tracking-wide">
                      All Products
                    </Link>
                    <div className="border-t border-line my-1" />
                    {categories.map(cat => (
                      <Link
                        key={cat}
                        to={`/products?cat=${encodeURIComponent(cat)}`}
                        className="block px-4 py-2 text-[12px] text-walnut hover:text-gold transition-colors tracking-wide"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={l.label}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `text-[13px] font-medium tracking-wide relative py-1 transition-colors hover:text-gold ${
                    isActive ? 'text-gold' : 'text-walnut'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-4 lg:gap-5 justify-self-end">
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="text-walnut hover:text-gold transition-colors hidden sm:inline-flex"
            >
              <SearchIcon />
            </button>
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative text-walnut hover:text-gold transition-colors hidden sm:inline-flex"
            >
              <HeartIcon />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-maroon text-white text-[10px] font-semibold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to={user ? '/account' : '/signin'}
              className="text-[12px] font-medium tracking-wide text-walnut hover:text-gold transition-colors hidden sm:inline-flex uppercase"
            >
              {user ? 'Account' : 'Sign In'}
            </Link>
            <button
              aria-label="Cart"
              onClick={openCart}
              className="relative text-walnut hover:text-gold transition-colors"
            >
              <BagIcon />
              {count > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-maroon text-white text-[10px] font-semibold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
            <button
              aria-label="Menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-walnut"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-[60] bg-cream transition-transform duration-500 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-7 right-6 text-walnut"
          aria-label="Close menu"
        >
          <CloseIcon size={24} />
        </button>
        <div className="pt-24 px-8 flex flex-col gap-1 overflow-y-auto h-full pb-12">
          <Link to="/" onClick={() => setMobileOpen(false)} className="font-display text-3xl py-3 border-b border-line text-walnut hover:text-gold transition-colors">Home</Link>
          <Link to="/products" onClick={() => setMobileOpen(false)} className="font-display text-3xl py-3 border-b border-line text-walnut hover:text-gold transition-colors">Shop</Link>
          {categories.map(cat => (
            <Link
              key={cat}
              to={`/products?cat=${encodeURIComponent(cat)}`}
              onClick={() => setMobileOpen(false)}
              className="font-sans text-base py-2.5 pl-4 border-b border-line/50 text-walnut-soft hover:text-gold transition-colors"
            >
              {cat}
            </Link>
          ))}
          <Link to="/videos" onClick={() => setMobileOpen(false)} className="font-display text-3xl py-3 border-b border-line text-walnut hover:text-gold transition-colors">Videos</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="font-display text-3xl py-3 border-b border-line text-walnut hover:text-gold transition-colors">Story</Link>
          <Link
            to={user ? '/account' : '/signin'}
            onClick={() => setMobileOpen(false)}
            className="font-display text-3xl py-3 border-b border-line text-walnut hover:text-gold transition-colors"
          >
            {user ? 'Account' : 'Sign In'}
          </Link>
          {user && (
            <Link
              to="/orders"
              onClick={() => setMobileOpen(false)}
              className="font-display text-3xl py-3 border-b border-line text-walnut hover:text-gold transition-colors"
            >
              Orders
            </Link>
          )}
          {/* Mobile trust items */}
          <div className="mt-6 pt-6 border-t border-line space-y-2">
            {TRUST_ITEMS.map(item => (
              <p key={item} className="text-xs text-muted tracking-wide flex items-center gap-2">
                <span className="text-gold text-[8px]">✦</span>{item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
