import type { LiveStream } from '@/features/live/domain/entities/live';
import type { LiveRepository } from '@/features/live/domain/repositories/liveRepository';
import { DEMO_VIDEO_URLS } from '@/shared/constants/demoMedia';

const LIVES: LiveStream[] = [
  {
    id: 'lv1',
    host: {
      id: 'u1',
      name: 'Lua',
      avatar: 'https://i.pravatar.cc/150?img=2',
      following: false,
      likes: 1800,
    },
    title: 'Mapa neon ao vivo • chega junto!',
    category: 'Gameplay',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-neon-arcade-5723/1080p.mp4',
    viewers: 1240,
    topViewers: [
      { id: 'v1', avatar: 'https://i.pravatar.cc/150?img=12', rank: 1 },
      { id: 'v2', avatar: 'https://i.pravatar.cc/150?img=15', rank: 2 },
      { id: 'v3', avatar: 'https://i.pravatar.cc/150?img=8', rank: 3 },
    ],
    chat: [
      { id: 'c1', kind: 'message', user: 'Mendes', avatar: 'https://i.pravatar.cc/150?img=11', text: 'acertando todas as ults possíveis 🔥', badge: 'Nº 2' },
      { id: 'c2', kind: 'message', user: 'Jota', avatar: 'https://i.pravatar.cc/150?img=13', text: 'nem foi pra levar torre kkk', badge: 'Nº 1' },
      { id: 'c3', kind: 'message', user: 'Coral', avatar: 'https://i.pravatar.cc/150?img=5', text: 'oi bom dia gente', level: 3 },
      { id: 'c7', kind: 'message', user: 'Mina', avatar: 'https://i.pravatar.cc/150?img=4', text: 'esse mapa tá lindo demais ✨' },
    ],
  },
  {
    id: 'lv2',
    host: {
      id: 'u2',
      name: 'Kai',
      avatar: 'https://i.pravatar.cc/150?img=3',
      following: false,
      likes: 960,
    },
    title: 'Set ao vivo • Hyper Pulse',
    category: 'Música',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-synthwave-street-2186/1080p.mp4',
    viewers: 860,
    topViewers: [
      { id: 'v4', avatar: 'https://i.pravatar.cc/150?img=20', rank: 1 },
      { id: 'v5', avatar: 'https://i.pravatar.cc/150?img=21', rank: 2 },
    ],
    chat: [
      { id: 'c1', kind: 'message', user: 'Noah', avatar: 'https://i.pravatar.cc/150?img=6', text: 'esse beat tá insano 🎧', level: 5 },
      { id: 'c3', kind: 'message', user: 'Luna', avatar: 'https://i.pravatar.cc/150?img=9', text: 'sobe o volume aí dj' },
      { id: 'c5', kind: 'message', user: 'Kaic', avatar: 'https://i.pravatar.cc/150?img=14', text: 'live da KaChan é outro nível 💜', badge: 'Nº 1' },
    ],
  },
  {
    id: 'lv3',
    host: {
      id: 'u4',
      name: 'Mina',
      avatar: 'https://i.pravatar.cc/150?img=4',
      following: true,
      likes: 2200,
    },
    title: 'Build nova com shaders • dúvidas?',
    category: 'Criativo',
    videoUrl: DEMO_VIDEO_URLS.verticalFeed,
    viewers: 2200,
    topViewers: [
      { id: 'v6', avatar: 'https://i.pravatar.cc/150?img=16', rank: 1 },
      { id: 'v7', avatar: 'https://i.pravatar.cc/150?img=17', rank: 2 },
      { id: 'v8', avatar: 'https://i.pravatar.cc/150?img=18', rank: 3 },
    ],
    chat: [
      { id: 'c1', kind: 'message', user: 'Lua', avatar: 'https://i.pravatar.cc/150?img=2', text: 'que shader é esse?? 😮' },
      { id: 'c4', kind: 'message', user: 'Kai', avatar: 'https://i.pravatar.cc/150?img=3', text: 'manda o tutorial depois', badge: 'Nº 2' },
    ],
  },
];

const mockLiveRepository: LiveRepository = {
  getLives() {
    return LIVES;
  },
};

export function getLiveRepository() {
  return mockLiveRepository;
}
