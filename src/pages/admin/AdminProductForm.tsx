import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminGetProducts, adminSaveProduct, type AdminProduct } from '../../firebase/adminOps';
import { uploadProductImage, deleteStorageFile } from '../../firebase/storageUtils';
import { useCategories } from '../../hooks/useCategories';
import Select from '../../components/Select';
import type { ProductTag } from '../../types';

const TAGS: ProductTag[] = ['new', 'sacred', 'sale'];

function isStorageUrl(url: string) {
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app');
}

const EMPTY: Omit<AdminProduct, 'firestoreId'> = {
  id: '',
  name: '',
  category: 'Beds',
  price: 0,
  oldPrice: undefined,
  tag: undefined,
  img: '',
  images: [],
  desc: '',
  wood: '',
  dimensions: '',
  inStock: true,
  sortOrder: 99,
};

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const categories = useCategories();

  const [form, setForm] = useState<Omit<AdminProduct, 'firestoreId'>>(EMPTY);
  const [firestoreId, setFirestoreId] = useState<string | undefined>();
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    adminGetProducts().then(products => {
      const p = products.find(x => (x.firestoreId || x.id) === id);
      if (p) {
        const { firestoreId: fid, ...rest } = p;
        // ensure images array always contains img as first element
        if (rest.img && (!rest.images || rest.images.length === 0)) {
          rest.images = [rest.img];
        }
        setForm(rest);
        setFirestoreId(fid);
      }
    }).finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const productId = firestoreId || form.id || `product_${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      setUploadingIdx(i);
      setUploadPct(0);
      try {
        const url = await uploadProductImage(files[i], productId, setUploadPct);
        setForm(prev => {
          const newImages = [...(prev.images || []), url];
          return {
            ...prev,
            images: newImages,
            img: prev.img || url, // set hero if not already set
          };
        });
      } catch (err) {
        setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown'));
      }
    }
    setUploadingIdx(null);
    e.target.value = '';
  };

  const setHero = (url: string) => {
    set('img', url);
  };

  const removeImage = (url: string) => {
    setForm(prev => {
      const newImages = (prev.images || []).filter(x => x !== url);
      return {
        ...prev,
        images: newImages,
        img: prev.img === url ? (newImages[0] || '') : prev.img,
      };
    });
    if (isStorageUrl(url)) deleteStorageFile(url);
  };

  const addByUrl = (url: string) => {
    if (!url) return;
    setForm(prev => {
      const newImages = [...(prev.images || []), url];
      return { ...prev, images: newImages, img: prev.img || url };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.img) {
      setError('Name, price, and at least one image are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const productId = firestoreId || form.id || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await adminSaveProduct({ ...form, firestoreId: productId, id: productId });
      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-10 text-muted text-sm">Loading…</div>;

  const images: string[] = form.images?.length ? form.images : (form.img ? [form.img] : []);

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="text-xs tracking-widest uppercase text-muted mb-5">
        <Link to="/admin/products" className="hover:text-gold">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-walnut">{isNew ? 'New Product' : 'Edit Product'}</span>
      </div>

      <h1 className="font-display text-walnut text-3xl mb-8">
        {isNew ? 'Add Product' : 'Edit Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Image gallery */}
        <div>
          <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-3">
            Product Images
            {form.img && <span className="ml-2 text-gold">(click image to set as hero)</span>}
          </label>

          {/* Grid of current images */}
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {images.map((url, i) => (
                <div key={i} className="relative group">
                  <button
                    type="button"
                    onClick={() => setHero(url)}
                    className={`block w-full aspect-square rounded-sm overflow-hidden border-2 transition-colors ${
                      form.img === url ? 'border-gold' : 'border-line hover:border-walnut'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {form.img === url && (
                      <div className="absolute inset-0 bg-gold/20 flex items-end justify-center pb-1">
                        <span className="text-[9px] tracking-widest uppercase bg-gold text-white px-1.5 py-0.5 rounded-sm">Hero</span>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-maroon text-white text-xs hidden group-hover:flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Upload slot */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square border-2 border-dashed border-line rounded-sm flex flex-col items-center justify-center text-muted hover:border-gold hover:text-gold transition-colors text-xs"
              >
                <span className="text-2xl leading-none mb-1">+</span>
                Add
              </button>
            </div>
          )}

          {images.length === 0 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-line rounded-sm flex flex-col items-center justify-center text-muted hover:border-gold hover:text-gold transition-colors gap-2 mb-3"
            >
              <span className="text-3xl">+</span>
              <span className="text-xs tracking-widest uppercase">Upload Images</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddImages}
            className="hidden"
          />

          {uploadingIdx !== null && (
            <div className="mb-3">
              <div className="h-1.5 bg-line rounded-full overflow-hidden">
                <div className="h-full bg-gold transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
              <div className="text-xs text-muted mt-1">Uploading… {uploadPct}%</div>
            </div>
          )}

          {/* Paste URL */}
          <div className="flex gap-2">
            <input
              id="urlInput"
              type="url"
              placeholder="Or paste image URL and press Add"
              className="flex-1 px-4 py-2 border border-line rounded-sm text-sm outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => {
                const inp = document.getElementById('urlInput') as HTMLInputElement;
                addByUrl(inp.value.trim());
                inp.value = '';
              }}
              className="px-4 py-2 text-xs tracking-widest uppercase border border-walnut text-walnut rounded-sm hover:bg-walnut hover:text-cream transition-all"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Name *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Category *</label>
            <Select
              value={form.category}
              onChange={val => set('category', val)}
              options={categories.map(c => ({ value: c, label: c }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Price (₹) *</label>
            <input
              required
              type="number"
              min={0}
              value={form.price || ''}
              onChange={e => set('price', Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Old Price (₹)</label>
            <input
              type="number"
              min={0}
              value={form.oldPrice || ''}
              onChange={e => set('oldPrice', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Tag</label>
            <Select
              value={form.tag || ''}
              onChange={val => set('tag', (val as ProductTag) || undefined)}
              options={[{ value: '', label: 'None' }, ...TAGS.map(t => ({ value: t, label: t }))]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Wood Type</label>
            <input
              value={form.wood}
              onChange={e => set('wood', e.target.value)}
              placeholder="e.g. Solid Sheesham"
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Dimensions</label>
            <input
              value={form.dimensions}
              onChange={e => set('dimensions', e.target.value)}
              placeholder='e.g. 36" x 84"'
              className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Description</label>
          <textarea
            rows={3}
            value={form.desc}
            onChange={e => set('desc', e.target.value)}
            className="w-full px-4 py-2.5 border border-line rounded-sm text-sm resize-none outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">YouTube Video URL</label>
          <input
            type="url"
            value={form.videoUrl || ''}
            onChange={e => set('videoUrl', e.target.value || undefined)}
            placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
            className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
          />
          <p className="text-[11px] text-muted mt-1.5">Shown as a playable video slot in the product image gallery.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[11px] tracking-[0.2em] uppercase text-muted">In Stock</label>
          <button
            type="button"
            onClick={() => set('inStock', !form.inStock)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.inStock ? 'bg-walnut' : 'bg-line'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.inStock ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        {error && (
          <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="px-7 py-3 text-xs font-medium uppercase tracking-widest rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
          >
            {busy ? 'Saving…' : isNew ? 'Add Product' : 'Save Changes'}
          </button>
          <Link
            to="/admin/products"
            className="px-7 py-3 text-xs font-medium uppercase tracking-widest rounded-sm border border-line text-muted hover:text-walnut transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
