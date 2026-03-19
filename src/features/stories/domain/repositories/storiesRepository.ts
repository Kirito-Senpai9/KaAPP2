import type { Story } from '@/features/stories/domain/entities/story';

export interface StoriesRepository {
  getStories(): Story[];
}
