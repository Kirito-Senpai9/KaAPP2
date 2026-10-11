/** Android resolves sharedAction when the chooser opens, not when a share completes. */
export function shouldCountExternalShare(platform: string, action: string): boolean {
  return platform !== 'android' && action === 'sharedAction';
}

type DismissAction = () => void | Promise<void>;

/** A sheet owns one pending action, consumed once its dismissal actually finishes. */
export function createDismissActionQueue() {
  let pending: DismissAction | null = null;
  return {
    enqueue(action: DismissAction) {
      if (pending !== null) return false;
      pending = action;
      return true;
    },
    take() {
      const action = pending;
      pending = null;
      return action;
    },
    clear() {
      pending = null;
    },
  };
}
