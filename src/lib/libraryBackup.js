import {
  ADDED_KEY,
  ADDED_LIMIT,
  normalizeDirectoryStation,
  loadAddedStations,
} from './addedStations';
import { FAVORITES_KEY, loadFavorites } from './favoritesStorage';
import { RECENT_KEY, RECENT_LIMIT, loadRecent } from './recentStorage';
import { PLAYER_KEY } from './playerPreferences';
import { LANGUAGE_KEY, SUPPORTED_LANGUAGES } from '../i18n';

export const BACKUP_LIMIT = 1024 * 1024;
const THEME_KEY = 'wra:theme:v1';
const fail = (code) => {
  throw new Error(code);
};
const record = (value) => value && typeof value === 'object' && !Array.isArray(value);
function ids(values) {
  if (
    !Array.isArray(values) ||
    values.length > 1000 ||
    values.some((id) => typeof id !== 'string' || !/^[a-z0-9-]{1,128}$/.test(id))
  )
    fail('invalid');
  return [...new Set(values)];
}
function station(value) {
  if (
    !record(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 120 ||
    typeof value.url !== 'string' ||
    !Array.isArray(value.languageCodes) ||
    value.languageCodes.length > 5 ||
    value.languageCodes.some((code) => typeof code !== 'string' || !/^[a-z]{2,3}$/.test(code)) ||
    !Array.isArray(value.genres) ||
    value.genres.length > 3 ||
    value.genres.some((genre) => typeof genre !== 'string' || !genre.trim() || genre.length > 32) ||
    typeof value.countryCode !== 'string' ||
    !/^(?:[A-Z]{2})?$/.test(value.countryCode) ||
    (value.streamType !== undefined && value.streamType !== 'hls')
  )
    fail('invalid');
  const normalized = normalizeDirectoryStation({
    stationuuid: value.directoryId,
    name: value.name,
    url: value.url,
    countrycode: value.countryCode,
    languagecodes: value.languageCodes.join(','),
    tags: value.genres.join(','),
    streamType: value.streamType,
  });
  if (!normalized || value.id !== normalized.id) fail('invalid');
  return normalized;
}
export function validateBackup(value) {
  if (!record(value) || value.app !== 'world-radio-app') fail('invalid');
  if (value.version !== 1) fail('version');
  if (
    !Array.isArray(value.stations) ||
    value.stations.length > ADDED_LIMIT ||
    !record(value.settings)
  )
    fail('invalid');
  const settings = value.settings;
  if (
    !SUPPORTED_LANGUAGES.includes(settings.language) ||
    !['system', 'light', 'dark'].includes(settings.theme) ||
    !Number.isFinite(settings.volume) ||
    settings.volume < 0 ||
    settings.volume > 1 ||
    typeof settings.muted !== 'boolean'
  )
    fail('invalid');
  return {
    app: 'world-radio-app',
    version: 1,
    stations: value.stations.map(station),
    favoriteIds: ids(value.favoriteIds),
    recentIds: ids(value.recentIds).slice(0, RECENT_LIMIT),
    settings: {
      language: settings.language,
      theme: settings.theme,
      volume: settings.volume,
      muted: settings.muted,
    },
  };
}
export function parseBackup(text) {
  if (typeof text !== 'string' || new Blob([text]).size > BACKUP_LIMIT) fail('size');
  let value;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    fail('invalid');
  }
  return validateBackup(value);
}
export function createBackup(current, now = new Date()) {
  return {
    ...validateBackup({
      ...current,
      app: 'world-radio-app',
      version: 1,
      stations: current.catalog.filter((s) => s.directoryId),
    }),
    createdAt: now.toISOString(),
  };
}
// Existing identity/URL wins. Remap favorites/history to it when importing a
// different directory UUID for the same stream (including curated stations).
export function withSavedLibrary(current) {
  const catalog = current.catalog.slice();
  for (const station of loadAddedStations().stations)
    if (!catalog.some((s) => s.id === station.id || s.url === station.url)) catalog.push(station);
  return {
    ...current,
    catalog,
    favoriteIds: ids([...current.favoriteIds, ...loadFavorites().favoriteIds]),
    recentIds: ids([...current.recentIds, ...loadRecent().recentIds]).slice(0, RECENT_LIMIT),
  };
}
export function planImport(incoming, current) {
  const data = validateBackup(incoming);
  const catalog = current.catalog.slice();
  const aliases = new Map();
  for (const candidate of data.stations) {
    const existing = catalog.find((s) => s.id === candidate.id || s.url === candidate.url);
    aliases.set(candidate.id, existing?.id || candidate.id);
    if (!existing) catalog.push(candidate);
  }
  const stations = catalog.filter((s) => s.directoryId);
  if (stations.length > ADDED_LIMIT) fail('limit');
  const remap = (values) => values.map((id) => aliases.get(id) || id);
  const favoriteIds = ids([...current.favoriteIds, ...remap(data.favoriteIds)]);
  const recentIds = ids([...current.recentIds, ...remap(data.recentIds)]).slice(0, RECENT_LIMIT);
  return {
    stations,
    favoriteIds,
    recentIds,
    settings: data.settings,
    counts: {
      stations: catalog.length - current.catalog.length,
      favorites: favoriteIds.length - current.favoriteIds.length,
      recent: recentIds.filter((id) => !current.recentIds.includes(id)).length,
    },
  };
}
// localStorage has no multi-key transaction. Snapshot before writing and undo
// successful writes in reverse order on failure; distinguish failed rollback.
export function persistImport(plan, { includeSettings = false, stationId } = {}, storage) {
  const entries = [
    [ADDED_KEY, { version: 1, stations: plan.stations }],
    [FAVORITES_KEY, { version: 1, stationIds: plan.favoriteIds }],
    [RECENT_KEY, { version: 1, stationIds: plan.recentIds }],
    ...(includeSettings
      ? [
          [LANGUAGE_KEY, { version: 1, language: plan.settings.language }],
          [THEME_KEY, { version: 1, mode: plan.settings.theme }],
          [
            PLAYER_KEY,
            { version: 1, stationId, volume: plan.settings.volume, muted: plan.settings.muted },
          ],
        ]
      : []),
  ];
  const before = new Map();
  try {
    storage ||= window.localStorage;
    for (const [key] of entries) {
      const raw = storage.getItem(key);
      before.set(key, raw);
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        /* Preserve unreadable data on rollback too. */
      }
      if (value?.version > 1) fail('newer');
    }
  } catch (error) {
    if (error.message === 'newer') throw error;
    fail('storage');
  }
  const written = [];
  try {
    for (const [key, value] of entries) {
      storage.setItem(key, JSON.stringify(value));
      written.push(key);
    }
  } catch {
    let restored = true;
    for (const key of written.reverse()) {
      try {
        if (before.get(key) === null) storage.removeItem(key);
        else storage.setItem(key, before.get(key));
      } catch {
        restored = false;
      }
    }
    fail(restored ? 'storage' : 'recovery');
  }
}
export function downloadBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `world-radio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
