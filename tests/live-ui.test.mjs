import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { useLiveUiStore } from '../src/features/live/presentation/store/useLiveUiStore.ts';

beforeEach(() => useLiveUiStore.setState({
  followingByHost: {}, likesByLive: {}, messagesByLive: {},
}));

test('live likes survive revisiting an item without changing another live', () => {
  const { addLikes } = useLiveUiStore.getState();
  addLikes('a', 10, 1);
  addLikes('b', 20, 1);
  addLikes('a', 10, 1);
  assert.deepEqual(useLiveUiStore.getState().likesByLive, { a: 12, b: 21 });
});

test('following belongs to the host, and messages belong to the live', () => {
  const { setFollowing, addMessage } = useLiveUiStore.getState();
  setFollowing('host-a', true);
  setFollowing('host-b', false);
  const message = { id: 'm1', kind: 'message', user: 'Você', text: 'Olá' };
  addMessage('live-a', message);
  const firstMessages = useLiveUiStore.getState().messagesByLive['live-a'];
  addMessage('live-b', { ...message, id: 'm2' });
  assert.strictEqual(useLiveUiStore.getState().messagesByLive['live-a'], firstMessages);
  assert.deepEqual(firstMessages, [message]);
  assert.deepEqual(useLiveUiStore.getState().followingByHost, { 'host-a': true, 'host-b': false });
});
