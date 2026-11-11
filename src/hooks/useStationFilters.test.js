import { stations } from '../data/stations';
import { filterStations, getFilterOptions, readFilters } from './useStationFilters';
import { translate } from '../i18n';
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
  ).toEqual({
    section: 'favorites',
    country: 'GB',
    genre: 'News',
    language: 'pl',
    q: 'PRL',
    page: 1,
  });
  expect(
    readFilters(new URLSearchParams('section=oops&country=XX&genre=unknown&language=xx'), options),
  ).toEqual({ section: 'all', country: '', genre: '', language: '', q: '', page: 1 });
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

test('search matches all words across names, genres and descriptions with normalized accents', () => {
  expect(ids({ q: '  german  culture ' })).toEqual(['deutschlandfunk-kultur']);
  expect(ids({ q: 'somafm' })).toEqual([]);
  expect(ids({ country: 'DE', language: 'de', q: 'culture' })).toEqual(['deutschlandfunk-kultur']);
  expect(ids({ q: 'jazz nonexisting' })).toEqual([]);
  const sample = [{ id: 'lodz', name: 'Radio Łódź', genres: ['Talk'], description: '' }];
  expect(filterStations(sample, [], { q: 'lodz' })).toEqual(sample);
});

test('bounded whole-number page URLs restore more results; invalid pages use the first page', () => {
  const options = getFilterOptions(stations);
  expect(readFilters(new URLSearchParams('page=2'), options).page).toBe(1);
  const expandedOptions = getFilterOptions([...stations, { ...stations[0], id: 'extra-station' }]);
  expect(readFilters(new URLSearchParams('page=2'), expandedOptions).page).toBe(2);
  for (const value of ['0', '-1', '2.5', '1e0', 'Infinity', '999999999999999999999']) {
    expect(readFilters(new URLSearchParams(`page=${value}`), options).page).toBe(1);
  }
});

test('Polish search matches translated genre and description without changing station data', () => {
  const localize = (key, params, fallback) => translate('pl', key, params, fallback);
  const results = filterStations(stations, [], { q: 'wiadomości' }, [], localize);
  expect(results.map((station) => station.id)).toContain('pr-chicago');
  expect(results.map((station) => station.id)).toContain('deutschlandfunk');
  expect(
    filterStations(stations, [], { q: 'muzyka klasyczna' }, [], localize).map(
      (station) => station.id,
    ),
  ).toEqual(['deutschlandfunk-kultur']);
});

test('favorites follow saved order while preserving all refinement filters', () => {
  expect(
    ids({ section: 'favorites' }, ['heart-uk', 'missing', 'capital-dance', 'heart-uk']),
  ).toEqual(['heart-uk', 'capital-dance']);
  expect(
    ids({ section: 'favorites', q: 'capital' }, ['heart-uk', 'capital-fm', 'capital-dance']),
  ).toEqual(['capital-fm', 'capital-dance']);
});
