import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDismissActionQueue,
  shouldCountExternalShare,
} from '../src/features/share/application/use-cases/shareCompletion.ts';

test('Android chooser results never count an external share, including cancelled chooser sharedAction', () => {
  assert.equal(shouldCountExternalShare('android', 'sharedAction'), false);
  assert.equal(shouldCountExternalShare('android', 'dismissedAction'), false);
});

test('iOS confirms a share only for sharedAction and preserves cancellation', () => {
  assert.equal(shouldCountExternalShare('ios', 'sharedAction'), true);
  assert.equal(shouldCountExternalShare('ios', 'dismissedAction'), false);
  assert.equal(shouldCountExternalShare('ios', 'unexpected'), false);
  assert.equal(shouldCountExternalShare('web', 'sharedAction'), true);
});

test('a queued share waits for dismissal, blocks double taps, and is consumed only once', async () => {
  const queue = createDismissActionQueue();
  const calls = [];
  assert.equal(queue.enqueue(async () => { calls.push('share'); }), true);
  assert.equal(queue.enqueue(() => { calls.push('double-tap'); }), false);
  assert.deepEqual(calls, []);

  const afterDismiss = queue.take();
  assert.equal(queue.take(), null);
  await afterDismiss();
  assert.deepEqual(calls, ['share']);
});

test('unmount cancels pending actions and each sheet keeps an independent queue', () => {
  const first = createDismissActionQueue();
  const second = createDismissActionQueue();
  const calls = [];
  first.enqueue(() => calls.push('first'));
  second.enqueue(() => calls.push('second'));
  first.clear();
  assert.equal(first.take(), null);
  second.take()();
  assert.deepEqual(calls, ['second']);
  assert.equal(first.enqueue(() => calls.push('reopened')), true);
  first.take()();
  assert.deepEqual(calls, ['second', 'reopened']);
});
