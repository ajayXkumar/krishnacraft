import { useEffect, useRef, useState } from 'react';
import { getSiteSettings, updateSiteSettings, type SiteSettings } from '../../firebase/siteSettings';
import { uploadSiteImage } from '../../firebase/storageUtils';
import { notifyCategoryChange } from '../../hooks/useCategories';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

type UploadSlot = 'hero' | 'artisan' | string;

interface UploadState {
  slot: UploadSlot;
  pct: number;
}

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadState | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newCat, setNewCat] = useState('');
  const [catError, setCatError] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    getSiteSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const persist = async (updated: SiteSettings) => {
    await updateSiteSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFileUpload = async (slot: UploadSlot, file: File) => {
    setError('');
    setUploading({ slot, pct: 0 });
    try {
      const storageSlot = slot === 'hero' ? 'hero' : slot === 'artisan' ? 'artisan' : `category_${slot.toLowerCase().replace(/\s+/g, '_')}`;
      const url = await uploadSiteImage(file, storageSlot, pct => {
        setUploading({ slot, pct });
      });

      let updated: SiteSettings | null = null;
      setSettings(prev => {
        if (!prev) return prev;
        if (slot === 'hero') updated = { ...prev, heroImage: url };
        else if (slot === 'artisan') updated = { ...prev, artisanImage: url };
        else updated = { ...prev, categoryImages: { ...prev.categoryImages, [slot]: url } };
        return updated;
      });
      if (updated) await persist(updated);
    } catch (err) {
      setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      await persist(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setUrl = async (slot: UploadSlot, url: string) => {
    let updated: SiteSettings | null = null;
    setSettings(prev => {
      if (!prev) return prev;
      if (slot === 'hero') updated = { ...prev, heroImage: url };
      else if (slot === 'artisan') updated = { ...prev, artisanImage: url };
      else updated = { ...prev, categoryImages: { ...prev.categoryImages, [slot]: url } };
      return updated;
    });
    if (updated) {
      try { await persist(updated); }
      catch (err) { setError(err instanceof Error ? err.message : 'Save failed'); }
    }
  };

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    if (!settings) return;
    if (settings.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      setCatError('Category already exists.');
      return;
    }
    setCatError('');
    const updated = { ...settings, categories: [...settings.categories, name] };
    setSettings(updated);
    setNewCat('');
    await persist(updated);
    notifyCategoryChange(updated.categories);
  };

  const deleteCategory = async (cat: string) => {
    if (!settings) return;
    // Check if any products use this category
    const snap = await getDocs(query(collection(db, 'products'), where('category', '==', cat)));
    if (!snap.empty) {
      setCatError(`Cannot delete "${cat}" — ${snap.size} product(s) use it. Reassign them first.`);
      return;
    }
    setCatError('');
    const updated = {
      ...settings,
      categories: settings.categories.filter(c => c !== cat),
      categoryImages: Object.fromEntries(
        Object.entries(settings.categoryImages).filter(([k]) => k !== cat)
      ) as SiteSettings['categoryImages'],
    };
    setSettings(updated);
    await persist(updated);
    notifyCategoryChange(updated.categories);
  };

  if (loading) return <div className="p-10 text-muted text-sm">Loading…</div>;
  if (!settings) return null;

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <h1 className="font-display text-walnut text-3xl mb-2">Site Settings</h1>
      <p className="text-muted text-sm mb-8">Manage categories and landing page images. Changes take effect immediately.</p>

      {/* ── Categories ── */}
      <Section title="Categories" subtitle="Add or remove product categories shown across the site">
        <div className="space-y-2 mb-4">
          {settings.categories.map(cat => (
            <div key={cat} className="flex items-center justify-between px-4 py-2.5 bg-cream-2 rounded-sm border border-line">
              <span className="text-sm text-walnut">{cat}</span>
              <button
                type="button"
                onClick={() => deleteCategory(cat)}
                className="text-xs text-muted hover:text-maroon transition-colors px-2"
                title={`Delete ${cat}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={e => { setNewCat(e.target.value); setCatError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
            placeholder="New category name"
            className="flex-1 px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={addCategory}
            disabled={!newCat.trim()}
            className="px-5 py-2.5 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink transition-all disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {catError && (
          <p className="text-xs text-maroon mt-2">{catError}</p>
        )}
      </Section>

      {/* ── Hero ── */}
      <Section title="Hero Background" subtitle="The full-screen image behind the homepage headline">
        <ImageSlot
          label="Hero Image"
          currentUrl={settings.heroImage}
          uploading={uploading?.slot === 'hero' ? uploading.pct : null}
          inputRef={el => { fileRefs.current['hero'] = el; }}
          onPickFile={() => fileRefs.current['hero']?.click()}
          onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload('hero', f); e.target.value = ''; }}
          onUrlChange={url => setUrl('hero', url)}
        />
      </Section>

      {/* ── Artisan ── */}
      <Section title="Artisan Photo" subtitle="The 'Our Story' section portrait">
        <ImageSlot
          label="Artisan at Work"
          currentUrl={settings.artisanImage}
          uploading={uploading?.slot === 'artisan' ? uploading.pct : null}
          inputRef={el => { fileRefs.current['artisan'] = el; }}
          onPickFile={() => fileRefs.current['artisan']?.click()}
          onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload('artisan', f); e.target.value = ''; }}
          onUrlChange={url => setUrl('artisan', url)}
        />
      </Section>

      {/* ── Category images ── */}
      <Section title="Category Grid Images" subtitle="The big category cards on the homepage">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {settings.categories.map(cat => (
            <ImageSlot
              key={cat}
              label={cat}
              currentUrl={settings.categoryImages[cat] || ''}
              uploading={uploading?.slot === cat ? uploading.pct : null}
              inputRef={el => { fileRefs.current[cat] = el; }}
              onPickFile={() => fileRefs.current[cat]?.click()}
              onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(cat, f); e.target.value = ''; }}
              onUrlChange={url => setUrl(cat, url)}
            />
          ))}
        </div>
      </Section>

      {error && (
        <div className="text-[13px] text-maroon bg-maroon/5 border border-maroon/20 px-4 py-3 rounded-sm mb-5">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-8 py-3 text-xs font-medium uppercase tracking-widest rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="mb-4 pb-3 border-b border-line">
        <h2 className="text-lg text-walnut font-medium">{title}</h2>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ImageSlot({
  label, currentUrl, uploading, inputRef, onPickFile, onFileChange, onUrlChange,
}: {
  label: string; currentUrl: string; uploading: number | null;
  inputRef: (el: HTMLInputElement | null) => void;
  onPickFile: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUrlChange: (url: string) => void;
}) {
  const [urlDraft, setUrlDraft] = useState('');
  return (
    <div className="space-y-3">
      <label className="block text-[11px] tracking-[0.2em] uppercase text-muted">{label}</label>
      <div className="relative w-full aspect-video bg-cream-2 rounded-sm overflow-hidden border border-line">
        {currentUrl
          ? <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          : <div className="flex items-center justify-center h-full text-muted text-xs tracking-wider uppercase">No image</div>
        }
        {uploading !== null && (
          <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center gap-2">
            <div className="w-2/3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gold transition-all" style={{ width: `${uploading}%` }} />
            </div>
            <span className="text-white text-xs">{uploading}%</span>
          </div>
        )}
      </div>
      <button
        type="button" onClick={onPickFile} disabled={uploading !== null}
        className="w-full py-2 text-xs tracking-widest uppercase border border-dashed border-line rounded-sm text-muted hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
      >
        {uploading !== null ? 'Uploading…' : 'Upload Image'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      <div className="flex gap-2">
        <input
          type="url" value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
          placeholder="Or paste URL"
          className="flex-1 px-3 py-2 border border-line rounded-sm text-xs outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={() => { if (urlDraft.trim()) { onUrlChange(urlDraft.trim()); setUrlDraft(''); } }}
          className="px-3 py-2 text-xs tracking-widest uppercase border border-walnut text-walnut rounded-sm hover:bg-walnut hover:text-cream transition-all"
        >
          Set
        </button>
      </div>
    </div>
  );
}
