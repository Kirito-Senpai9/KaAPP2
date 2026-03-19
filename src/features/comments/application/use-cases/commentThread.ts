import type {
  CommentListRow,
  CommentNode,
} from '@/features/comments/domain/entities/comment';

export function countNestedComments(comments: CommentNode[]): number {
  return comments.reduce((total, comment) => {
    return total + 1 + countNestedComments(comment.replies);
  }, 0);
}

export function toggleCommentLike(
  comments: CommentNode[],
  targetId: string
): CommentNode[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      const liked = !comment.liked;
      return {
        ...comment,
        liked,
        likes: Math.max(0, comment.likes + (liked ? 1 : -1)),
      };
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: toggleCommentLike(comment.replies, targetId),
    };
  });
}

export function appendReply(
  comments: CommentNode[],
  targetId: string,
  nextReply: CommentNode
): CommentNode[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        replies: [...comment.replies, nextReply],
      };
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: appendReply(comment.replies, targetId, nextReply),
    };
  });
}

export function flattenComments(
  comments: CommentNode[],
  expandedThreads: Record<string, boolean>,
  depth = 0
): CommentListRow[] {
  return comments.flatMap((comment) => {
    const rows: CommentListRow[] = [
      {
        id: comment.id,
        type: 'comment',
        depth,
        comment,
      },
    ];

    const repliesCount = countNestedComments(comment.replies);

    if (repliesCount > 0) {
      const expanded = !!expandedThreads[comment.id];

      rows.push({
        id: `toggle-${comment.id}`,
        type: 'thread-toggle',
        depth: depth + 1,
        parentId: comment.id,
        expanded,
        repliesCount,
      });

      if (expanded) {
        rows.push(...flattenComments(comment.replies, expandedThreads, depth + 1));
      }
    }

    return rows;
  });
}
