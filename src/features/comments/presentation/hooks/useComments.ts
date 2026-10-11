import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  appendReply,
  buildCommentThreadIndex,
  expandCommentAncestors,
  flattenComments,
  insertCommentNewest,
  toggleCommentLike,
} from '@/features/comments/application/use-cases/commentThread';
import type {
  CommentAuthor,
  CommentListRow,
  CommentNode,
  CommentReplyTarget,
} from '@/features/comments/domain/entities/comment';
import { getCommentsRepository } from '@/features/comments/infrastructure/repositories/mockCommentsRepository';

type UseCommentsResult = {
  currentUser: CommentAuthor;
  comments: CommentNode[];
  rows: CommentListRow[];
  replyingTo: CommentReplyTarget | null;
  isLoading: boolean;
  totalCount: number;
  sendComment: (content: string) => string | null;
  replyToComment: (comment: CommentNode) => void;
  cancelReply: () => void;
  toggleLike: (commentId: string) => void;
  toggleThread: (commentId: string) => void;
  resetTransientState: () => void;
};

export const CURRENT_COMMENT_USER: CommentAuthor = {
  id: 'me',
  username: 'Voce',
  avatar: 'https://i.pravatar.cc/120?img=15',
};

const EMPTY_COMMENTS: CommentNode[] = [];
let commentSequence = 0;

export function useComments(
  postId: string | null,
  initialCount = 0
): UseCommentsResult {
  const queryClient = useQueryClient();
  const sessionPostIdRef = useRef<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommentReplyTarget | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [initialCountSnapshot, setInitialCountSnapshot] = useState(initialCount);
  const [sessionBaselineVisibleCount, setSessionBaselineVisibleCount] = useState<number | null>(null);
  const repositoryRef = useRef(getCommentsRepository());
  const commentsQueryKey = useMemo(() => ['comments', postId] as const, [postId]);

  const resetTransientState = useCallback(() => {
    setReplyingTo(null);
    setExpandedThreads({});
  }, []);

  const query = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      if (!postId) {
        return EMPTY_COMMENTS;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 180);
      });

      return repositoryRef.current.getCommentsByPostId(postId);
    },
    enabled: !!postId,
    staleTime: Infinity,
  });
  const comments = query.data ?? EMPTY_COMMENTS;
  const isLoading = query.isLoading;
  const threadIndex = useMemo(() => buildCommentThreadIndex(comments), [comments]);

  useEffect(() => {
    if (!postId) {
      sessionPostIdRef.current = null;
      setInitialCountSnapshot(0);
      setSessionBaselineVisibleCount(null);
      resetTransientState();
      return;
    }

    if (sessionPostIdRef.current === postId) {
      return;
    }

    sessionPostIdRef.current = postId;
    resetTransientState();
    setInitialCountSnapshot(initialCount);
    setSessionBaselineVisibleCount(null);
  }, [initialCount, postId, resetTransientState]);

  useEffect(() => {
    if (!postId || isLoading || sessionBaselineVisibleCount !== null) {
      return;
    }

    setSessionBaselineVisibleCount(threadIndex.totalCount);
  }, [threadIndex.totalCount, isLoading, postId, sessionBaselineVisibleCount]);

  const rows = useMemo(
    () => flattenComments(comments, expandedThreads, threadIndex),
    [comments, expandedThreads, threadIndex]
  );

  const visibleCount = threadIndex.totalCount;
  const baselineVisibleCount = sessionBaselineVisibleCount ?? visibleCount;
  const baseCountOffset = useMemo(
    () => Math.max(0, initialCountSnapshot - baselineVisibleCount),
    [baselineVisibleCount, initialCountSnapshot]
  );
  const totalCount = useMemo(() => {
    const computed = baseCountOffset + visibleCount;
    return isLoading ? Math.max(initialCountSnapshot, computed) : computed;
  }, [baseCountOffset, initialCountSnapshot, isLoading, visibleCount]);

  const updateComments = useCallback(
    (updater: (currentComments: CommentNode[]) => CommentNode[]) => {
      if (!postId) {
        return EMPTY_COMMENTS;
      }

      let nextComments = EMPTY_COMMENTS;
      queryClient.setQueryData(commentsQueryKey, (currentComments?: CommentNode[]) => {
        const resolvedComments =
          currentComments ?? repositoryRef.current.getCommentsByPostId(postId);
        nextComments = updater(resolvedComments);
        repositoryRef.current.saveCommentsByPostId(postId, nextComments);
        return nextComments;
      });

      return nextComments;
    },
    [commentsQueryKey, postId, queryClient]
  );

  const replyToComment = useCallback((comment: CommentNode) => {
    setReplyingTo({
      id: comment.id,
      username: comment.author.username,
    });
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const toggleLike = useCallback((commentId: string) => {
    updateComments((currentComments) =>
      toggleCommentLike(currentComments, commentId)
    );
  }, [updateComments]);

  const toggleThread = useCallback((commentId: string) => {
    setExpandedThreads((currentThreads) => ({
      ...currentThreads,
      [commentId]: !currentThreads[commentId],
    }));
  }, []);

  const sendComment = useCallback((text: string) => {
    const content = text.trim();

    if (!content || !postId) {
      return null;
    }

    if (replyingTo && !threadIndex.parentById.has(replyingTo.id)) return null;

    const nextComment: CommentNode = {
      id: `comment-${Date.now()}-${++commentSequence}`,
      author: CURRENT_COMMENT_USER,
      content,
      createdAt: Date.now(),
      likes: 0,
      liked: false,
      replyingToUsername: replyingTo?.username,
      replies: [],
    };

    if (replyingTo) {
      updateComments((currentComments) =>
        appendReply(currentComments, replyingTo.id, nextComment)
      );
      setExpandedThreads((currentThreads) =>
        expandCommentAncestors(currentThreads, replyingTo.id, threadIndex)
      );
    } else {
      updateComments((currentComments) => insertCommentNewest(currentComments, nextComment));
    }

    setReplyingTo(null);
    return nextComment.id;
  }, [postId, replyingTo, threadIndex, updateComments]);

  return {
    currentUser: CURRENT_COMMENT_USER,
    comments,
    rows,
    replyingTo,
    isLoading,
    totalCount,
    sendComment,
    replyToComment,
    cancelReply,
    toggleLike,
    toggleThread,
    resetTransientState,
  };
}
