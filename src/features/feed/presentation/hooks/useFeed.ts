import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFeedPosts } from '@/features/feed/application/use-cases/getFeedPosts';
import { getFeedRepository } from '@/features/feed/infrastructure/repositories/mockFeedRepository';

export function useFeed(subscribed = true) {
  const repository = useMemo(() => getFeedRepository(), []);
  const { data = [] } = useQuery({
    queryKey: ['feed'],
    queryFn: () => Promise.resolve(getFeedPosts(repository)),
    staleTime: Infinity,
    subscribed,
  });

  return useMemo(() => ({ posts: data }), [data]);
}
