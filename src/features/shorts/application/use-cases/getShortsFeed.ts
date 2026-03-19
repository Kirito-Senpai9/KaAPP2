import type { Short } from '@/features/shorts/domain/entities/short';
import type { ShortsRepository } from '@/features/shorts/domain/repositories/shortsRepository';

export type ShortsFeedMode = 'forYou' | 'following';

export function getShortsFeed(
  repository: ShortsRepository,
  mode: ShortsFeedMode
): Short[] {
  return mode === 'forYou' ? repository.getForYou() : repository.getFollowing();
}
