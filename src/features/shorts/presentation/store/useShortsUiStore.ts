import { create } from 'zustand';

type ShortInteraction = { liked: boolean; paused: boolean };
export const DEFAULT_SHORT_INTERACTION: Readonly<ShortInteraction> = { liked: false, paused: false };

type ShortsUiStore = {
  interactions: Record<string, ShortInteraction>;
  followingByAuthor: Record<string, boolean>;
  updateInteraction: (id: string, update: (current: ShortInteraction) => Partial<ShortInteraction>) => void;
  toggleFollowing: (authorId: string, initial: boolean) => void;
};

export const useShortsUiStore = create<ShortsUiStore>((set) => ({
  interactions: {},
  followingByAuthor: {},
  updateInteraction: (id, update) => set((state) => {
    const current = state.interactions[id] ?? DEFAULT_SHORT_INTERACTION;
    return { interactions: { ...state.interactions, [id]: { ...current, ...update(current) } } };
  }),
  toggleFollowing: (authorId, initial) => set((state) => ({
    followingByAuthor: {
      ...state.followingByAuthor,
      [authorId]: !(state.followingByAuthor[authorId] ?? initial),
    },
  })),
}));
