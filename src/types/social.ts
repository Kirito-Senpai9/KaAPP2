export type PostMediaType = 'image' | 'video-vertical' | 'video-horizontal';

export type User = {
  id: string;
  name: string;
  avatar: string;
  following?: boolean;
};

export type Post = {
  id: string;
  type: PostMediaType;
  user: string;
  avatar: string;
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

export type PostPreview = Pick<Post, 'id' | 'user' | 'avatar' | 'text'>;

export type StoryMediaType = 'image' | 'video';

export type StoryOverlay = {
  id: string;
  type: 'text' | 'emoji' | 'sticker' | 'music';
  content: string;
};

export type StoryMediaItem = {
  id: string;
  type: StoryMediaType;
  uri: string;
  thumbnail?: string;
  postedAt: string;
  durationMs?: number;
  overlays?: StoryOverlay[];
};

export type Story = {
  id: string;
  name: string;
  avatar: string;
  stories: StoryMediaItem[];
};

export type Short = {
  id: string;
  user: User;
  caption: string;
  music: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
};

export type Comment = {
  id: string;
  user: string;
  avatar: string;
  content: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
  replies: Comment[];
  sticker?: {
    label: string;
    uri: string;
    animated?: boolean;
  };
};
