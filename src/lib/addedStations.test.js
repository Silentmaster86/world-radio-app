import {
  normalizeDirectoryStation,
  loadAddedStations,
  saveAddedStations,
  ADDED_KEY,
} from './addedStations';
const row = {
  stationuuid: '12345678-1234-1234-1234-123456789abc',
  name: 'World Jazz',
  countrycode: 'FR',
  url_resolved: 'https://radio.example/live',
  tags: 'jazz,music',
  languagecodes: 'fre',
};
beforeEach(() => localStorage.clear());
test('normalizes stable IDs and rejects playlists, insecure URLs and malformed IDs', () => {
  expect(normalizeDirectoryStation(row)).toMatchObject({
    id: `rb-${row.stationuuid}`,
    name: 'World Jazz',
    countryCode: 'FR',
  });
  for (const url of [
    'http://radio.example/live',
    'https://u:p@radio.example/live',
    'https://radio.example/live.m3u8',
  ])
    expect(normalizeDirectoryStation({ ...row, url_resolved: url })).toBeNull();
  expect(normalizeDirectoryStation({ ...row, stationuuid: 'wrong' })).toBeNull();
});
test('saved stations survive reload, discard invalid records and preserve future schemas', () => {
  const station = normalizeDirectoryStation(row);
  saveAddedStations([station]);
  expect(loadAddedStations().stations).toEqual([station]);
  localStorage.setItem(
    ADDED_KEY,
    JSON.stringify({
      version: 1,
      stations: [
        { ...station, languageCodes: 3, genres: {} },
        { ...station, url: 'javascript:bad' },
      ],
    }),
  );
  expect(loadAddedStations().stations).toHaveLength(1);
  localStorage.setItem(ADDED_KEY, '{"version":9,"preserve":true}');
  expect(loadAddedStations()).toEqual({ stations: [], canPersist: false });
});
test('blocked storage does not throw', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('quota');
  });
  expect(saveAddedStations([])).toBe(false);
  spy.mockRestore();
});
