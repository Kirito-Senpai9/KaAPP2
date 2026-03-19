import type { Post } from '@/features/feed/domain/entities/post';

export interface FeedRepository {
  getPosts(): Post[];
}
