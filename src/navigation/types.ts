import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type StoryUser = {
  name: string;
  avatar: string;
};

export type RootStackParamList = {
  TelaLogin: undefined;
  RootTabs: undefined;
  ComentariosPostagem: {
    post: {
      id: string;
      user: string;
      avatar: string;
      text: string;
      type: 'image' | 'video-vertical' | 'video-horizontal';
    };
  };
  StoryViewer: { user: StoryUser };
  CriarStories: undefined;
  CriarPostagem: undefined;
  CriarShorts: undefined;
  LiveSetup: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
