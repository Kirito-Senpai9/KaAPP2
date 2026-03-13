import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PostPreview } from '@/types/social';

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

export type StoryUser = {
  id: string;
  name: string;
  avatar: string;
  stories: StoryMediaItem[];
};

export type StoryViewerParams = {
  users: StoryUser[];
  initialUserIndex: number;
  initialStoryIndex: number;
};

export type RootStackParamList = {
  TelaLogin: undefined;
  RootTabs: undefined;
  ComentariosPostagem: { post: PostPreview };
  StoryViewer: StoryViewerParams;
  CriarStories: undefined;
  CriarPostagem: undefined;
  CriarShorts: undefined;
  LiveSetup: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
