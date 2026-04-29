import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import Select from '../components/Select';

type SortKey = 'featured' | 'low' | 'high' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'low', label: 'Price: Low → High' },
  { value: 'high', label: 'Price: High → Low' },
  { value: 'name', label: 'Name A–Z' },
];

const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₹10,000', min: 0, max: 10000 },
  { label: '₹10k – ₹50k', min: 10000, max: 50000 },
  { label: '₹50k – ₹1L', min: 50000, max: 100000 },
  { label: 'Above ₹1L', min: 100000, max: Infinity },
];

export default function Products() {
  const { products, loading } = useProducts();
  const categories = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'All';
  const [activeCat, setActiveCat] = useState<string>(initialCat);
  const [activeRange, setActiveRange] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('featured');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setActiveCat(searchParams.get('cat') || 'All');
  }, [searchParams]);

  // Close filter drawer on desktop resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setFilterOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const filtered = useMemo(() => {
    let list = activeCat === 'All' ? [...products] : products.filter(p => p.category === activeCat);
    if (activeRange !== null) {
      const r = PRICE_RANGES[activeRange + 1]; // offset by 1 because index 0 = "All Prices"
      list = list.filter(p => p.price >= r.min && p.price < r.max);
    }
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'high') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, activeCat, activeRange, sort]);

  const setCategory = (cat: string) => {
    setActiveCat(cat);
    if (cat === 'All') setSearchParams({});
    else setSearchParams({ cat });
  };

  const categoryCount = (cat: string) =>
    cat === 'All' ? products.length : products.filter(p => p.category === cat).length;

  const categoryFilters = ['All', ...categories];

  const activeFiltersCount = (activeCat !== 'All' ? 1 : 0) + (activeRange !== null ? 1 : 0);

  return (
    <>
      {/* Hero header */}
      <section className="bg-cream-2 pt-28 sm:pt-32 pb-10 sm:pb-16 text-center">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <div className="text-xs tracking-[0.2em] uppercase text-muted mb-3">
            <Link to="/" className="hover:text-gold">Home</Link>
            <span className="mx-2">/</span>
            <span>Shop</span>
            {activeCat !== 'All' && (
              <>
                <span className="mx-2">/</span>
                <span className="text-walnut">{activeCat}</span>
              </>
            )}
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(28px, 5vw, 56px)' }}>
            {activeCat === 'All' ? 'The Full Collection' : activeCat}
          </h1>
          <p className="text-muted max-w-xl mx-auto mt-3 text-sm sm:text-base">
            {activeCat === 'Ladoo Gopal'
              ? 'Hand-carved sacred furniture for your beloved Bal Gopal.'
              : activeCat === 'All'
              ? 'Every solid wood piece, hand-finished by our master artisans.'
              : `Solid wood ${activeCat.toLowerCase()} crafted to last generations.`}
          </p>
        </div>
      </section>

      {/* Mobile: Category chips + filter bar */}
      <div className="lg:hidden sticky top-[68px] z-30 bg-cream border-b border-line">
        {/* Category chips — horizontal scroll */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          {categoryFilters.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium tracking-wide transition-all ${
                activeCat === cat
                  ? 'bg-walnut text-cream'
                  : 'bg-cream-2 text-walnut border border-line'
              }`}
            >
              {cat}
              <span className={`ml-1.5 text-[10px] ${activeCat === cat ? 'text-cream/70' : 'text-muted'}`}>
                {categoryCount(cat)}
              </span>
            </button>
          ))}
        </div>

        {/* Sort + Filter row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <Select
            value={sort}
            onChange={val => setSort(val as SortKey)}
            options={SORT_OPTIONS}
            className="flex-1"
            size="sm"
          />
          <button
            onClick={() => setFilterOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium border transition-all ${
              activeFiltersCount > 0
                ? 'bg-walnut text-cream border-walnut'
                : 'border-line text-walnut bg-cream-2'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="6" y1="12" x2="10" y2="12"/>
            </svg>
            Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </button>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-cream rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium text-walnut">Filters</h3>
              <button onClick={() => setFilterOpen(false)} className="text-muted hover:text-walnut text-2xl leading-none">×</button>
            </div>

            <div className="mb-6">
              <h4 className="text-[11px] tracking-[0.2em] uppercase text-muted mb-3 font-semibold">Category</h4>
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      activeCat === cat ? 'bg-walnut text-cream' : 'bg-cream-2 text-walnut border border-line'
                    }`}
                  >
                    {cat} <span className="opacity-60 text-xs">{categoryCount(cat)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-[11px] tracking-[0.2em] uppercase text-muted mb-3 font-semibold">Price</h4>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setActiveRange(null)}
                  className={`text-left px-4 py-2.5 rounded-sm text-sm transition-colors ${
                    activeRange === null ? 'bg-gold/10 text-gold font-medium' : 'text-walnut hover:bg-cream-2'
                  }`}
                >
                  All Prices
                </button>
                {PRICE_RANGES.slice(1).map((r, i) => (
                  <button
                    key={r.label}
                    onClick={() => setActiveRange(i)}
                    className={`text-left px-4 py-2.5 rounded-sm text-sm transition-colors ${
                      activeRange === i ? 'bg-gold/10 text-gold font-medium' : 'text-walnut hover:bg-cream-2'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-line">
              <button
                onClick={() => { setActiveCat('All'); setSearchParams({}); setActiveRange(null); setFilterOpen(false); }}
                className="flex-1 py-3 text-sm border border-line rounded-sm text-muted hover:text-walnut"
              >
                Clear All
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 py-3 text-sm bg-walnut text-cream rounded-sm hover:bg-ink"
              >
                Show {filtered.length} items
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="py-8 lg:py-14">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 grid lg:grid-cols-[240px_1fr] gap-10">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-8">
              <div>
                <h4 className="text-[12px] tracking-[0.2em] uppercase text-walnut mb-4 font-semibold pb-3 border-b border-line">
                  Category
                </h4>
                <ul>
                  {categoryFilters.map(cat => (
                    <li
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`flex justify-between py-2 text-sm cursor-pointer transition-colors ${
                        activeCat === cat ? 'text-gold font-medium' : 'text-walnut hover:text-gold'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-muted text-xs">{categoryCount(cat)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[12px] tracking-[0.2em] uppercase text-walnut mb-4 font-semibold pb-3 border-b border-line">
                  Price
                </h4>
                <ul>
                  <li
                    onClick={() => setActiveRange(null)}
                    className={`py-2 text-sm cursor-pointer transition-colors ${
                      activeRange === null ? 'text-gold font-medium' : 'text-walnut hover:text-gold'
                    }`}
                  >
                    All Prices
                  </li>
                  {PRICE_RANGES.slice(1).map((r, i) => (
                    <li
                      key={r.label}
                      onClick={() => setActiveRange(i)}
                      className={`py-2 text-sm cursor-pointer transition-colors ${
                        activeRange === i ? 'text-gold font-medium' : 'text-walnut hover:text-gold'
                      }`}
                    >
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div>
            {/* Desktop toolbar */}
            <div className="hidden lg:flex items-center justify-between mb-8 pb-4 border-b border-line gap-3">
              <span className="text-[13px] text-muted tracking-wide">
                {loading ? 'Loading…' : `Showing ${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
              </span>
              <Select
                value={sort}
                onChange={val => setSort(val as SortKey)}
                options={SORT_OPTIONS}
                className="w-52"
                size="sm"
              />
            </div>

            {/* Mobile result count */}
            <p className="lg:hidden text-[12px] text-muted mb-4">
              {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
            </p>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-cream-2 rounded-xl animate-pulse aspect-[3/4]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted">No products match these filters.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
