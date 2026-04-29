import { useEffect, useState, useMemo } from 'react';
import { getVideos, extractVideoId, type Video } from '../firebase/videos';
import { fetchChannelVideos, isYouTubeConfigured, type YTVideo } from '../lib/youtubeApi';
import VideoModal from '../components/VideoModal';
import { PlayIcon, YoutubeIcon, ArrowRightIcon } from '../components/Icons';

const CHANNEL_URL = 'https://www.youtube.com/@kanhacraft-c6b';

interface DisplayVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description?: string;
  category?: string;
  featured?: boolean;
}

function toDisplay(v: Video): DisplayVideo {
  const vid = extractVideoId(v.url);
  return {
    id: v.id,
    title: v.title,
    url: v.url,
    thumbnail: vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : '',
    description: v.description,
    category: v.category,
    featured: v.featured,
  };
}

function fromYT(yt: YTVideo, meta?: Video): DisplayVideo {
  return {
    id: yt.id,
    title: meta?.title || yt.title,
    url: yt.url,
    thumbnail: yt.thumbnail || `https://img.youtube.com/vi/${yt.id}/hqdefault.jpg`,
    description: meta?.description,
    category: meta?.category,
    featured: meta?.featured,
  };
}

export default function Videos() {
  const [videos, setVideos] = useState<DisplayVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [modalVideo, setModalVideo] = useState<DisplayVideo | null>(null);

  useEffect(() => {
    (async () => {
      const firestoreVideos = await getVideos();
      if (isYouTubeConfigured()) {
        const ytVideos = await fetchChannelVideos(20);
        if (ytVideos.length > 0) {
          const metaMap = new Map(firestoreVideos.map(v => [extractVideoId(v.url), v]));
          setVideos(ytVideos.map(yt => fromYT(yt, metaMap.get(yt.id) ?? undefined)));
          setLoading(false);
          return;
        }
      }
      setVideos(firestoreVideos.map(toDisplay));
      setLoading(false);
    })();
  }, []);

  const featured = videos.find(v => v.featured) ?? videos[0] ?? null;
  const rest = featured ? videos.filter(v => v.id !== featured.id) : videos;

  const categories = useMemo(() => {
    const cats = [...new Set(rest.map(v => v.category).filter(Boolean))] as string[];
    return cats.length ? ['All', ...cats] : [];
  }, [rest]);

  const filtered = useMemo(() =>
    activeCat === 'All' ? rest : rest.filter(v => v.category === activeCat),
    [rest, activeCat]
  );

  // Navbar is trust-bar (~28px) + main nav (~64px) = ~92px on sm+
  const topPad = 'pt-[92px] sm:pt-[116px]';

  return (
    <div className={`min-h-screen bg-cream-2 ${topPad}`}>

      {/* Page header */}
      <div className="bg-cream border-b border-line py-8 px-5 lg:px-8">
        <div className="max-w-[1280px] mx-auto flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-1">94.6K Subscribers</p>
            <h1 className="font-display text-walnut" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Krishna Craft Videos
            </h1>
            <p className="text-muted text-sm mt-1">Watch our craftsmen turn raw wood into heirlooms.</p>
          </div>
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-walnut text-cream text-xs font-medium tracking-widest uppercase hover:bg-ink transition-colors"
          >
            <YoutubeIcon size={13} />
            Subscribe
          </a>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : videos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-10">

          {/* Featured video — cinematic card */}
          {featured && (
            <div
              className="relative rounded-2xl overflow-hidden cursor-pointer group mb-12 shadow-soft"
              style={{ maxHeight: 480 }}
              onClick={() => setModalVideo(featured)}
            >
              {/* Background blur */}
              <img src={featured.thumbnail} alt="" aria-hidden
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 pointer-events-none" />
              <div className="absolute inset-0 bg-ink/60" />

              {/* Thumbnail */}
              <img
                src={featured.thumbnail}
                alt={featured.title}
                className="relative w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                style={{ maxHeight: 480, width: '100%' }}
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />

              {/* Play button centre */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gold/90 group-hover:bg-gold group-hover:scale-110 flex items-center justify-center transition-all duration-300 shadow-xl">
                  <PlayIcon size={22} className="text-white ml-1" />
                </div>
              </div>

              {/* Meta bottom-left */}
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                {featured.category && (
                  <span className="text-[10px] tracking-[0.25em] uppercase text-gold font-medium block mb-2">
                    {featured.category}
                  </span>
                )}
                <h2 className="font-display text-white leading-snug mb-2"
                  style={{ fontSize: 'clamp(18px, 3vw, 32px)' }}>
                  {featured.title}
                </h2>
                {featured.description && (
                  <p className="text-cream/70 text-sm line-clamp-2 max-w-xl">{featured.description}</p>
                )}
                <span className="inline-flex items-center gap-2 mt-4 text-xs text-cream/60 tracking-widest uppercase">
                  Watch Now <ArrowRightIcon size={12} />
                </span>
              </div>
            </div>
          )}

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-8">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-medium tracking-wide transition-all ${
                    activeCat === cat
                      ? 'bg-walnut text-cream'
                      : 'bg-white border border-line text-walnut hover:bg-cream'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Section label */}
          {rest.length > 0 && (
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-5">
              All Videos
              <span className="ml-2 text-gold">{filtered.length}</span>
            </p>
          )}

          {/* Video grid */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted py-16 text-sm">No videos in this category yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setModalVideo(video)} />
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-14 py-10 border-t border-line text-center">
            <p className="text-muted text-sm mb-4">See all 353 videos on our YouTube channel</p>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-medium uppercase tracking-widest rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
            >
              <YoutubeIcon size={14} />
              Visit Channel
            </a>
          </div>
        </div>
      )}

      {modalVideo && (
        <VideoModal url={modalVideo.url} title={modalVideo.title} onClose={() => setModalVideo(null)} />
      )}
    </div>
  );
}

function VideoCard({ video, onClick }: { video: DisplayVideo; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group text-left w-full">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-walnut/10">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
            <PlayIcon size={13} className="text-white ml-0.5" />
          </div>
        </div>
        {video.category && (
          <span className="absolute top-2 left-2 text-[9px] tracking-wider uppercase bg-ink/60 text-cream/90 px-2 py-0.5 rounded">
            {video.category}
          </span>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="text-walnut text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-muted text-[11px] mt-1 line-clamp-1">{video.description}</p>
        )}
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-10">
      <div className="aspect-video rounded-2xl bg-cream animate-pulse mb-10" style={{ maxHeight: 480 }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-video rounded-xl bg-cream animate-pulse" />
            <div className="mt-3 h-3 bg-cream rounded animate-pulse w-3/4" />
            <div className="mt-1.5 h-3 bg-cream rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-32 text-muted">
      <YoutubeIcon size={40} className="mx-auto mb-4 opacity-20" />
      <p className="text-lg mb-1">No videos yet</p>
      <p className="text-sm mb-6">Add videos from the admin panel.</p>
      <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink transition-all">
        <YoutubeIcon size={13} /> Visit Our Channel
      </a>
    </div>
  );
}
