import { useMemo, useState } from 'react';
import { CURRENT_USER, getCommentsSeed } from '@/features/comments/services/commentsService';
import type { CommentItem, CommentSticker, StickerCategoryId } from '@/features/comments/types/comments';
import { addReplyToThread, countRepliesDeep, sortChronologically, toggleLikeById } from '@/features/comments/utils/commentsUtils';

export function useComments() {
  const [comments, setComments] = useState<CommentItem[]>(sortChronologically(getCommentsSeed()));
  const [input, setInput] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StickerCategoryId>('recentes');

  const totalComments = useMemo(
    () => comments.length + comments.reduce((acc, item) => acc + countRepliesDeep(item.replies), 0),
    [comments]
  );

  const sendComment = (sticker?: CommentSticker) => {
    const message = input.trim();
    if (!message && !sticker) return;

    const newComment: CommentItem = {
      id: `${Date.now()}`,
      user: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      content: message || (sticker ? `Sticker: ${sticker.label}` : ''),
      createdAt: Date.now(),
      likes: 0,
      replies: [],
      ...(sticker ? { sticker } : {}),
    };

    setComments((prev) => sortChronologically(replyingTo ? addReplyToThread(prev, replyingTo.id, newComment) : [...prev, newComment]));
    setInput('');
    setReplyingTo(null);
  };

  const toggleLike = (id: string) => setComments((prev) => toggleLikeById(prev, id));

  return {
    comments,
    input,
    setInput,
    expandedThreads,
    setExpandedThreads,
    replyingTo,
    setReplyingTo,
    showStickers,
    setShowStickers,
    selectedCategory,
    setSelectedCategory,
    totalComments,
    sendComment,
    toggleLike,
  };
}
