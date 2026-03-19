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
