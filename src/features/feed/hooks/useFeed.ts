import { useMemo } from 'react';
import { getFeedData } from '@/features/feed/services/feedService';

export function useFeed() {
  return useMemo(() => getFeedData(), []);
}
