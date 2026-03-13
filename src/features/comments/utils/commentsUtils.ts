import type { CommentItem } from '@/features/comments/types/comments';

export const sortChronologically = (items: CommentItem[]): CommentItem[] =>
  [...items]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((item) => ({ ...item, replies: sortChronologically(item.replies) }));

export const addReplyToThread = (items: CommentItem[], parentId: string, reply: CommentItem): CommentItem[] =>
  items.map((item) => {
    if (item.id === parentId) {
      return { ...item, replies: sortChronologically([...item.replies, reply]) };
    }

    return {
      ...item,
      replies: addReplyToThread(item.replies, parentId, reply),
    };
  });

export const toggleLikeById = (items: CommentItem[], id: string): CommentItem[] =>
  items.map((item) => {
    if (item.id === id) {
      const liked = !item.liked;
      return {
        ...item,
        liked,
        likes: liked ? item.likes + 1 : Math.max(0, item.likes - 1),
      };
    }

    return { ...item, replies: toggleLikeById(item.replies, id) };
  });

export const countRepliesDeep = (items: CommentItem[]): number =>
  items.reduce((total, item) => total + 1 + countRepliesDeep(item.replies), 0);

export const timeAgo = (createdAt: number) => {
  const minutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
};
