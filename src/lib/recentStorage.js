import { readStorage, writeStorage } from './storage';

export const RECENT_KEY = 'wra:recent:v1';
export const RECENT_LIMIT = 20;
export const RECENT_SESSION_MESSAGE =
  'Listening history is available for this session only. Changes could not be saved.';

export function normalizeRecentIds(ids) {
  const result = [];
  const seen = new Set();
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id !== 'string' || id.length > 128 || !/^[a-z0-9-]+$/.test(id) || seen.has(id))
      continue;
    seen.add(id);
    result.push(id);
    if (result.length === RECENT_LIMIT) break;
  }
  return result;
}

export function prependRecent(ids, id) {
  return normalizeRecentIds([id, ...ids]);
}

export function loadRecent() {
  const defaults = { recentIds: [], canPersist: true, message: '' };
  const saved = readStorage(
    RECENT_KEY,
    null,
    (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
  );
  if (saved.status === 'unavailable') return { ...defaults, message: RECENT_SESSION_MESSAGE };
  if (!saved.exists) return defaults;
  if (saved.value?.version > 1)
    return {
      ...defaults,
      canPersist: false,
      message:
        'Listening history uses a newer format. Original data is preserved; changes stay in this session.',
    };
  if (
    saved.status !== 'ready' ||
    saved.value.version !== 1 ||
    !Array.isArray(saved.value.stationIds)
  ) {
    return { ...defaults, message: 'Saved listening history could not be read.' };
  }
  // Keep valid IDs absent from today's catalog in case those stations return.
  return { ...defaults, recentIds: normalizeRecentIds(saved.value.stationIds) };
}

export function saveRecent(ids) {
  if (!Array.isArray(ids)) return false;
  return writeStorage(RECENT_KEY, { version: 1, stationIds: normalizeRecentIds(ids) });
}
