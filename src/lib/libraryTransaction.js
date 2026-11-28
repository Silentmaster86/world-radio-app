// One origin-wide queue covers favorites, stations and multi-key backup imports.
// Without Web Locks, synchronous read/modify/write still merges sequential edits;
// simultaneous writes in older browsers remain best-effort and are documented.
export function libraryTransaction(work) {
  if (typeof navigator !== 'undefined' && navigator.locks?.request)
    return navigator.locks.request('wra:library:v1', work).catch(() => false);
  return work();
}
export function afterLibraryAction(result, apply) {
  return result?.then ? result.then(apply) : apply(result);
}
