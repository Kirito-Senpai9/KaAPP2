export type StoryClockSnapshot = {
  durationMs: number;
  remainingMs: number;
  running: boolean;
  completed: boolean;
};

type Scheduler = {
  now: () => number;
  schedule: (callback: () => void, delayMs: number) => unknown;
  cancel: (handle: unknown) => void;
};

const defaultScheduler: Scheduler = {
  now: () => performance.now(),
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** A single clock counts only loaded, unpaused viewing time. No per-frame JS work. */
export function createStoryClock(
  requestedDuration: number | undefined,
  onUpdate: (snapshot: StoryClockSnapshot) => void,
  onComplete: () => void,
  scheduler: Scheduler = defaultScheduler,
) {
  const durationMs = Number.isFinite(requestedDuration) && (requestedDuration ?? 0) > 0
    ? requestedDuration! : 5000;
  let remainingMs = durationMs;
  let ready = false;
  let paused = true;
  let running = false;
  let completed = false;
  let disposed = false;
  let startedAt = 0;
  let handle: unknown;
  let generation = 0;

  const stop = () => {
    generation += 1;
    if (handle !== undefined) scheduler.cancel(handle);
    handle = undefined;
    if (running) remainingMs = Math.max(0, remainingMs - Math.max(0, scheduler.now() - startedAt));
    running = false;
  };
  const reconcile = () => {
    if (disposed) return;
    stop();
    const canRun = ready && !paused && !completed;
    if (canRun && remainingMs > 0) {
      running = true;
      startedAt = scheduler.now();
      const currentGeneration = generation;
      handle = scheduler.schedule(() => {
        if (!disposed && currentGeneration === generation) reconcile();
      }, remainingMs);
    }
    const didComplete = canRun && remainingMs <= 0;
    if (didComplete) completed = true;
    onUpdate({ durationMs, remainingMs, running, completed });
    if (didComplete) onComplete();
  };
  return {
    setReady(value: boolean) {
      if (ready === value || disposed) return;
      ready = value;
      reconcile();
    },
    setPaused(value: boolean) {
      if (paused === value || disposed) return;
      paused = value;
      reconcile();
    },
    dispose() {
      stop();
      disposed = true;
    },
  };
}
