import { create } from 'zustand';

type StoriesUiState = {
  likedById: Record<string, boolean>;
  setLiked: (id: string, liked: boolean) => void;
  removeStory: (id: string) => void;
};

export const useStoriesUiStore = create<StoriesUiState>((set) => ({
  likedById: {},
  setLiked: (id, liked) => set((state) => {
    if ((state.likedById[id] ?? false) === liked) return state;
    return { likedById: { ...state.likedById, [id]: liked } };
  }),
  removeStory: (id) => set((state) => {
    if (!(id in state.likedById)) return state;
    const likedById = { ...state.likedById };
    delete likedById[id];
    return { likedById };
  }),
}));
