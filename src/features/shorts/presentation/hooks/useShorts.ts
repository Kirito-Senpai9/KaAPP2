import { useMemo, useState } from 'react';
import {
  getShortsFeed,
  type ShortsFeedMode,
} from '@/features/shorts/application/use-cases/getShortsFeed';
import { getShortsRepository } from '@/features/shorts/infrastructure/repositories/mockShortsRepository';

export function useShorts() {
  const [mode, setMode] = useState<ShortsFeedMode>('forYou');
  const data = useMemo(() => getShortsFeed(getShortsRepository(), mode), [mode]);
  return { mode, setMode, data };
}
