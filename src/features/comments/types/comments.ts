export type StickerCategoryId = 'recentes' | 'favoritos' | 'packs' | 'animados' | 'estaticos';

export type CommentSticker = {
  label: string;
  uri: string;
  animated?: boolean;
};

export type CommentItem = {
  id: string;
  user: string;
  avatar: string;
  content: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
  replies: CommentItem[];
  sticker?: CommentSticker;
};

export type StickerItem = {
  id: string;
  label: string;
  uri: string;
  category: StickerCategoryId;
  animated?: boolean;
};
