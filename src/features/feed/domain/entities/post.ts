export type PostMediaType = 'image' | 'video-vertical' | 'video-horizontal';

export type Post = {
  id: string;
  authorId: string;
  type: PostMediaType;
  user: string;
  avatar: string;
  isSuggested: boolean;
  isFollowingAuthor: boolean;
  image?: string;
  video?: string;
  thumbnail?: string;
  text: string;
  hashtags?: string[];
  timeLabel: string;
  likes: number;
  comments: number;
  reposts: number;
  shares: number;
};

export type FeedPostPreview = Pick<Post, 'id' | 'user' | 'avatar' | 'text'>;
