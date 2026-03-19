import type { Story } from '@/features/stories/domain/entities/story';
import type { StoriesRepository } from '@/features/stories/domain/repositories/storiesRepository';

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
        overlays: [{ id: 'ov-1', type: 'text', content: 'Partiu ranked' }],
      },
      {
        id: '1-2',
        type: 'video',
        uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
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
        overlays: [{ id: 'ov-2', type: 'emoji', content: 'Fogo' }],
      },
      {
        id: '2-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 2h',
        overlays: [{ id: 'ov-3', type: 'text', content: 'Time fechado para o torneio' }],
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
        uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        postedAt: 'ha 45 min',
      },
      {
        id: '3-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'ha 42 min',
        overlays: [{ id: 'ov-4', type: 'music', content: 'Lo-fi KaAPP Mix' }],
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
