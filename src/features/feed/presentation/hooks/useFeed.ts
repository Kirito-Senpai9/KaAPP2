import { useMemo } from 'react';
import { getFeedPosts } from '@/features/feed/application/use-cases/getFeedPosts';
import { getFeedRepository } from '@/features/feed/infrastructure/repositories/mockFeedRepository';

export function useFeed() {
  return useMemo(() => ({ posts: getFeedPosts(getFeedRepository()) }), []);
}
