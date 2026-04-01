import type { Post } from '@/features/feed/domain/entities/post';
import type { FeedRepository } from '@/features/feed/domain/repositories/feedRepository';
import { DEMO_VIDEO_URLS } from '@/shared/constants/demoMedia';

export const POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u_luna',
    type: 'image',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    isSuggested: true,
    isFollowingAuthor: false,
    image:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=80&auto=format&fit=crop',
    text: 'Explorando um novo mapa hoje! #kachan',
    timeLabel: 'agora',
    likes: 128,
    comments: 14,
    reposts: 8,
    shares: 5,
  },
  {
    id: 'p2',
    authorId: 'u_kai',
    type: 'video-vertical',
    user: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    isSuggested: true,
    isFollowingAuthor: false,
    video: DEMO_VIDEO_URLS.verticalFeed,
    thumbnail:
      'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop',
    text: 'Treino rapido de hoje no competitivo!',
    hashtags: ['#kachan', '#ranked'],
    timeLabel: 'ha 3 min',
    likes: 245,
    comments: 30,
    reposts: 11,
    shares: 7,
  },
  {
    id: 'p3',
    authorId: 'u_mina',
    type: 'image',
    user: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
    isSuggested: false,
    isFollowingAuthor: true,
    image:
      'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1600&q=80&auto=format&fit=crop',
    text: 'Setup novo pronto para a proxima live',
    timeLabel: 'ha 12 min',
    likes: 319,
    comments: 58,
    reposts: 16,
    shares: 10,
  },
  {
    id: 'p4',
    authorId: 'u_noah',
    type: 'video-horizontal',
    user: 'Noah',
    avatar: 'https://i.pravatar.cc/150?img=5',
    isSuggested: false,
    isFollowingAuthor: true,
    video: DEMO_VIDEO_URLS.horizontalFeed,
    thumbnail:
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80&auto=format&fit=crop',
    text: 'Highlights da scrim de ontem.',
    hashtags: ['#esports', '#kachan'],
    timeLabel: 'ha 25 min',
    likes: 542,
    comments: 77,
    reposts: 23,
    shares: 18,
  },
  {
    id: 'p5',
    authorId: 'u_luna',
    type: 'image',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    isSuggested: true,
    isFollowingAuthor: false,
    image:
      'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1600&q=80&auto=format&fit=crop',
    text: 'Time fechado para o torneio',
    timeLabel: 'ha 1 h',
    likes: 902,
    comments: 129,
    reposts: 48,
    shares: 32,
  },
];

const mockFeedRepository: FeedRepository = {
  getPosts() {
    return POSTS;
  },
};

export function getFeedRepository() {
  return mockFeedRepository;
}
