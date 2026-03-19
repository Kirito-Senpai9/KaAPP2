import { useMemo } from 'react';
import { getStories } from '@/features/stories/application/use-cases/getStories';
import { getStoriesRepository } from '@/features/stories/infrastructure/repositories/mockStoriesRepository';

export function useStories() {
  return useMemo(() => getStories(getStoriesRepository()), []);
}
