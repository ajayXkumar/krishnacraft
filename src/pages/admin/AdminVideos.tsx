import { useEffect, useState } from 'react';
import { getVideos, saveVideo, deleteVideo, videoThumbnail, extractVideoId, type Video } from '../../firebase/videos';
import { fetchChannelVideos, isYouTubeConfigured } from '../../lib/youtubeApi';
import { PlayIcon, YoutubeIcon } from '../../components/Icons';
import VideoThumb from '../../components/VideoThumb';

const EMPTY: Omit<Video, 'id' | 'createdAt'> = {
  title: '',
  url: '',
  description: '',
  category: '',
  featured: false,
};

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const load = () => {
    setLoading(true);
    getVideos().then(v => { setVideos(v); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(EMPTY);
    setEditId(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (v: Video) => {
    setForm({ title: v.title, url: v.url, description: v.description || '', category: v.category || '', featured: v.featured || false });
    setEditId(v.id);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim() || !form.title.trim()) { setError('Title and URL are required.'); return; }
    if (!extractVideoId(form.url)) { setError('Could not parse a YouTube video ID from that URL.'); return; }
    setBusy(true);
    setError('');
    try {
      const id = editId || `video_${Date.now()}`;
      await saveVideo({ ...form, id, createdAt: editId ? (videos.find(v => v.id === editId)?.createdAt ?? Date.now()) : Date.now() });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (v: Video) => {
    if (!confirm(`Delete "${v.title}"?`)) return;
    setDeleting(v.id);
    try {
      await deleteVideo(v.id);
      setVideos(prev => prev.filter(x => x.id !== v.id));
    } finally {
      setDeleting(null);
    }
  };

  const setFeatured = async (v: Video) => {
    setBusy(true);
    // Only one featured at a time — unfeature all others
    await Promise.all(
      videos
        .filter(x => x.featured && x.id !== v.id)
        .map(x => saveVideo({ ...x, featured: false }))
    );
    await saveVideo({ ...v, featured: !v.featured });
    load();
    setBusy(false);
  };

  const set = <K extends keyof typeof form>(k: K, val: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: val }));

  const syncFromYouTube = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const ytVideos = await fetchChannelVideos(20);
      if (!ytVideos.length) { setSyncMsg('No videos returned — check your API key and channel ID.'); return; }
      const existingIds = new Set(videos.map(v => extractVideoId(v.url)).filter(Boolean));
      const toAdd = ytVideos.filter(yt => !existingIds.has(yt.id));
      await Promise.all(
        toAdd.map(yt =>
          saveVideo({
            id: `video_${yt.id}`,
            title: yt.title,
            url: yt.url,
            description: '',
            category: '',
            featured: false,
            createdAt: new Date(yt.publishedAt).getTime(),
          })
        )
      );
      setSyncMsg(toAdd.length ? `Imported ${toAdd.length} new video${toAdd.length !== 1 ? 's' : ''}.` : 'All videos already imported.');
      load();
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const previewThumb = form.url ? videoThumbnail(form.url) : null;
  const previewId = form.url ? extractVideoId(form.url) : null;

  return (
    <div className="p-4 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-walnut text-3xl">Videos</h1>
          <p className="text-muted text-sm mt-1">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {isYouTubeConfigured() && (
            <button
              onClick={syncFromYouTube}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-widest rounded-sm border border-line text-walnut hover:bg-cream-2 transition-all disabled:opacity-60"
            >
              <YoutubeIcon size={13} />
              {syncing ? 'Syncing…' : 'Sync from YouTube'}
            </button>
          )}
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-widest rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
          >
            + Add Video
          </button>
        </div>
      </div>
      {syncMsg && (
        <p className="mb-5 text-sm text-muted bg-cream-2 border border-line rounded-sm px-4 py-3">{syncMsg}</p>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-8 bg-white border border-line rounded-xl p-6">
          <h2 className="text-lg text-walnut font-medium mb-5">{editId ? 'Edit Video' : 'Add Video'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">YouTube URL *</label>
              <input
                required
                type="url"
                value={form.url}
                onChange={e => set('url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
              />
            </div>

            {/* Live preview */}
            {previewId && previewThumb && (
              <div className="flex items-center gap-4 p-3 bg-cream-2 rounded-sm border border-line">
                <div className="relative w-28 aspect-video rounded-sm overflow-hidden shrink-0">
                  <VideoThumb url={form.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                    <PlayIcon size={14} className="text-cream" />
                  </div>
                </div>
                <p className="text-xs text-muted">Thumbnail loaded — video ID: <span className="font-mono text-walnut">{previewId}</span></p>
              </div>
            )}
            {form.url && !previewId && (
              <p className="text-xs text-maroon">Could not parse video ID from this URL.</p>
            )}

            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Handcrafting a Ladoo Gopal Singhasan"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Category</label>
                <input
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  placeholder="e.g. Ladoo Gopal, Behind the Scenes"
                  className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold"
                />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => set('featured', !form.featured)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.featured ? 'bg-gold' : 'bg-line'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.featured ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-muted">Feature on Videos page</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Short Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="A brief description shown on the video card…"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm resize-none outline-none focus:border-gold"
              />
            </div>

            {error && <p className="text-xs text-maroon">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="px-6 py-2.5 text-xs font-medium uppercase tracking-widest rounded-sm bg-walnut text-cream hover:bg-ink transition-all disabled:opacity-60"
              >
                {busy ? 'Saving…' : editId ? 'Save Changes' : 'Add Video'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-xs font-medium uppercase tracking-widest rounded-sm border border-line text-muted hover:text-walnut"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Video list */}
      {loading ? (
        <div className="text-muted text-sm py-10 text-center">Loading videos…</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <YoutubeIcon size={40} className="mx-auto mb-3 opacity-20" />
          <p>No videos yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          {videos.map((v, i) => {
            return (
              <div
                key={v.id}
                className={`flex items-center gap-5 px-5 py-4 ${i !== 0 ? 'border-t border-line' : ''}`}
              >
                {/* Thumbnail */}
                <div className="relative w-24 aspect-video rounded-sm overflow-hidden shrink-0 bg-cream-2">
                  <VideoThumb url={v.url} alt={v.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                    <PlayIcon size={12} className="text-cream" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-walnut text-sm truncate">{v.title}</p>
                    {v.featured && (
                      <span className="text-[9px] tracking-widest uppercase bg-gold/15 text-gold px-2 py-0.5 rounded-sm shrink-0">Featured</span>
                    )}
                  </div>
                  {v.category && <p className="text-xs text-muted mt-0.5">{v.category}</p>}
                  {v.description && <p className="text-xs text-muted mt-0.5 truncate">{v.description}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setFeatured(v)}
                    disabled={busy}
                    className={`text-[11px] tracking-widest uppercase transition-colors ${
                      v.featured ? 'text-gold' : 'text-muted hover:text-gold'
                    }`}
                  >
                    {v.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button onClick={() => openEdit(v)} className="text-[11px] tracking-widest uppercase text-gold hover:text-walnut">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v)}
                    disabled={deleting === v.id}
                    className="text-[11px] tracking-widest uppercase text-maroon hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
