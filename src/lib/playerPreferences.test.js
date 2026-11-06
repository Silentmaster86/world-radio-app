import { loadPlayerPreferences, savePlayerPreferences, PLAYER_KEY } from './playerPreferences';

const stations = [{ id: 'first' }, { id: 'second' }];
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test('restores station, volume and mute from the versioned record', () => {
  expect(savePlayerPreferences({ stationId: 'second', volume: 0.35, muted: true })).toBe(true);
  expect(loadPlayerPreferences(stations)).toMatchObject({
    stationId: 'second',
    volume: 0.35,
    muted: true,
  });
});

test.each(['{', 'null', '[]', '42', '{"version":1,"volume":"loud","stationId":"missing"}'])(
  'recovers invalid settings without modifying the original data: %s',
  (raw) => {
    localStorage.setItem(PLAYER_KEY, raw);
    expect(loadPlayerPreferences(stations)).toMatchObject({
      stationId: 'first',
      volume: 1,
      muted: false,
    });
    expect(localStorage.getItem(PLAYER_KEY)).toBe(raw);
  },
);

test('clamps finite volume and does not coerce a string into mute', () => {
  localStorage.setItem(PLAYER_KEY, '{"version":1,"volume":-2,"muted":"true"}');
  expect(loadPlayerPreferences(stations)).toMatchObject({ volume: 0, muted: false });
});

test('protects newer settings records', () => {
  const raw = '{"version":2,"stationId":"second","volume":0.3}';
  localStorage.setItem(PLAYER_KEY, raw);
  expect(loadPlayerPreferences(stations).canPersist).toBe(false);
  expect(localStorage.getItem(PLAYER_KEY)).toBe(raw);
});

test('reports blocked storage without throwing', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Full');
  });
  expect(loadPlayerPreferences(stations).message).toContain('session');
  expect(savePlayerPreferences({ stationId: 'first', volume: 0.5, muted: false })).toBe(false);
});
