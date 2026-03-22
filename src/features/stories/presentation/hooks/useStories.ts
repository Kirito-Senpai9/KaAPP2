import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStories } from '@/features/stories/application/use-cases/getStories';
import { getStoriesRepository } from '@/features/stories/infrastructure/repositories/mockStoriesRepository';

export function useStories(subscribed = true) {
  const repository = useMemo(() => getStoriesRepository(), []);
  const { data = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: () => Promise.resolve(getStories(repository)),
    staleTime: Infinity,
    subscribed,
  });

  return data;
}
