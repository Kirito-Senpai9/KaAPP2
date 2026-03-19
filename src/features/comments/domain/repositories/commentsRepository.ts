import type { CommentNode } from '@/features/comments/domain/entities/comment';

export interface CommentsRepository {
  getCommentsByPostId(postId: string): CommentNode[];
}
