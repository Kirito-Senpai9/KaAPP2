import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  Story,
  StoryMediaItem,
  StoryMediaType,
  StoryOverlay,
} from '@/features/stories/domain/entities/story';

export type StoryUser = Story;
export type StoryMediaItemType = StoryMediaItem;
export type StoryMediaTypeName = StoryMediaType;
export type StoryOverlayItem = StoryOverlay;

export type StoryViewerParams = {
  users: Story[];
  initialUserIndex: number;
  initialStoryIndex: number;
};

export type RootStackParamList = {
  TelaLogin: undefined;
  RootTabs: undefined;
  StoryViewer: StoryViewerParams;
  CriarStories: undefined;
  CriarPostagem: undefined;
  CriarShorts: undefined;
  LiveSetup: undefined;
};

export type KachanTabParamList = {
  Home: undefined;
  Shorts: undefined;
  Criar: undefined;
  Comunidade: undefined;
  Perfil: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type KachanTabScreenProps<T extends keyof KachanTabParamList> =
  BottomTabScreenProps<KachanTabParamList, T>;
