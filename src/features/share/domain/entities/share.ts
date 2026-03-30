export type ShareTargetType = 'user' | 'community';

export type ShareTarget = {
  id: string;
  type: ShareTargetType;
  name: string;
  avatar: string;
  subtitle?: string;
};

export type SharePostMediaType = 'image' | 'video';

export type SharePostPreview = {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  mediaUri?: string;
  mediaType?: SharePostMediaType;
  caption?: string;
};

export type ShareTargetSection = {
  key: 'contacts' | 'communities';
  title: string;
  targets: ShareTarget[];
};
