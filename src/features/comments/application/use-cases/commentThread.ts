import type { CommentListRow, CommentNode } from '@/features/comments/domain/entities/comment';

export type CommentThreadIndex = {
  parentById: Map<string, string | null>;
  descendantCountById: Map<string, number>;
  totalCount: number;
};

/** Normalize repository input once, preserving already ordered branches. */
export function normalizeCommentOrder(comments: CommentNode[]): CommentNode[] {
  let changed = false;
  const normalized = comments.map((comment) => {
    const replies = normalizeCommentOrder(comment.replies);
    if (replies === comment.replies) return comment;
    changed = true;
    return { ...comment, replies };
  });

  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1].createdAt < normalized[index].createdAt) {
      normalized.sort((left, right) => right.createdAt - left.createdAt);
      return normalized;
    }
  }

  return changed ? normalized : comments;
}

export function insertCommentNewest(comments: CommentNode[], nextComment: CommentNode): CommentNode[] {
  const index = comments.findIndex((comment) => comment.createdAt <= nextComment.createdAt);
  const insertionIndex = index === -1 ? comments.length : index;
  return [...comments.slice(0, insertionIndex), nextComment, ...comments.slice(insertionIndex)];
}

export function buildCommentThreadIndex(comments: CommentNode[]): CommentThreadIndex {
  const parentById = new Map<string, string | null>();
  const descendantCountById = new Map<string, number>();
  const visited: CommentNode[] = [];
  const pending = comments.map((comment) => ({ comment, parentId: null as string | null }));

  while (pending.length > 0) {
    const { comment, parentId } = pending.pop()!;
    parentById.set(comment.id, parentId);
    visited.push(comment);
    for (const reply of comment.replies) pending.push({ comment: reply, parentId: comment.id });
  }

  for (let index = visited.length - 1; index >= 0; index -= 1) {
    const comment = visited[index];
    let descendants = 0;
    for (const reply of comment.replies) descendants += 1 + (descendantCountById.get(reply.id) ?? 0);
    descendantCountById.set(comment.id, descendants);
  }

  return { parentById, descendantCountById, totalCount: visited.length };
}

export function countNestedComments(comments: CommentNode[]): number {
  return buildCommentThreadIndex(comments).totalCount;
}

function updateComment(
  comments: CommentNode[],
  targetId: string,
  update: (comment: CommentNode) => CommentNode
): CommentNode[] {
  for (let index = 0; index < comments.length; index += 1) {
    const comment = comments[index];
    let nextComment = comment;
    if (comment.id === targetId) {
      nextComment = update(comment);
    } else if (comment.replies.length > 0) {
      const replies = updateComment(comment.replies, targetId, update);
      if (replies !== comment.replies) nextComment = { ...comment, replies };
    }

    if (nextComment !== comment) {
      const nextComments = comments.slice();
      nextComments[index] = nextComment;
      return nextComments;
    }
  }
  return comments;
}

export function toggleCommentLike(comments: CommentNode[], targetId: string): CommentNode[] {
  return updateComment(comments, targetId, (comment) => {
    const liked = !comment.liked;
    return { ...comment, liked, likes: Math.max(0, comment.likes + (liked ? 1 : -1)) };
  });
}

export function appendReply(comments: CommentNode[], targetId: string, nextReply: CommentNode): CommentNode[] {
  return updateComment(comments, targetId, (comment) => ({
    ...comment,
    replies: insertCommentNewest(comment.replies, nextReply),
  }));
}

export function expandCommentAncestors(
  expandedThreads: Record<string, boolean>,
  targetId: string,
  index: CommentThreadIndex
): Record<string, boolean> {
  if (!index.parentById.has(targetId)) return expandedThreads;
  const expanded = { ...expandedThreads };
  let currentId: string | null = targetId;
  while (currentId !== null) {
    expanded[currentId] = true;
    currentId = index.parentById.get(currentId) ?? null;
  }
  return expanded;
}

export function flattenComments(
  comments: CommentNode[],
  expandedThreads: Record<string, boolean>,
  index = buildCommentThreadIndex(comments)
): CommentListRow[] {
  type PendingRow =
    | { type: 'comment'; comment: CommentNode; depth: number; parentId?: string }
    | Extract<CommentListRow, { type: 'thread-toggle' }>;
  const rows: CommentListRow[] = [];
  const pending: PendingRow[] = comments.slice().reverse().map((comment) => ({
    type: 'comment', comment, depth: 0,
  }));

  while (pending.length > 0) {
    const item = pending.pop()!;
    if (item.type === 'thread-toggle') {
      rows.push(item);
      continue;
    }

    const { comment, depth, parentId } = item;
    rows.push(depth === 0
      ? { id: comment.id, type: 'root-comment', comment }
      : { id: comment.id, type: 'reply', actualDepth: depth, parentId: parentId!, comment });

    const repliesCount = index.descendantCountById.get(comment.id) ?? 0;
    if (repliesCount === 0) continue;
    const expanded = !!expandedThreads[comment.id];
    pending.push({
      id: `toggle-${comment.id}`, type: 'thread-toggle', parentId: comment.id,
      expanded, repliesCount,
    });
    if (expanded) {
      for (let replyIndex = comment.replies.length - 1; replyIndex >= 0; replyIndex -= 1) {
        pending.push({
          type: 'comment', comment: comment.replies[replyIndex], depth: depth + 1,
          parentId: comment.id,
        });
      }
    }
  }
  return rows;
}
