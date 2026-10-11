import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyShortDuration, loadShortVideo } from '../src/features/shorts/presentation/utils/videoSelection.ts';

function fakePlayer() {
  const listeners = new Map();
  return {
    duration: 0,
    source: null,
    addListener(event, callback) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(callback);
      return { remove: () => listeners.get(event).delete(callback) };
    },
    async replaceAsync(source) { this.source = source; },
    emit(event, payload) {
      for (const callback of [...(listeners.get(event) ?? [])]) callback(payload);
    },
    listenerCount() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}

test('short duration accepts the inclusive 60 second boundary, rejects longer, and treats missing metadata as unknown', () => {
  for (const value of [null, undefined, 0, -1, NaN, Infinity]) assert.equal(classifyShortDuration(value), 'unknown');
  for (const value of [1, 59_999, 60_000]) assert.equal(classifyShortDuration(value), 'valid');
  assert.equal(classifyShortDuration(60_001), 'too-long');
});

test('sourceLoad confirms only the requested URI and converts seconds to milliseconds', async () => {
  const player = fakePlayer();
  const result = loadShortVideo(player, 'file://selected.mp4', new AbortController().signal);
  player.emit('sourceLoad', { videoSource: { uri: 'file://old.mp4' }, duration: 80 });
  assert.equal(player.listenerCount(), 3);
  player.emit('sourceLoad', { videoSource: { uri: 'file://selected.mp4' }, duration: 60 });
  assert.equal(await result, 60_000);
  assert.equal(player.listenerCount(), 0);
  assert.equal(player.source.useCaching, false);
});

test('unknown sourceLoad duration waits for readyToPlay metadata of the current source', async () => {
  const player = fakePlayer();
  const result = loadShortVideo(player, 'https://media.example/short.mp4', new AbortController().signal);
  player.emit('sourceChange', { source: { uri: 'https://media.example/short.mp4' } });
  player.emit('sourceLoad', { videoSource: player.source, duration: -1 });
  player.duration = 25.5;
  player.emit('statusChange', { status: 'readyToPlay' });
  assert.equal(await result, 25_500);
  assert.equal(player.source.useCaching, true);
  assert.equal(player.listenerCount(), 0);
});

test('long native duration rejects and removes all metadata listeners', async () => {
  const player = fakePlayer();
  const result = loadShortVideo(player, 'file://long.mp4', new AbortController().signal);
  player.emit('sourceLoad', { videoSource: player.source, duration: 60.001 });
  await assert.rejects(result, /60 segundos/);
  assert.equal(player.listenerCount(), 0);
});

test('timeout rejects unknown metadata rather than allowing publication', async () => {
  const player = fakePlayer();
  await assert.rejects(loadShortVideo(player, 'file://unknown.mp4', new AbortController().signal, 10), /confirmar a duração/);
  assert.equal(player.listenerCount(), 0);
});

test('unmount cancellation and decoder errors clean up subscriptions', async () => {
  const player = fakePlayer();
  const controller = new AbortController();
  const result = loadShortVideo(player, 'file://video.mp4', controller.signal);
  controller.abort();
  await assert.rejects(result, /cancelada/);
  assert.equal(player.listenerCount(), 0);
  const failure = loadShortVideo(player, 'file://broken.mp4', new AbortController().signal);
  player.emit('statusChange', { status: 'error' });
  await assert.rejects(failure, /abrir esse vídeo/);
  assert.equal(player.listenerCount(), 0);
});

test('synchronous native replacement failures do not leak timers or listeners', async () => {
  const player = fakePlayer();
  player.replaceAsync = () => { throw new Error('native failure'); };
  await assert.rejects(loadShortVideo(player, 'file://video.mp4', new AbortController().signal), /abrir esse vídeo/);
  assert.equal(player.listenerCount(), 0);
});
