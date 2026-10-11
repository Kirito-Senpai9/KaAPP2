import { create } from 'zustand';
import type { LiveChatItem } from '@/features/live/domain/entities/live';

type LiveUiState = {
  followingByHost: Record<string, boolean>;
  likesByLive: Record<string, number>;
  messagesByLive: Record<string, LiveChatItem[]>;
  setFollowing: (hostId: string, value: boolean) => void;
  addLikes: (liveId: string, initial: number, amount: number) => void;
  addMessage: (liveId: string, message: LiveChatItem) => void;
};

export const useLiveUiStore = create<LiveUiState>((set) => ({
  followingByHost: {},
  likesByLive: {},
  messagesByLive: {},
  setFollowing: (hostId, value) => set((state) => ({
    followingByHost: { ...state.followingByHost, [hostId]: value },
  })),
  addLikes: (liveId, initial, amount) => set((state) => ({
    likesByLive: {
      ...state.likesByLive,
      [liveId]: (state.likesByLive[liveId] ?? initial) + amount,
    },
  })),
  addMessage: (liveId, message) => set((state) => ({
    messagesByLive: {
      ...state.messagesByLive,
      [liveId]: [...(state.messagesByLive[liveId] ?? []), message],
    },
  })),
}));
