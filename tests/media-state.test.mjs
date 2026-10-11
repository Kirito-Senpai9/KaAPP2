import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFeedUiStore } from '../src/features/feed/presentation/store/useFeedUiStore.ts';
import { useShortsUiStore } from '../src/features/shorts/presentation/store/useShortsUiStore.ts';
import { useStoriesUiStore } from '../src/features/stories/presentation/store/useStoriesUiStore.ts';

beforeEach(() => {
  useFeedUiStore.setState({ postInteractions: {}, kzoneInteractions: {} });
  useShortsUiStore.setState({ interactions: {}, followingByAuthor: {} });
  useStoriesUiStore.setState({ likedById: {} });
});

test('feed actions and manual playback choices stay attached to the post after recycling', () => {
  const { updatePostInteraction } = useFeedUiStore.getState();
  updatePostInteraction('a', () => ({ liked: true, saved: true, muted: false, paused: true }));
  updatePostInteraction('b', () => ({ reposted: true }));
  const { postInteractions: state } = useFeedUiStore.getState();
  assert.deepEqual(state.a, { liked: true, reposted: false, saved: true, muted: false, paused: true });
  assert.deepEqual(state.b, { liked: false, reposted: true, saved: false, muted: true, paused: false });
});

test('short actions survive filter changes and following is keyed by author', () => {
  const { updateInteraction, toggleFollowing } = useShortsUiStore.getState();
  updateInteraction('a', () => ({ liked: true, paused: true }));
  updateInteraction('b', () => ({ liked: false }));
  toggleFollowing('author', false); assert.equal(useShortsUiStore.getState().followingByAuthor.author, true);
  toggleFollowing('author', false); assert.equal(useShortsUiStore.getState().followingByAuthor.author, false);
  assert.deepEqual(useShortsUiStore.getState().interactions.a, { liked: true, paused: true });
  assert.deepEqual(useShortsUiStore.getState().interactions.b, { liked: false, paused: false });
});

test('rapid updates use the latest stored value, and Kzone remains separate from feed', () => {
  const { updateKzoneInteraction, updatePostInteraction } = useFeedUiStore.getState();
  for (let i = 0; i < 5; i++) updateKzoneInteraction('a', (current) => ({ shareCount: current.shareCount + 1 }));
  updatePostInteraction('a', () => ({ liked: true }));
  assert.equal(useFeedUiStore.getState().kzoneInteractions.a.shareCount, 5);
  assert.equal(useFeedUiStore.getState().kzoneInteractions.a.liked, false);
});

test('story likes remain attached to their story across viewer visits and can be removed on deletion', () => {
  const { setLiked, removeStory } = useStoriesUiStore.getState();
  setLiked('a', true); setLiked('b', true); setLiked('b', false);
  assert.equal(useStoriesUiStore.getState().likedById.a, true);
  assert.equal(useStoriesUiStore.getState().likedById.b, false);
  removeStory('b'); assert.equal('b' in useStoriesUiStore.getState().likedById, false);
  assert.equal(useStoriesUiStore.getState().likedById.a, true);
});
