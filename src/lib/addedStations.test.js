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
    'https://radio.example/live.pls',
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

test('HTTPS HLS records retain their format after storage reload', () => {
  const station = normalizeDirectoryStation({
    ...row,
    hls: 1,
    url_resolved: 'https://radio.example/master.m3u8',
  });
  expect(station.streamType).toBe('hls');
  saveAddedStations([station]);
  expect(loadAddedStations().stations[0]).toEqual(station);
});

test('upgrades only exact verified BBC records, leaving other insecure streams rejected', () => {
  const uuid = 'a740cc4c-9563-4fbe-a13f-e7f9e89b7441';
  const url =
    'http://as-hls-ww-live.akamaized.net/pool_01505109/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d128000.norewind.m3u8';
  const station = normalizeDirectoryStation({ ...row, stationuuid: uuid, url_resolved: url });
  expect(station).toMatchObject({
    id: `rb-${uuid}`,
    url: url.replace('http:', 'https:'),
    streamType: 'hls',
  });
  saveAddedStations([station]);
  expect(loadAddedStations().stations).toEqual([station]);
  expect(normalizeDirectoryStation({ ...row, url_resolved: url })).toBeNull();
  expect(
    normalizeDirectoryStation({ ...row, stationuuid: uuid, url_resolved: url + '?changed' }),
  ).toBeNull();
});

test('preserves HLS format for extensionless URLs through reload', () => {
  const station = normalizeDirectoryStation({ ...row, hls: 1 });
  saveAddedStations([station]);
  expect(loadAddedStations().stations[0].streamType).toBe('hls');
});
