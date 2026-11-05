import { stations } from '../data/stations';
import { filterStations } from './useStationFilters';

test('Chicago is included in US and excluded from GB', () => {
  expect(filterStations(stations, [], 'US', '').map((station) => station.id)).toEqual(['pr-chicago']);
  expect(filterStations(stations, [], 'GB', '').some((station) => station.id === 'pr-chicago')).toBe(false);
});

test('favorites are filtered by stable ID and use current catalog data', () => {
  const renamed = stations.map((station) => station.id === 'capital-dance'
    ? { ...station, name: 'Updated name', url: 'https://example.com/new' } : station);
  expect(filterStations(renamed, ['capital-dance', 'missing'], 'Favorites', '')).toEqual([renamed[0]]);
});

test('search remains case insensitive and tolerates surrounding spaces', () => {
  expect(filterStations(stations, [], 'All', ' CaPiTaL ').map((station) => station.id))
    .toEqual(['capital-dance', 'capital-fm']);
});

test('genre filtering uses the genre array and can narrow search results', () => {
  expect(filterStations(stations, [], 'News', 'Chicago').map((station) => station.id)).toEqual(['pr-chicago']);
  expect(filterStations(stations, [], 'Pop', 'Chicago')).toEqual([]);
});
