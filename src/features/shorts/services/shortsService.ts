import type { Short } from '@/types/social';

export const FOR_YOU: Short[] = [
  {
    id: 'fy1',
    user: { id: 'u1', name: 'Lua', avatar: 'https://i.pravatar.cc/150?img=2', following: false },
    caption: 'Novo mapa neon 🎮✨ #kachan',
    music: 'Beat Cyber - DJ K',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-neon-arcade-5723/1080p.mp4',
    likes: 1280,
    comments: 144,
    shares: 40,
  },
  {
    id: 'fy2',
    user: { id: 'u2', name: 'Kai', avatar: 'https://i.pravatar.cc/150?img=3', following: false },
    caption: 'Speed run hoje às 20h! ⏱️',
    music: 'Hyper Pulse - Kai',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-synthwave-street-2186/1080p.mp4',
    likes: 930,
    comments: 88,
    shares: 22,
  },
];

export const FOLLOWING: Short[] = [
  {
    id: 'fo1',
    user: { id: 'u4', name: 'Mina', avatar: 'https://i.pravatar.cc/150?img=4', following: true },
    caption: 'Build novo com shaders 💡',
    music: 'Dream Lights - Mina',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-digital-billboards-4800/1080p.mp4',
    likes: 2200,
    comments: 320,
    shares: 120,
  },
];

export const getShortsData = () => ({ forYou: FOR_YOU, following: FOLLOWING });
