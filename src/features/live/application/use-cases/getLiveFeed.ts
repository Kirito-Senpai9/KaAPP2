import type { LiveStream } from '@/features/live/domain/entities/live';
import type { LiveRepository } from '@/features/live/domain/repositories/liveRepository';

export function getLiveFeed(repository: LiveRepository): LiveStream[] {
  return repository.getLives();
}
