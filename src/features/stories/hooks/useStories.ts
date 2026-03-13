import { useMemo } from 'react';
import { getStoriesData } from '@/features/stories/services/storiesService';

export function useStories() {
  return useMemo(() => getStoriesData(), []);
}
