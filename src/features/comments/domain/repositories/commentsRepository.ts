import type { CommentNode } from '@/features/comments/domain/entities/comment';

export interface CommentsRepository {
  getCommentsByPostId(postId: string): CommentNode[];
  saveCommentsByPostId(postId: string, comments: CommentNode[]): void;
}
