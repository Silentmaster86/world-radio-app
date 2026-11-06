export const SLEEP_TIMER_MINUTES = [15, 30, 45, 60, 90, 120];

export function createSleepTimer({
  onExpire,
  now = Date.now,
  schedule = setTimeout,
  unschedule = clearTimeout,
}) {
  let deadline = null;
  let timeout = null;
  let disposed = false;
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener(deadline));
  const clearPending = () => {
    if (timeout !== null) unschedule(timeout);
    timeout = null;
  };
  const cancel = () => {
    clearPending();
    if (deadline === null) return;
    deadline = null;
    notify();
  };
  const check = () => {
    if (disposed || deadline === null) return;
    clearPending();
    const remaining = deadline - now();
    if (remaining > 0) timeout = schedule(check, Math.min(remaining, 2_147_483_647));
    else {
      cancel();
      onExpire();
    }
  };
  return {
    getDeadline: () => deadline,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start(minutes) {
      if (disposed || !SLEEP_TIMER_MINUTES.includes(minutes)) return false;
      clearPending();
      deadline = now() + minutes * 60_000;
      notify();
      check();
      return true;
    },
    cancel,
    check,
    dispose() {
      disposed = true;
      clearPending();
      deadline = null;
      listeners.clear();
    },
  };
}
