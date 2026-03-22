import { create } from 'zustand';
import type { Post } from '@/features/feed/domain/entities/post';

export type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MenuData = {
  post: Post;
  anchor: MenuAnchor;
} | null;

type FeedUiStore = {
  menuData: MenuData;
  commentsPost: Post | null;
  commentCountOverrides: Record<string, number>;
  openComments: (post: Post) => void;
  closeComments: () => void;
  openContextMenu: (post: Post, anchor: MenuAnchor) => void;
  closeContextMenu: () => void;
  syncCommentCount: (postId: string, count: number) => void;
};

export const useFeedUiStore = create<FeedUiStore>((set) => ({
  menuData: null,
  commentsPost: null,
  commentCountOverrides: {},
  openComments: (post) => set({ commentsPost: post }),
  closeComments: () => set({ commentsPost: null }),
  openContextMenu: (post, anchor) => set({ menuData: { post, anchor } }),
  closeContextMenu: () => set({ menuData: null }),
  syncCommentCount: (postId, count) =>
    set((state) => {
      if (state.commentCountOverrides[postId] === count) {
        return state;
      }

      return {
        commentCountOverrides: {
          ...state.commentCountOverrides,
          [postId]: count,
        },
      };
    }),
}));
