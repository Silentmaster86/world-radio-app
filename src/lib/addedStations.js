import { readStorage, writeStorage } from './storage';
export const ADDED_KEY = 'wra:stations:v1';
export const ADDED_LIMIT = 100;
export function normalizeDirectoryStation(row) {
  if (!row || typeof row !== 'object') return null;
  const uuid = String(row.stationuuid || '').toLowerCase();
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(uuid)) return null;
  let url;
  try {
    url = new URL(row.url_resolved || row.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048)
      return null;
    if (/\.(m3u8?|pls|asx)(?:$|[?#])/i.test(url.href) || Number(row.hls) === 1) return null;
  } catch {
    return null;
  }
  const name = String(row.name || '')
    .trim()
    .slice(0, 120);
  if (!name) return null;
  return {
    id: `rb-${uuid}`,
    name,
    url: url.href,
    countryCode: /^[A-Z]{2}$/.test(row.countrycode) ? row.countrycode : '',
    languageCodes: String(row.languagecodes || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^[a-z]{2,3}$/.test(s))
      .slice(0, 5),
    genres: String(row.tags || '')
      .split(',')
      .map((s) => s.trim().slice(0, 32))
      .filter(Boolean)
      .slice(0, 3),
    description: '',
    directoryId: uuid,
  };
}
export function loadAddedStations() {
  const record = readStorage(ADDED_KEY, null, (value) => value && typeof value === 'object');
  if (record.value?.version > 1) return { stations: [], canPersist: false };
  const seen = new Set();
  const stations = [];
  for (const row of record.value?.version === 1 && Array.isArray(record.value.stations)
    ? record.value.stations.slice(0, ADDED_LIMIT)
    : []) {
    const station = normalizeDirectoryStation({
      stationuuid: row.directoryId,
      name: row.name,
      url: row.url,
      countrycode: row.countryCode,
      languagecodes: Array.isArray(row.languageCodes) ? row.languageCodes.join(',') : '',
      tags: Array.isArray(row.genres) ? row.genres.join(',') : '',
    });
    if (station && !seen.has(station.id)) {
      stations.push(station);
      seen.add(station.id);
    }
  }
  return { stations, canPersist: true };
}
export function saveAddedStations(stations) {
  return writeStorage(ADDED_KEY, { version: 1, stations: stations.slice(0, ADDED_LIMIT) });
}
