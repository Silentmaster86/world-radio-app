import { readStorage, writeStorage } from './storage';

export const PLAYER_KEY = 'wra:player:v1';
export const PLAYER_SESSION_MESSAGE =
  'Player settings could not be saved. Changes stay in this session.';

export function loadPlayerPreferences(stations) {
  const defaults = {
    stationId: stations[0]?.id || null,
    volume: 1,
    muted: false,
    canPersist: true,
    message: '',
  };
  const saved = readStorage(
    PLAYER_KEY,
    null,
    (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
  );
  if (saved.status === 'unavailable') return { ...defaults, message: PLAYER_SESSION_MESSAGE };
  if (!saved.exists) return defaults;
  const value = saved.value;
  if (value?.version > 1)
    return {
      ...defaults,
      canPersist: false,
      message: 'Player settings use a newer format. The original data is preserved.',
    };
  if (saved.status !== 'ready' || value.version !== 1)
    return { ...defaults, message: 'Saved player settings could not be read.' };
  return {
    ...defaults,
    stationId: stations.some((station) => station.id === value.stationId)
      ? value.stationId
      : defaults.stationId,
    volume: Number.isFinite(value.volume) ? Math.min(1, Math.max(0, value.volume)) : 1,
    muted: value.muted === true,
  };
}

export function savePlayerPreferences({ stationId, volume, muted }) {
  if (
    typeof stationId !== 'string' ||
    !stationId ||
    !Number.isFinite(volume) ||
    typeof muted !== 'boolean'
  )
    return false;
  return writeStorage(PLAYER_KEY, {
    version: 1,
    stationId,
    volume: Math.min(1, Math.max(0, volume)),
    muted,
  });
}
