import {
  loadRecent,
  saveRecent,
  prependRecent,
  normalizeRecentIds,
  RECENT_KEY,
  RECENT_LIMIT,
} from './recentStorage';

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test('reading missing or corrupt history does not write or affect favorites/settings', () => {
  localStorage.setItem('wra:favorites:v1', '{"version":1,"stationIds":["heart-uk"]}');
  localStorage.setItem('wra:player:v1', '{"version":1,"stationId":"heart-uk"}');
  const write = jest.spyOn(Storage.prototype, 'setItem');
  expect(loadRecent().recentIds).toEqual([]);
  expect(write).not.toHaveBeenCalled();
  write.mockRestore();
  localStorage.setItem(RECENT_KEY, '{');
  expect(loadRecent().recentIds).toEqual([]);
  expect(loadRecent().message).toContain('could not be read');
  expect(localStorage.getItem('wra:favorites:v1')).toContain('heart-uk');
  expect(localStorage.getItem('wra:player:v1')).toContain('heart-uk');
});

test('normalizes and bounds IDs while retaining valid unavailable catalog IDs', () => {
  const ids = [
    'heart-uk',
    'heart-uk',
    null,
    '',
    'https://example.com',
    'temporarily-unavailable',
    ...Array.from({ length: 40 }, (_, i) => `station-${i}`),
  ];
  localStorage.setItem(RECENT_KEY, JSON.stringify({ version: 1, stationIds: ids }));
  expect(loadRecent().recentIds).toHaveLength(RECENT_LIMIT);
  expect(loadRecent().recentIds.slice(0, 2)).toEqual(['heart-uk', 'temporarily-unavailable']);
  expect(normalizeRecentIds(null)).toEqual([]);
});

test('a repeated station moves to the front and the oldest entry is dropped at the limit', () => {
  expect(prependRecent(['capital-dance', 'heart-uk'], 'heart-uk')).toEqual([
    'heart-uk',
    'capital-dance',
  ]);
  const existing = Array.from({ length: RECENT_LIMIT }, (_, i) => `station-${i}`);
  const next = prependRecent(existing, 'new-station');
  expect(next).toHaveLength(RECENT_LIMIT);
  expect(next[0]).toBe('new-station');
  expect(next).not.toContain(`station-${RECENT_LIMIT - 1}`);
});

test('a newer schema remains protected', () => {
  const raw = '{"version":2,"entries":[{"station":"heart-uk"}]}';
  localStorage.setItem(RECENT_KEY, raw);
  expect(loadRecent()).toMatchObject({ recentIds: [], canPersist: false });
  expect(localStorage.getItem(RECENT_KEY)).toBe(raw);
});

test('saves a bounded versioned record with IDs only', () => {
  expect(saveRecent(['heart-uk', 'capital-dance', 'heart-uk'])).toBe(true);
  expect(JSON.parse(localStorage.getItem(RECENT_KEY))).toEqual({
    version: 1,
    stationIds: ['heart-uk', 'capital-dance'],
  });
  expect(saveRecent(null)).toBe(false);
});

test('storage read/write failures are contained', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  expect(loadRecent().message).toContain('session only');
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Quota');
  });
  expect(saveRecent(['heart-uk'])).toBe(false);
});
