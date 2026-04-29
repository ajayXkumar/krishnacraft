const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID as string | undefined;

export interface YTVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string; // direct URL from YouTube, always valid
  publishedAt: string;
}

export function isYouTubeConfigured(): boolean {
  return !!(API_KEY && CHANNEL_ID);
}

export async function fetchChannelVideos(maxResults = 20): Promise<YTVideo[]> {
  if (!API_KEY || !CHANNEL_ID) return [];
  try {
    // Uploads playlist ID = 'UU' + channelId without the 'UC' prefix
    const uploadPlaylistId = 'UU' + CHANNEL_ID.replace(/^UC/, '');
    const params = new URLSearchParams({
      playlistId: uploadPlaylistId,
      part: 'snippet',
      maxResults: String(maxResults),
      key: API_KEY,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item: Record<string, any>) => {
      const snippet = item.snippet;
      const videoId: string = snippet.resourceId.videoId;
      const thumbs = snippet.thumbnails;
      return {
        id: videoId,
        title: snippet.title as string,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: thumbs.standard?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? '',
        publishedAt: snippet.publishedAt as string,
      };
    });
  } catch {
    return [];
  }
}
