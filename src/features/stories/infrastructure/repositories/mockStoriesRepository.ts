import type {
  Story,
  StoryPrivacyLists,
  StoryPrivacyPerson,
  StoryViewerEntry,
} from '@/features/stories/domain/entities/story';
import type { StoriesRepository } from '@/features/stories/domain/repositories/storiesRepository';
import { DEMO_VIDEO_URLS } from '@/shared/constants/demoMedia';

const PRIVACY_DIRECTORY: StoryPrivacyPerson[] = [
  {
    id: '1',
    name: 'Voce',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    name: 'Lua',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    name: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    id: '6',
    name: 'Noah',
    avatar: 'https://i.pravatar.cc/150?img=6',
  },
  {
    id: '7',
    name: 'Ayla',
    avatar: 'https://i.pravatar.cc/150?img=7',
  },
  {
    id: '8',
    name: 'Ethan',
    avatar: 'https://i.pravatar.cc/150?img=8',
  },
];

const STORY_VIEWERS: StoryViewerEntry[] = [
  {
    id: '2',
    name: 'Lua',
    avatar: 'https://i.pravatar.cc/150?img=2',
    viewedAt: 'agora',
  },
  {
    id: '3',
    name: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    viewedAt: '2 min',
  },
  {
    id: '5',
    name: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=5',
    viewedAt: '8 min',
  },
  {
    id: '7',
    name: 'Ayla',
    avatar: 'https://i.pravatar.cc/150?img=7',
    viewedAt: '12 min',
  },
];

const INITIAL_STORIES: Story[] = [
  {
    id: '1',
    name: 'Voce',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isOwnStory: true,
    stories: [
      {
        id: '1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'agora',
        privacyPreset: 'everyone',
        viewers: STORY_VIEWERS,
      },
      {
        id: '1-2',
        type: 'video',
        uri: DEMO_VIDEO_URLS.verticalFeed,
        thumbnail:
          'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop',
        postedAt: 'agora',
        privacyPreset: 'close_friends',
        viewers: [
          STORY_VIEWERS[0],
          STORY_VIEWERS[2],
          {
            id: '8',
            name: 'Ethan',
            avatar: 'https://i.pravatar.cc/150?img=8',
            viewedAt: '15 min',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Lua',
    avatar: 'https://i.pravatar.cc/150?img=2',
    isOwnStory: false,
    stories: [
      {
        id: '2-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 2h',
        privacyPreset: 'everyone',
        viewers: [],
      },
      {
        id: '2-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 2h',
        privacyPreset: 'everyone',
        viewers: [],
      },
    ],
  },
  {
    id: '3',
    name: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isOwnStory: false,
    stories: [
      {
        id: '3-1',
        type: 'video',
        uri: DEMO_VIDEO_URLS.horizontalFeed,
        thumbnail:
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 45 min',
        privacyPreset: 'everyone',
        viewers: [],
      },
      {
        id: '3-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 42 min',
        privacyPreset: 'everyone',
        viewers: [],
      },
    ],
  },
  {
    id: '4',
    name: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
    isOwnStory: false,
    stories: [
      {
        id: '4-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 1h',
        privacyPreset: 'everyone',
        viewers: [],
      },
    ],
  },
];

function cloneStories(stories: Story[]) {
  return stories.map((storyUser) => ({
    ...storyUser,
    stories: storyUser.stories.map((storyItem) => ({
      ...storyItem,
      viewers: storyItem.viewers.map((viewer) => ({ ...viewer })),
      overlays: storyItem.overlays?.map((overlay) => ({ ...overlay })),
    })),
  }));
}

function clonePeople(people: StoryPrivacyPerson[]) {
  return people.map((person) => ({ ...person }));
}

function clonePrivacyLists(lists: StoryPrivacyLists): StoryPrivacyLists {
  return {
    everyoneExceptions: clonePeople(lists.everyoneExceptions),
    contactsExceptions: clonePeople(lists.contactsExceptions),
    closeFriends: clonePeople(lists.closeFriends),
    selectedPeople: clonePeople(lists.selectedPeople),
  };
}

function createDefaultPrivacyLists(ownerId: string): StoryPrivacyLists {
  const selectablePeople = clonePeople(
    PRIVACY_DIRECTORY.filter((person) => person.id !== ownerId)
  );

  return {
    everyoneExceptions: selectablePeople.filter((person) => person.id === '6'),
    contactsExceptions: selectablePeople.filter((person) => person.id === '8'),
    closeFriends: selectablePeople.filter((person) =>
      ['2', '3', '5'].includes(person.id)
    ),
    selectedPeople: selectablePeople.filter((person) =>
      ['4', '7'].includes(person.id)
    ),
  };
}

let storiesStore = cloneStories(INITIAL_STORIES);
const privacyListsStore = new Map<string, StoryPrivacyLists>();

const mockStoriesRepository: StoriesRepository = {
  getStories() {
    return cloneStories(storiesStore);
  },

  saveStories(stories) {
    storiesStore = cloneStories(stories);
  },

  deleteStory(ownerId, storyId) {
    storiesStore = storiesStore
      .map((storyUser) => {
        if (storyUser.id !== ownerId) {
          return storyUser;
        }

        return {
          ...storyUser,
          stories: storyUser.stories.filter((story) => story.id !== storyId),
        };
      })
      .filter((storyUser) => storyUser.stories.length > 0);

    return cloneStories(storiesStore);
  },

  getPrivacyLists(ownerId) {
    const existingLists = privacyListsStore.get(ownerId);

    if (existingLists) {
      return clonePrivacyLists(existingLists);
    }

    const defaultLists = createDefaultPrivacyLists(ownerId);
    privacyListsStore.set(ownerId, clonePrivacyLists(defaultLists));

    return clonePrivacyLists(defaultLists);
  },

  savePrivacyLists(ownerId, lists) {
    privacyListsStore.set(ownerId, clonePrivacyLists(lists));
  },

  getPrivacyDirectory(ownerId) {
    return clonePeople(
      PRIVACY_DIRECTORY.filter((person) => person.id !== ownerId)
    );
  },
};

export function getStoriesRepository() {
  return mockStoriesRepository;
}
