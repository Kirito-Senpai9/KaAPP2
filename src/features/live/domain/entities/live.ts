export type LiveHost = {
  id: string;
  name: string;
  avatar: string;
  following?: boolean;
  likes: number;
};

export type LiveViewer = {
  id: string;
  avatar: string;
  rank?: number;
};

export type LiveChatItem =
  | {
      id: string;
      kind: 'message';
      user: string;
      avatar?: string;
      text: string;
      badge?: string;
      level?: number;
    }
  | { id: string; kind: 'join'; user: string }
  | { id: string; kind: 'leave'; user: string }
  | { id: string; kind: 'like'; user: string }
  | { id: string; kind: 'system'; text: string; icon?: string };

export type LiveStream = {
  id: string;
  host: LiveHost;
  title: string;
  category?: string;
  videoUrl: string;
  viewers: number;
  topViewers: LiveViewer[];
  chat: LiveChatItem[];
};
