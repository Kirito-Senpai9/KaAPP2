import type {
  CommentListRow,
  CommentNode,
} from '@/features/comments/domain/entities/comment';

function sortCommentsByNewest(comments: CommentNode[]): CommentNode[] {
  return [...comments]
    .sort((left, right) => right.createdAt - left.createdAt)
    .map((comment) => ({
      ...comment,
      replies: sortCommentsByNewest(comment.replies),
    }));
}

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
        replies: [nextReply, ...comment.replies],
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
  depth = 0,
  parentId?: string
): CommentListRow[] {
  return sortCommentsByNewest(comments).flatMap((comment) => {
    const rows: CommentListRow[] = [
      depth === 0
        ? {
            id: comment.id,
            type: 'root-comment',
            comment,
          }
        : {
            id: comment.id,
            type: 'reply',
            actualDepth: depth,
            parentId: parentId ?? comment.id,
            comment,
          },
    ];

    const repliesCount = countNestedComments(comment.replies);

    if (repliesCount > 0) {
      const expanded = !!expandedThreads[comment.id];

      rows.push({
        id: `toggle-${comment.id}`,
        type: 'thread-toggle',
        parentId: comment.id,
        expanded,
        repliesCount,
      });

      if (expanded) {
        rows.push(
          ...flattenComments(comment.replies, expandedThreads, depth + 1, comment.id)
        );
      }
    }

    return rows;
  });
}
