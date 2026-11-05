import { stations } from '../data/stations';
import { loadFavorites, saveFavorites, FAVORITES_KEY, LEGACY_FAVORITES_KEY } from './favoritesStorage';

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test('resolves all original station names, preserving order and removing duplicates', () => {
  const old = stations.map(({ name, url, logo }) => ({ name, url, logo }));
  localStorage.setItem(LEGACY_FAVORITES_KEY, JSON.stringify([...old, old[0]]));
  const loaded = loadFavorites();
  expect(loaded.favoriteIds).toEqual(stations.map((station) => station.id));
  expect(loaded.shouldMigrate).toBe(true);
  expect(localStorage.getItem(FAVORITES_KEY)).toBeNull();
  expect(saveFavorites(loaded.favoriteIds, loaded.removeLegacyAfterSave)).toBe(true);
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY))).toEqual({
    version: 1, stationIds: stations.map((station) => station.id),
  });
  expect(localStorage.getItem(LEGACY_FAVORITES_KEY)).toBeNull();
});

test('keeps the original library when writing the new schema fails', () => {
  const raw = JSON.stringify([{ name: 'Capital Dance' }]);
  localStorage.setItem(LEGACY_FAVORITES_KEY, raw);
  const loaded = loadFavorites();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
  expect(saveFavorites(loaded.favoriteIds, true)).toBe(false);
  expect(localStorage.getItem(LEGACY_FAVORITES_KEY)).toBe(raw);
  expect(localStorage.getItem(FAVORITES_KEY)).toBeNull();
});

test('backs up unmatched and malformed legacy entries instead of discarding them', () => {
  const raw = JSON.stringify([{ name: 'Capital Dance' }, { name: 'Unavailable station' }, null]);
  localStorage.setItem(LEGACY_FAVORITES_KEY, raw);
  const loaded = loadFavorites();
  expect(loaded.favoriteIds).toEqual(['capital-dance']);
  expect(loaded.removeLegacyAfterSave).toBe(false);
  expect(loaded.message).toContain('kept');
  saveFavorites(loaded.favoriteIds, loaded.removeLegacyAfterSave);
  expect(localStorage.getItem(LEGACY_FAVORITES_KEY)).toBe(raw);
});

test('prefers the new schema and retains IDs temporarily missing from the catalog', () => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify({
    version: 1, stationIds: ['heart-uk', 'future-station', 'heart-uk'],
  }));
  localStorage.setItem(LEGACY_FAVORITES_KEY, '[{"name":"Capital Dance"}]');
  expect(loadFavorites().favoriteIds).toEqual(['heart-uk', 'future-station']);
  expect(loadFavorites().shouldMigrate).toBe(false);
});

test('recovers a corrupt new record from a valid legacy backup', () => {
  localStorage.setItem(FAVORITES_KEY, '{');
  localStorage.setItem(LEGACY_FAVORITES_KEY, '[{"name":"PR Chicago"}]');
  expect(loadFavorites().favoriteIds).toEqual(['pr-chicago']);
  expect(loadFavorites().shouldMigrate).toBe(true);
});

test('does not downgrade a newer schema', () => {
  const raw = JSON.stringify({ version: 2, stationIds: ['heart-uk'], extra: 'preserve' });
  localStorage.setItem(FAVORITES_KEY, raw);
  const loaded = loadFavorites();
  expect(loaded.canPersist).toBe(false);
  expect(loaded.message).toContain('newer format');
  expect(localStorage.getItem(FAVORITES_KEY)).toBe(raw);
});

test('keeps the successful new record if deleting the old key is blocked', () => {
  localStorage.setItem(LEGACY_FAVORITES_KEY, '[{"name":"PRL"}]');
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('Blocked'); });
  expect(saveFavorites(['prl'], true)).toBe(true);
  expect(loadFavorites().favoriteIds).toEqual(['prl']);
  expect(localStorage.getItem(LEGACY_FAVORITES_KEY)).not.toBeNull();
});

test('rejects invalid ID data without overwriting the saved library', () => {
  expect(saveFavorites(['prl'])).toBe(true);
  expect(saveFavorites([null])).toBe(false);
  expect(loadFavorites().favoriteIds).toEqual(['prl']);
});
