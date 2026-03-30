import type { ShareTarget } from '@/features/share/domain/entities/share';
import type { ShareTargetsRepository } from '@/features/share/domain/repositories/shareTargetsRepository';

const SHARE_TARGETS: ShareTarget[] = [
  {
    id: 'user-you',
    type: 'user',
    name: 'Voce',
    avatar: 'https://i.pravatar.cc/150?img=15',
    subtitle: 'Seu perfil',
  },
  {
    id: 'user-luna',
    type: 'user',
    name: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    subtitle: 'Kacha! do feed',
  },
  {
    id: 'user-kai',
    type: 'user',
    name: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    subtitle: 'Kacha! do feed',
  },
  {
    id: 'user-mina',
    type: 'user',
    name: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
    subtitle: 'Kacha! do feed',
  },
  {
    id: 'user-noah',
    type: 'user',
    name: 'Noah',
    avatar: 'https://i.pravatar.cc/150?img=5',
    subtitle: 'Kacha! do feed',
  },
  {
    id: 'user-ayla',
    type: 'user',
    name: 'Ayla',
    avatar: 'https://i.pravatar.cc/150?img=6',
    subtitle: 'Kacha! online',
  },
  {
    id: 'user-ethan',
    type: 'user',
    name: 'Ethan',
    avatar: 'https://i.pravatar.cc/150?img=12',
    subtitle: 'Kacha! online',
  },
  {
    id: 'user-lia',
    type: 'user',
    name: 'Lia',
    avatar: 'https://i.pravatar.cc/150?img=8',
    subtitle: 'Kacha! amiga',
  },
  {
    id: 'community-squad',
    type: 'community',
    name: 'Squad Ranked',
    avatar:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80&auto=format&fit=crop',
    subtitle: 'Comunidade KaChan',
  },
  {
    id: 'community-highlights',
    type: 'community',
    name: 'Highlights BR',
    avatar:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80&auto=format&fit=crop',
    subtitle: 'Comunidade KaChan',
  },
  {
    id: 'community-live',
    type: 'community',
    name: 'Clipes da Live',
    avatar:
      'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80&auto=format&fit=crop',
    subtitle: 'Comunidade KaChan',
  },
  {
    id: 'community-arena',
    type: 'community',
    name: 'Arena KaChan',
    avatar:
      'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&q=80&auto=format&fit=crop',
    subtitle: 'Comunidade KaChan',
  },
];

const mockShareTargetsRepository: ShareTargetsRepository = {
  getShareTargets() {
    return SHARE_TARGETS;
  },
};

export function getShareTargetsRepository() {
  return mockShareTargetsRepository;
}
