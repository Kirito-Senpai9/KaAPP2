import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLiveFeed } from '@/features/live/application/use-cases/getLiveFeed';
import { getLiveRepository } from '@/features/live/infrastructure/repositories/mockLiveRepository';

export function useLives(subscribed = true) {
  const repository = useMemo(() => getLiveRepository(), []);
  const { data = [] } = useQuery({
    queryKey: ['lives'],
    queryFn: () => Promise.resolve(getLiveFeed(repository)),
    staleTime: Infinity,
    subscribed,
  });

  return { data };
}
