import type { CommentItem, StickerCategoryId, StickerItem } from '@/features/comments/types/comments';

export const CURRENT_USER = {
  name: 'Você',
  avatar: 'https://i.pravatar.cc/150?img=11',
};

export const STICKER_CATEGORIES: { id: StickerCategoryId; label: string }[] = [
  { id: 'recentes', label: 'Recentes' },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'packs', label: 'Packs' },
  { id: 'animados', label: 'Animados' },
  { id: 'estaticos', label: 'Estáticos' },
];

export const STICKERS: StickerItem[] = [
  { id: 's1', label: 'KaAPP Glow', uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWhxczB5d2x6dDR0YW53Z29hamU2ejI5cjRheDFqaW9iM2x0MjNqaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUPGcvDelgloOjwuFG/giphy.gif', category: 'animados', animated: true },
  { id: 's2', label: 'GG', uri: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=220&q=80', category: 'estaticos' },
  { id: 's3', label: 'KaAPP Heart', uri: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&w=220&q=80', category: 'favoritos' },
  { id: 's4', label: 'Party', uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHp2N2V4N3c1enA3a21jOG44M2RhZnRhaW9ya2VjaW9mdzNlOWo3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YnBntKOgnUSBkV7bQH/giphy.gif', category: 'recentes', animated: true },
  { id: 's5', label: 'Foco', uri: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=220&q=80', category: 'packs' },
  { id: 's6', label: 'KaAPP Fire', uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3BydDZ6eXQ2Y2FyZ2N6dzVwaG81M2J0d2RmcjNlNDhtOWR5NGQ0dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5VKbvrjxpVJCM/giphy.gif', category: 'animados', animated: true },
  { id: 's7', label: 'Vibe', uri: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=220&q=80', category: 'recentes' },
  { id: 's8', label: 'Ranked', uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=220&q=80', category: 'packs' },
];

export const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'c1', user: 'Ayla', avatar: 'https://i.pravatar.cc/150?img=17', content: 'FPS estava travando no início, mas depois ficou liso!', createdAt: Date.now() - 1000 * 60 * 42, likes: 112,
    replies: [
      { id: 'c1-r1', user: 'Kai', avatar: 'https://i.pravatar.cc/150?img=3', content: 'Esse patch ajudou demais no desempenho.', createdAt: Date.now() - 1000 * 60 * 33, likes: 28, replies: [] },
      { id: 'c1-r2', user: 'Mia', avatar: 'https://i.pravatar.cc/150?img=19', content: 'Aqui também melhorou muito depois do update!', createdAt: Date.now() - 1000 * 60 * 29, likes: 9, replies: [] },
    ],
  },
  { id: 'c2', user: 'Noah', avatar: 'https://i.pravatar.cc/150?img=5', content: 'Partiu mais uma ranked hoje à noite?', createdAt: Date.now() - 1000 * 60 * 24, likes: 63, replies: [] },
  { id: 'c3', user: 'Luna', avatar: 'https://i.pravatar.cc/150?img=2', content: 'Não estou arrumando desculpas 😅', createdAt: Date.now() - 1000 * 60 * 15, likes: 48, replies: [] },
];

export const getCommentsSeed = () => INITIAL_COMMENTS;
