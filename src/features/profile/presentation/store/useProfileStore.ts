import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';

export type GamerStatId = 'games' | 'finished' | 'completed' | 'time';
export type SocialLinkId = 'tiktok' | 'youtube' | 'twitch' | 'instagram' | 'x';
export type ProfileMediaKind = 'image' | 'gif';

export type ProfileMediaTransform = {
  zoom: number;
  offsetXRatio: number;
  offsetYRatio: number;
};

export type ProfileMedia = {
  uri: string;
  width: number;
  height: number;
  kind: ProfileMediaKind;
  transform: ProfileMediaTransform;
};

export type ProfileGamerStat = {
  id: GamerStatId;
  label: string;
  value: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
};

export type EditableProfileState = {
  name: string;
  handle: string;
  avatar: ProfileMedia;
  banner: ProfileMedia;
  bio: string;
  socialLinks: Record<SocialLinkId, string>;
  gamerStatOrder: GamerStatId[];
};

type ProfileStore = EditableProfileState & {
  updateProfile: (profile: EditableProfileState) => void;
};

export const PROFILE_GAMER_STATS: Record<GamerStatId, ProfileGamerStat> = {
  games: { id: 'games', label: 'Jogos', value: '210', icon: 'game-controller-outline', color: '#76A9FF' },
  finished: { id: 'finished', label: 'Finalizados', value: '17', icon: 'flag-outline', color: '#B987FF' },
  completed: { id: 'completed', label: 'Completados', value: '11', icon: 'checkmark-outline', color: '#83F2A1' },
  time: { id: 'time', label: 'Tempo', value: '2176h', icon: 'time-outline', color: '#C07BFF' },
};

export const DEFAULT_PROFILE_MEDIA_TRANSFORM: ProfileMediaTransform = {
  zoom: 1,
  offsetXRatio: 0,
  offsetYRatio: 0,
};

export const DEFAULT_PROFILE: EditableProfileState = {
  name: 'Jujutsu Supremacy',
  handle: '@jujutsu_supremacy',
  avatar: {
    uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=500&q=80&auto=format&fit=crop',
    width: 500,
    height: 500,
    kind: 'image',
    transform: { ...DEFAULT_PROFILE_MEDIA_TRANSFORM },
  },
  banner: {
    uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80&auto=format&fit=crop',
    width: 1600,
    height: 900,
    kind: 'image',
    transform: { ...DEFAULT_PROFILE_MEDIA_TRANSFORM },
  },
  bio:
    'Canal gamer de animes, ranked e clipes de boss fight. Lives de sexta, builds testadas e muita zoeira controlada.',
  socialLinks: {
    tiktok: '',
    youtube: '',
    twitch: 'https://www.twitch.tv/jujutsu_supremacy',
    instagram: '',
    x: '',
  },
  gamerStatOrder: ['games', 'finished', 'completed', 'time'],
};

export const useProfileStore = create<ProfileStore>((set) => ({
  ...DEFAULT_PROFILE,
  updateProfile: (profile) => set(profile),
}));
