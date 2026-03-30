import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  appendReply,
  countNestedComments,
  flattenComments,
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
  input: string;
  setInput: (value: string) => void;
  replyingTo: CommentReplyTarget | null;
  isLoading: boolean;
  totalCount: number;
  sendComment: () => string | null;
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

export function useComments(
  postId: string | null,
  initialCount = 0
): UseCommentsResult {
  const queryClient = useQueryClient();
  const sessionPostIdRef = useRef<string | null>(null);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentReplyTarget | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [initialCountSnapshot, setInitialCountSnapshot] = useState(initialCount);
  const [sessionBaselineVisibleCount, setSessionBaselineVisibleCount] = useState<number | null>(null);
  const repositoryRef = useRef(getCommentsRepository());
  const commentsQueryKey = useMemo(() => ['comments', postId] as const, [postId]);

  const resetTransientState = useCallback(() => {
    setInput('');
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

    setSessionBaselineVisibleCount(countNestedComments(comments));
  }, [comments, isLoading, postId, sessionBaselineVisibleCount]);

  const rows = useMemo(
    () => flattenComments(comments, expandedThreads),
    [comments, expandedThreads]
  );

  const visibleCount = useMemo(() => countNestedComments(comments), [comments]);
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

  const sendComment = useCallback(() => {
    const content = input.trim();

    if (!content) {
      return null;
    }

    const nextComment: CommentNode = {
      id: `comment-${Date.now()}`,
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
      setExpandedThreads((currentThreads) => ({
        ...currentThreads,
        [replyingTo.id]: true,
      }));
    } else {
      updateComments((currentComments) => [nextComment, ...currentComments]);
    }

    setInput('');
    setReplyingTo(null);
    return nextComment.id;
  }, [input, replyingTo, updateComments]);

  return {
    currentUser: CURRENT_COMMENT_USER,
    comments,
    rows,
    input,
    setInput,
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
