import { stations } from '../data/stations';
import { filterStations, getFilterOptions, readFilters } from './useStationFilters';
const ids = (filters, favorites = []) =>
  filterStations(stations, favorites, filters).map((station) => station.id);
test('country is independent of station language', () => {
  expect(ids({ country: 'US', language: 'pl' })).toEqual(['pr-chicago']);
  expect(ids({ country: 'GB', language: 'pl' })).toEqual(['prl']);
});
test('all refinements intersect with favorites and search', () => {
  expect(
    ids({ section: 'favorites', country: 'GB', genre: 'News', language: 'pl', q: ' PRL ' }, [
      'prl',
      'pr-chicago',
      'missing',
    ]),
  ).toEqual(['prl']);
  expect(ids({ country: 'US', genre: 'Pop' })).toEqual([]);
  expect(ids({ q: ' CaPiTaL ' })).toEqual(['capital-dance', 'capital-fm']);
});
test('favorites use stable IDs and current catalog data', () => {
  const renamed = [{ ...stations[0], name: 'Updated', url: 'https://example.com/new' }];
  expect(filterStations(renamed, ['capital-dance', 'missing'], { section: 'favorites' })).toEqual(
    renamed,
  );
});
test('valid URLs restore all refinements; invalid parameters safely fall back', () => {
  const options = getFilterOptions(stations);
  expect(
    readFilters(
      new URLSearchParams('section=favorites&country=GB&genre=News&language=pl&q=PRL'),
      options,
    ),
  ).toEqual({ section: 'favorites', country: 'GB', genre: 'News', language: 'pl', q: 'PRL' });
  expect(
    readFilters(new URLSearchParams('section=oops&country=XX&genre=unknown&language=xx'), options),
  ).toEqual({ section: 'all', country: '', genre: '', language: '', q: '' });
});

test('recent results keep listening order, omit missing IDs and intersect refinements', () => {
  const recent = ['pr-chicago', 'missing-station', 'prl', 'heart-uk', 'prl'];
  expect(filterStations(stations, [], { section: 'recent' }, recent).map((s) => s.id)).toEqual([
    'pr-chicago',
    'prl',
    'heart-uk',
  ]);
  expect(
    filterStations(
      stations,
      [],
      { section: 'recent', country: 'GB', language: 'pl', genre: 'News', q: 'PRL' },
      recent,
    ).map((s) => s.id),
  ).toEqual(['prl']);
  expect(
    readFilters(new URLSearchParams('section=recent'), getFilterOptions(stations)).section,
  ).toBe('recent');
});
