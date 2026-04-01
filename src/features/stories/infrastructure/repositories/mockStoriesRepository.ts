import type { Story } from '@/features/stories/domain/entities/story';
import type { StoriesRepository } from '@/features/stories/domain/repositories/storiesRepository';
import { DEMO_VIDEO_URLS } from '@/shared/constants/demoMedia';

export const STORIES: Story[] = [
  {
    id: '1',
    name: 'Voce',
    avatar: 'https://i.pravatar.cc/150?img=1',
    stories: [
      {
        id: '1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'agora',
      },
      {
        id: '1-2',
        type: 'video',
        uri: DEMO_VIDEO_URLS.verticalFeed,
        thumbnail:
          'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop',
        postedAt: 'agora',
      },
    ],
  },
  {
    id: '2',
    name: 'Lua',
    avatar: 'https://i.pravatar.cc/150?img=2',
    stories: [
      {
        id: '2-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 2h',
      },
      {
        id: '2-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 2h',
      },
    ],
  },
  {
    id: '3',
    name: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    stories: [
      {
        id: '3-1',
        type: 'video',
        uri: DEMO_VIDEO_URLS.horizontalFeed,
        thumbnail:
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 45 min',
      },
      {
        id: '3-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 42 min',
      },
    ],
  },
  {
    id: '4',
    name: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
    stories: [
      {
        id: '4-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 1h',
      },
    ],
  },
];

const mockStoriesRepository: StoriesRepository = {
  getStories() {
    return STORIES;
  },
};

export function getStoriesRepository() {
  return mockStoriesRepository;
}
