import { readStorage, writeStorage, removeStorage } from './storage';
import { resolveLegacyStationId } from './stationUtils';

export const FAVORITES_KEY = 'wra:favorites:v1';
export const LEGACY_FAVORITES_KEY = 'favorites';
export const SESSION_ONLY_MESSAGE =
  'Favorites are available for this session only. Changes could not be saved.';
const RECOVERY_MESSAGE = 'Saved favorites could not be read. You can continue listening.';
const PRESERVED_MESSAGE =
  'Some previous favorites could not be matched. Their original data has been kept.';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFavoritesRecord(value) {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.stationIds) &&
    value.stationIds.every((id) => typeof id === 'string' && id.length > 0)
  );
}

// Reading has no write effects: migration runs only after the provider mounts.
export function loadFavorites() {
  const defaults = {
    favoriteIds: [],
    shouldMigrate: false,
    removeLegacyAfterSave: false,
    canPersist: true,
    message: '',
    preservedMessage: '',
  };
  const current = readStorage(FAVORITES_KEY, null, isRecord);

  if (isFavoritesRecord(current.value)) {
    // Keep IDs missing from today's catalog; a temporarily removed station may return.
    return { ...defaults, favoriteIds: [...new Set(current.value.stationIds)] };
  }
  if (current.value?.version > 1) {
    return {
      ...defaults,
      canPersist: false,
      message:
        'Saved favorites use a newer format. The original data is preserved; changes will stay in this session.',
    };
  }

  const legacy = readStorage(LEGACY_FAVORITES_KEY, null, Array.isArray);
  if (legacy.exists && legacy.status === 'ready') {
    const resolved = legacy.value.map(resolveLegacyStationId);
    const hasUnmatched = resolved.some((id) => !id);
    return {
      ...defaults,
      favoriteIds: [...new Set(resolved.filter(Boolean))],
      shouldMigrate: true,
      removeLegacyAfterSave: !hasUnmatched,
      message: hasUnmatched ? PRESERVED_MESSAGE : '',
      preservedMessage: hasUnmatched ? PRESERVED_MESSAGE : '',
    };
  }

  const unavailable = current.status === 'unavailable' || legacy.status === 'unavailable';
  const invalid = current.exists || legacy.exists;
  return {
    ...defaults,
    message: unavailable ? SESSION_ONLY_MESSAGE : invalid ? RECOVERY_MESSAGE : '',
  };
}

export function saveFavorites(favoriteIds, removeLegacyAfterSave = false) {
  const record = { version: 1, stationIds: [...new Set(favoriteIds)] };
  if (!isFavoritesRecord(record) || !writeStorage(FAVORITES_KEY, record)) return false;
  // A failed write must never remove the only copy of the old library.
  if (removeLegacyAfterSave) removeStorage(LEGACY_FAVORITES_KEY);
  return true;
}
