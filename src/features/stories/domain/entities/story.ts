export type StoryMediaType = 'image' | 'video';

export type StoryPrivacyPreset =
  | 'everyone'
  | 'contacts'
  | 'close_friends'
  | 'selected_people';

export type StoryPrivacyPerson = {
  id: string;
  name: string;
  avatar: string;
};

export type StoryPrivacyLists = {
  everyoneExceptions: StoryPrivacyPerson[];
  contactsExceptions: StoryPrivacyPerson[];
  closeFriends: StoryPrivacyPerson[];
  selectedPeople: StoryPrivacyPerson[];
};

export type StoryViewerEntry = {
  id: string;
  name: string;
  avatar: string;
  viewedAt: string;
};

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
  privacyPreset: StoryPrivacyPreset;
  viewers: StoryViewerEntry[];
  durationMs?: number;
  overlays?: StoryOverlay[];
};

export type Story = {
  id: string;
  name: string;
  avatar: string;
  isOwnStory: boolean;
  stories: StoryMediaItem[];
};
