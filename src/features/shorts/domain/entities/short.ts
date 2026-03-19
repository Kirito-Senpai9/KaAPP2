export type ShortUser = {
  id: string;
  name: string;
  avatar: string;
  following?: boolean;
};

export type Short = {
  id: string;
  user: ShortUser;
  caption: string;
  music: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
};
