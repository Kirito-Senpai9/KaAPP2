import type { Story } from '@/features/stories/domain/entities/story';
import type { StoriesRepository } from '@/features/stories/domain/repositories/storiesRepository';

export function getStories(repository: StoriesRepository): Story[] {
  return repository.getStories();
}
