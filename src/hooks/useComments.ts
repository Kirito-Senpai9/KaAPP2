import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CommentAuthor,
  CommentListRow,
  CommentNode,
  CommentReplyTarget,
} from '@/types/comment';

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

type CommentFixture = {
  id: string;
  author: CommentAuthor;
  content: string;
  minutesAgo: number;
  likes: number;
  replies?: CommentFixture[];
};

export const CURRENT_COMMENT_USER: CommentAuthor = {
  id: 'me',
  username: 'Voce',
  avatar: 'https://i.pravatar.cc/120?img=15',
};

const COMMENT_FIXTURES: Record<string, CommentFixture[]> = {
  p1: [
    {
      id: 'p1-comment-1',
      author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
      content: 'Esse mapa novo combinou demais com a identidade do app.',
      minutesAgo: 8,
      likes: 12,
      replies: [
        {
          id: 'p1-reply-1',
          author: { id: 'kai', username: 'Kai', avatar: 'https://i.pravatar.cc/120?img=3' },
          content: 'Tambem achei. Ficou com cara de post em destaque.',
          minutesAgo: 4,
          likes: 4,
        },
      ],
    },
    {
      id: 'p1-comment-2',
      author: { id: 'mina', username: 'Mina', avatar: 'https://i.pravatar.cc/120?img=4' },
      content: 'Quero ver a versao em video desse mesmo layout.',
      minutesAgo: 15,
      likes: 7,
    },
    {
      id: 'p1-comment-3',
      author: { id: 'ayla', username: 'Ayla', avatar: 'https://i.pravatar.cc/120?img=22' },
      content: 'Curti muito o contraste da arte com o fundo escuro.',
      minutesAgo: 29,
      likes: 5,
    },
  ],
  p2: [
    {
      id: 'p2-comment-1',
      author: { id: 'noah', username: 'Noah', avatar: 'https://i.pravatar.cc/120?img=48' },
      content: 'Esse treino ficou liso demais no video vertical.',
      minutesAgo: 7,
      likes: 18,
      replies: [
        {
          id: 'p2-reply-1',
          author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
          content: 'A transicao do meio ficou muito boa.',
          minutesAgo: 5,
          likes: 6,
        },
        {
          id: 'p2-reply-2',
          author: { id: 'ethan', username: 'Ethan', avatar: 'https://i.pravatar.cc/120?img=11' },
          content: 'Faz uma versao com highlights mais longos depois.',
          minutesAgo: 3,
          likes: 2,
        },
      ],
    },
    {
      id: 'p2-comment-2',
      author: { id: 'ayla', username: 'Ayla', avatar: 'https://i.pravatar.cc/120?img=22' },
      content: 'A thumbnail tambem ficou forte. Chama bastante atencao.',
      minutesAgo: 19,
      likes: 9,
    },
  ],
  p3: [
    {
      id: 'p3-comment-1',
      author: { id: 'mina', username: 'Mina', avatar: 'https://i.pravatar.cc/120?img=4' },
      content: 'Setup bonito e clean. Parece pronto para live mesmo.',
      minutesAgo: 11,
      likes: 24,
      replies: [
        {
          id: 'p3-reply-1',
          author: { id: 'kai', username: 'Kai', avatar: 'https://i.pravatar.cc/120?img=3' },
          content: 'So faltou mostrar os perifericos em outro angulo.',
          minutesAgo: 9,
          likes: 3,
        },
      ],
    },
    {
      id: 'p3-comment-2',
      author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
      content: 'A iluminacao puxou bem a paleta do feed.',
      minutesAgo: 16,
      likes: 10,
    },
    {
      id: 'p3-comment-3',
      author: { id: 'noah', username: 'Noah', avatar: 'https://i.pravatar.cc/120?img=48' },
      content: 'Da para virar capa de perfil facil.',
      minutesAgo: 24,
      likes: 5,
    },
  ],
  p4: [
    {
      id: 'p4-comment-1',
      author: { id: 'ethan', username: 'Ethan', avatar: 'https://i.pravatar.cc/120?img=11' },
      content: 'Os highlights horizontais ficaram com vibe de recap profissional.',
      minutesAgo: 14,
      likes: 13,
    },
    {
      id: 'p4-comment-2',
      author: { id: 'kai', username: 'Kai', avatar: 'https://i.pravatar.cc/120?img=3' },
      content: 'Mandou bem demais no recorte dos melhores momentos.',
      minutesAgo: 21,
      likes: 8,
      replies: [
        {
          id: 'p4-reply-1',
          author: { id: 'ayla', username: 'Ayla', avatar: 'https://i.pravatar.cc/120?img=22' },
          content: 'Tambem achei. O ritmo ficou muito bom.',
          minutesAgo: 17,
          likes: 2,
        },
      ],
    },
  ],
  p5: [
    {
      id: 'p5-comment-1',
      author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
      content: 'Agora esse time vai longe no torneio.',
      minutesAgo: 6,
      likes: 27,
      replies: [
        {
          id: 'p5-reply-1',
          author: { id: 'mina', username: 'Mina', avatar: 'https://i.pravatar.cc/120?img=4' },
          content: 'A energia da foto passa muita confianca.',
          minutesAgo: 4,
          likes: 5,
        },
      ],
    },
    {
      id: 'p5-comment-2',
      author: { id: 'noah', username: 'Noah', avatar: 'https://i.pravatar.cc/120?img=48' },
      content: 'Quero ver os bastidores dessa montagem depois.',
      minutesAgo: 18,
      likes: 11,
    },
  ],
};

function fixtureToNode(fixture: CommentFixture): CommentNode {
  return {
    id: fixture.id,
    author: fixture.author,
    content: fixture.content,
    createdAt: Date.now() - fixture.minutesAgo * 60 * 1000,
    likes: fixture.likes,
    liked: false,
    replies: (fixture.replies ?? []).map(fixtureToNode),
  };
}

function buildMockComments(postId: string): CommentNode[] {
  const fixtures = COMMENT_FIXTURES[postId] ?? COMMENT_FIXTURES.p1;
  return fixtures.map(fixtureToNode);
}

function countNestedComments(comments: CommentNode[]): number {
  return comments.reduce((total, comment) => {
    return total + 1 + countNestedComments(comment.replies);
  }, 0);
}

function toggleCommentLike(comments: CommentNode[], targetId: string): CommentNode[] {
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

function appendReply(
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

function flattenComments(
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

    const nextComments = buildMockComments(postId);
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
