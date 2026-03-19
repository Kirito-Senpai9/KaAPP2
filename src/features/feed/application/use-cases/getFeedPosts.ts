import type { Post } from '@/features/feed/domain/entities/post';
import type { FeedRepository } from '@/features/feed/domain/repositories/feedRepository';

export function getFeedPosts(repository: FeedRepository): Post[] {
  return repository.getPosts();
}
