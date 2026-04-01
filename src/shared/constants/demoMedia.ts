import type { VideoSource } from 'expo-video';

export const DEMO_VIDEO_URLS = {
  verticalFeed: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  horizontalFeed: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
} as const;

export function createCachedVideoSource(uri: string): VideoSource {
  return {
    uri,
    useCaching: true,
  };
}
