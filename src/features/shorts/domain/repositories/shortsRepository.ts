import type { Short } from '@/features/shorts/domain/entities/short';

export interface ShortsRepository {
  getForYou(): Short[];
  getFollowing(): Short[];
}
