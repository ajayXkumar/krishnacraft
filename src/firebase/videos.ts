import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './config';

export interface Video {
  id: string;
  title: string;
  url: string;         // full YouTube URL
  description?: string;
  category?: string;   // e.g. "Ladoo Gopal", "Behind the Scenes"
  featured?: boolean;  // shown as hero on /videos
  createdAt: number;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,           // youtube.com/watch?v=ID
    /youtu\.be\/([^?&#]+)/,     // youtu.be/ID
    /\/shorts\/([^?&#]+)/,      // youtube.com/shorts/ID
    /\/embed\/([^?&#]+)/,       // youtube.com/embed/ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function videoThumbnail(url: string): string {
  const id = extractVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

export function videoThumbnailMax(url: string): string {
  const id = extractVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
}

export function embedUrl(url: string, autoplay = false): string {
  const id = extractVideoId(url);
  if (!id) return '';
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: '0',
    modestbranding: '1',
  });
  return `https://www.youtube.com/embed/${id}?${params}`;
}

export async function getVideos(): Promise<Video[]> {
  const snap = await getDocs(query(collection(db, 'videos'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Video));
}

export async function saveVideo(video: Video): Promise<void> {
  const { id, ...data } = video;
  await setDoc(doc(db, 'videos', id), data, { merge: true });
}

export async function deleteVideo(id: string): Promise<void> {
  await deleteDoc(doc(db, 'videos', id));
}
