import { videoThumbnail } from '../firebase/videos';

interface Props { url: string; alt?: string; className?: string; }

export default function VideoThumb({ url, alt = '', className = '' }: Props) {
  const src = videoThumbnail(url); // always hqdefault.jpg — guaranteed to exist
  if (!src) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
