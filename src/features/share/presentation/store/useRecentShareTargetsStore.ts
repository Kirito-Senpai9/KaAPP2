import { create } from 'zustand';

const MAX_RECENT = 12;

type RecentShareTargetsStore = {
  recentIds: string[];
  markShared: (ids: string[]) => void;
};

export const useRecentShareTargetsStore = create<RecentShareTargetsStore>(
  (set) => ({
    recentIds: [],
    markShared: (ids) =>
      set((state) => {
        if (ids.length === 0) {
          return state;
        }

        const promoted = [...ids].reverse();
        const merged = [
          ...promoted,
          ...state.recentIds.filter((existingId) => !ids.includes(existingId)),
        ];

        return { recentIds: merged.slice(0, MAX_RECENT) };
      }),
  })
);
