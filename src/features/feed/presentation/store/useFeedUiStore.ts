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

export type FeedPostInteraction = {
  liked: boolean;
  reposted: boolean;
  saved: boolean;
  muted: boolean;
  paused: boolean;
};

export const DEFAULT_POST_INTERACTION: Readonly<FeedPostInteraction> = {
  liked: false, reposted: false, saved: false, muted: true, paused: false,
};

export type KzoneInteraction = {
  liked: boolean;
  reposted: boolean;
  replyCount: number;
  shareCount: number;
};

export const DEFAULT_KZONE_INTERACTION: Readonly<KzoneInteraction> = {
  liked: false, reposted: false, replyCount: 0, shareCount: 0,
};

type FeedUiStore = {
  postInteractions: Record<string, FeedPostInteraction>;
  kzoneInteractions: Record<string, KzoneInteraction>;
  updatePostInteraction: (id: string, update: (current: FeedPostInteraction) => Partial<FeedPostInteraction>) => void;
  updateKzoneInteraction: (id: string, update: (current: KzoneInteraction) => Partial<KzoneInteraction>) => void;
  menuData: MenuData;
  commentsPost: Post | null;
  sharePost: Post | null;
  commentCountOverrides: Record<string, number>;
  shareCountOverrides: Record<string, number>;
  followOverridesByAuthor: Record<string, boolean>;
  openComments: (post: Post) => void;
  closeComments: () => void;
  openShare: (post: Post) => void;
  closeShare: () => void;
  openContextMenu: (post: Post, anchor: MenuAnchor) => void;
  closeContextMenu: () => void;
  syncCommentCount: (postId: string, count: number) => void;
  syncShareCount: (postId: string, count: number) => void;
  setAuthorFollowState: (authorId: string, isFollowing: boolean) => void;
};

export const useFeedUiStore = create<FeedUiStore>((set) => ({
  postInteractions: {},
  kzoneInteractions: {},
  updatePostInteraction: (id, update) => set((state) => {
    const current = state.postInteractions[id] ?? DEFAULT_POST_INTERACTION;
    return { postInteractions: { ...state.postInteractions, [id]: { ...current, ...update(current) } } };
  }),
  updateKzoneInteraction: (id, update) => set((state) => {
    const current = state.kzoneInteractions[id] ?? DEFAULT_KZONE_INTERACTION;
    return { kzoneInteractions: { ...state.kzoneInteractions, [id]: { ...current, ...update(current) } } };
  }),
  menuData: null,
  commentsPost: null,
  sharePost: null,
  commentCountOverrides: {},
  shareCountOverrides: {},
  followOverridesByAuthor: {},
  openComments: (post) => set({ commentsPost: post }),
  closeComments: () => set({ commentsPost: null }),
  openShare: (post) => set({ sharePost: post }),
  closeShare: () => set({ sharePost: null }),
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
  syncShareCount: (postId, count) =>
    set((state) => {
      if (state.shareCountOverrides[postId] === count) {
        return state;
      }

      return {
        shareCountOverrides: {
          ...state.shareCountOverrides,
          [postId]: count,
        },
      };
    }),
  setAuthorFollowState: (authorId, isFollowing) =>
    set((state) => {
      if (state.followOverridesByAuthor[authorId] === isFollowing) {
        return state;
      }

      return {
        followOverridesByAuthor: {
          ...state.followOverridesByAuthor,
          [authorId]: isFollowing,
        },
      };
    }),
}));
