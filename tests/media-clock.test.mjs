import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryClock } from '../src/features/stories/presentation/playback/storyClock.ts';

function fixture(duration = 5000) {
  let now = 0;
  let nextId = 0;
  let completed = 0;
  const tasks = new Map();
  const snapshots = [];
  const clock = createStoryClock(duration, (snapshot) => snapshots.push(snapshot), () => completed++, {
    now: () => now,
    schedule: (callback, delay) => { const id = nextId++; tasks.set(id, { callback, at: now + delay }); return id; },
    cancel: (id) => tasks.delete(id),
  });
  return {
    clock, tasks, snapshots,
    get completed() { return completed; },
    advance(ms) {
      const target = now + ms;
      for (;;) {
        const next = [...tasks].filter(([, task]) => task.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        tasks.delete(next[0]); now = next[1].at; next[1].callback();
      }
      now = target;
    },
  };
}

test('image only starts its five seconds after loading', () => {
  const f = fixture(); f.clock.setPaused(false); f.advance(20000);
  assert.equal(f.completed, 0); assert.equal(f.tasks.size, 0);
  f.clock.setReady(true); f.advance(4999); assert.equal(f.completed, 0);
  f.advance(1); assert.equal(f.completed, 1);
});

test('pause preserves remaining time across foreground, sheets and gestures', () => {
  const f = fixture(); f.clock.setReady(true); f.clock.setPaused(false); f.advance(3000);
  f.clock.setPaused(true); assert.equal(f.snapshots.at(-1).remainingMs, 2000);
  f.advance(10000); assert.equal(f.completed, 0);
  f.clock.setPaused(false); f.advance(1000); f.clock.setPaused(true); f.advance(10000);
  f.clock.setPaused(false); f.advance(999); assert.equal(f.completed, 0);
  f.advance(1); assert.equal(f.completed, 1);
});

test('duplicate readiness or pause values do not restart a running story', () => {
  const f = fixture(); f.clock.setPaused(false); f.clock.setReady(true); f.advance(3000);
  f.clock.setReady(true); f.clock.setPaused(false); f.advance(2000);
  assert.equal(f.completed, 1); f.clock.setPaused(true); f.clock.setPaused(false); f.advance(10000);
  assert.equal(f.completed, 1);
});

test('failed media stops advancement; retry gets a fresh clock', () => {
  const f = fixture(); f.clock.setPaused(false); f.clock.setReady(true); f.advance(2000);
  f.clock.setReady(false); f.advance(20000); assert.equal(f.completed, 0); assert.equal(f.tasks.size, 0);
  f.clock.dispose(); const retry = fixture(); retry.clock.setPaused(false); retry.clock.setReady(true);
  retry.advance(5000); assert.equal(retry.completed, 1);
});

test('callbacks from a cancelled or disposed media identity cannot advance', () => {
  const f = fixture(); f.clock.setPaused(false); f.clock.setReady(true);
  const oldCallback = [...f.tasks.values()][0].callback;
  f.clock.setPaused(true); oldCallback(); assert.equal(f.completed, 0);
  f.clock.setPaused(false); f.clock.dispose(); oldCallback(); f.advance(20000);
  assert.equal(f.completed, 0); assert.equal(f.tasks.size, 0);
});

test('invalid durations use five seconds; a valid custom duration is respected', () => {
  for (const value of [undefined, -1, 0, NaN, Infinity]) {
    const f = fixture(value); f.clock.setReady(true); f.clock.setPaused(false); f.advance(4999);
    assert.equal(f.completed, 0); f.advance(1); assert.equal(f.completed, 1);
  }
  const f = fixture(1200); f.clock.setReady(true); f.clock.setPaused(false); f.advance(1200);
  assert.equal(f.completed, 1);
});
