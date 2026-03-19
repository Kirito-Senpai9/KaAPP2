import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function useComments(
  postId: string | null,
  initialCount = 0
): UseCommentsResult {
  const loadedPostIdRef = useRef<string | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentReplyTarget | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [baseCountOffset, setBaseCountOffset] = useState(0);
  const [initialCountSnapshot, setInitialCountSnapshot] = useState(initialCount);

  const resetTransientState = useCallback(() => {
    setInput('');
    setReplyingTo(null);
    setExpandedThreads({});
  }, []);

  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    if (!postId) {
      loadedPostIdRef.current = null;
      setComments([]);
      setBaseCountOffset(0);
      setInitialCountSnapshot(0);
      setIsLoading(false);
      resetTransientState();
      return;
    }

    if (loadedPostIdRef.current === postId) {
      return;
    }

    loadedPostIdRef.current = postId;
    resetTransientState();
    setIsLoading(true);
    setComments([]);
    setInitialCountSnapshot(initialCount);

    const nextComments = getCommentsRepository().getCommentsByPostId(postId);
    const nextVisibleCount = countNestedComments(nextComments);
    setBaseCountOffset(Math.max(0, initialCount - nextVisibleCount));

    loadTimeoutRef.current = setTimeout(() => {
      setComments(nextComments);
      setIsLoading(false);
      loadTimeoutRef.current = null;
    }, 180);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [initialCount, postId, resetTransientState]);

  const rows = useMemo(
    () => flattenComments(comments, expandedThreads),
    [comments, expandedThreads]
  );

  const visibleCount = useMemo(() => countNestedComments(comments), [comments]);
  const totalCount = useMemo(() => {
    const computed = baseCountOffset + visibleCount;
    return isLoading ? Math.max(initialCountSnapshot, computed) : computed;
  }, [baseCountOffset, initialCountSnapshot, isLoading, visibleCount]);

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
    setComments((currentComments) => toggleCommentLike(currentComments, commentId));
  }, []);

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
      replies: [],
    };

    if (replyingTo) {
      setComments((currentComments) =>
        appendReply(currentComments, replyingTo.id, nextComment)
      );
      setExpandedThreads((currentThreads) => ({
        ...currentThreads,
        [replyingTo.id]: true,
      }));
    } else {
      setComments((currentComments) => [...currentComments, nextComment]);
    }

    setInput('');
    setReplyingTo(null);
    return nextComment.id;
  }, [input, replyingTo]);

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
