import { useEffect } from 'react';
import { embedUrl } from '../firebase/videos';
import { XIcon } from './Icons';

interface VideoModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function VideoModal({ url, title, onClose }: VideoModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-cream/80 text-sm font-medium tracking-wide truncate pr-4">{title}</p>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-cream transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video rounded-xl overflow-hidden bg-ink shadow-2xl">
          <iframe
            src={embedUrl(url, true)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
