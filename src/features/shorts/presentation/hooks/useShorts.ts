import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getShortsFeed,
  type ShortsFeedMode,
} from '@/features/shorts/application/use-cases/getShortsFeed';
import { getShortsRepository } from '@/features/shorts/infrastructure/repositories/mockShortsRepository';

export function useShorts(subscribed = true) {
  const [mode, setMode] = useState<ShortsFeedMode>('forYou');
  const repository = useMemo(() => getShortsRepository(), []);
  const { data = [] } = useQuery({
    queryKey: ['shorts', mode],
    queryFn: () => Promise.resolve(getShortsFeed(repository, mode)),
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    subscribed,
  });

  return { mode, setMode, data };
}
