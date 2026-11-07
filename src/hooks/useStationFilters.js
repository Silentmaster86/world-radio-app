import { useSearchParams } from 'react-router-dom';
import { useRef } from 'react';
import { normalizeStationQuery } from '../lib/stationUtils';

export const STATION_PAGE_SIZE = 12;
export const defaultFilters = {
  section: 'all',
  country: '',
  genre: '',
  language: '',
  q: '',
  page: 1,
};
export function getFilterOptions(stations) {
  const unique = (values) => [...new Set(values)].sort();
  return {
    countries: unique(stations.map((station) => station.countryCode)),
    genres: unique(stations.flatMap((station) => station.genres)),
    languages: unique(stations.flatMap((station) => station.languageCodes)),
    pageCount: Math.max(1, Math.ceil(stations.length / STATION_PAGE_SIZE)),
  };
}
export function readFilters(params, options) {
  const valid = (key, values) => (values.includes(params.get(key)) ? params.get(key) : '');
  const page = /^\d+$/.test(params.get('page') || '') ? Number(params.get('page')) : 1;
  return {
    section: ['favorites', 'recent'].includes(params.get('section'))
      ? params.get('section')
      : 'all',
    country: valid('country', options.countries),
    genre: valid('genre', options.genres),
    language: valid('language', options.languages),
    q: params.get('q') || '',
    page: Number.isSafeInteger(page) && page >= 1 && page <= options.pageCount ? page : 1,
  };
}
export function filterStations(stations, favoriteIds, filters = defaultFilters, recentIds = []) {
  const { section, country, genre, language, q } = { ...defaultFilters, ...filters };
  const query = normalizeStationQuery(q);
  const terms = query.split(' ').filter(Boolean);
  const byId = new Map(stations.map((station) => [station.id, station]));
  const collection =
    section === 'recent'
      ? [...new Set(recentIds)].map((id) => byId.get(id)).filter(Boolean)
      : stations;
  return collection.filter(
    (station) =>
      (section !== 'favorites' || favoriteIds.includes(station.id)) &&
      (!country || station.countryCode === country) &&
      (!genre || station.genres.includes(genre)) &&
      (!language || station.languageCodes.includes(language)) &&
      terms.every((term) =>
        normalizeStationQuery(
          [station.name, ...station.genres, station.description || ''].join(' '),
        ).includes(term),
      ),
  );
}
export default function useStationFilters(stations, favoriteIds, recentIds = []) {
  const [params, setParams] = useSearchParams();
  const renderedSearch = params.toString();
  const latest = useRef({ renderedSearch, params });
  if (latest.current.renderedSearch !== renderedSearch) {
    latest.current = { renderedSearch, params };
  }
  const options = getFilterOptions(stations);
  const filters = readFilters(params, options);
  const updateFilters = (patch) => {
    // Router transitions can defer rendering between consecutive input events.
    // Compose against the latest edit rather than the previous render's URL.
    const next = { ...readFilters(latest.current.params, options), page: 1, ...patch };
    const result = new URLSearchParams(latest.current.params);
    Object.keys(defaultFilters).forEach((key) => {
      if (next[key] && next[key] !== defaultFilters[key]) result.set(key, next[key]);
      else result.delete(key);
    });
    latest.current.params = result;
    setParams(result, { replace: true, preventScrollReset: true });
  };
  const searchedStations = filterStations(stations, favoriteIds, filters, recentIds);
  return {
    filters,
    options,
    updateFilters,
    resetFilters: () => updateFilters(defaultFilters),
    clearRefinements: () => updateFilters({ country: '', genre: '', language: '', q: '' }),
    searchedStations,
    visibleStations: searchedStations.slice(0, filters.page * STATION_PAGE_SIZE),
  };
}
