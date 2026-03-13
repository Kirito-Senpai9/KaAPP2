import type { Post, Story } from '@/types/social';

export const STORIES: Story[] = [
  {
    id: '1',
    name: 'Você',
    avatar: 'https://i.pravatar.cc/150?img=1',
    stories: [
      {
        id: '1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'agora',
        overlays: [{ id: 'ov-1', type: 'text', content: 'Partiu ranked ✨' }],
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
        postedAt: 'há 2h',
        overlays: [{ id: 'ov-2', type: 'emoji', content: '🔥' }],
      },
      {
        id: '2-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'há 2h',
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
        postedAt: 'há 45 min',
      },
      {
        id: '3-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'há 42 min',
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
        postedAt: 'há 1h',
      },
    ],
  },
];

export const POSTS: Post[] = [
  {
    id: 'p1', type: 'image', user: 'Luna', avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=80&auto=format&fit=crop',
    text: 'Explorando um novo mapa hoje! #kachan', timeLabel: 'agora', likes: 128, comments: 14, reposts: 8, shares: 5,
  },
  {
    id: 'p2', type: 'video-vertical', user: 'Kai', avatar: 'https://i.pravatar.cc/150?img=3',
    video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop',
    text: 'Treino rápido de hoje no competitivo!', hashtags: ['#kachan', '#ranked'], timeLabel: 'há 3 min', likes: 245, comments: 30, reposts: 11, shares: 7,
  },
  {
    id: 'p3', type: 'image', user: 'Mina', avatar: 'https://i.pravatar.cc/150?img=4',
    image: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1600&q=80&auto=format&fit=crop',
    text: 'Setup novo pronto para a próxima live ✨', timeLabel: 'há 12 min', likes: 319, comments: 58, reposts: 16, shares: 10,
  },
  {
    id: 'p4', type: 'video-horizontal', user: 'Noah', avatar: 'https://i.pravatar.cc/150?img=5',
    video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80&auto=format&fit=crop',
    text: 'Highlights da scrim de ontem.', hashtags: ['#esports', '#kachan'], timeLabel: 'há 25 min', likes: 542, comments: 77, reposts: 23, shares: 18,
  },
  {
    id: 'p5', type: 'image', user: 'Luna', avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1600&q=80&auto=format&fit=crop',
    text: 'Time fechado para o torneio 🏆', timeLabel: 'há 1 h', likes: 902, comments: 129, reposts: 48, shares: 32,
  },
];

export const getFeedData = () => ({ posts: POSTS, stories: STORIES });
