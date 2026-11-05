import { useSearchParams } from 'react-router-dom';
import { normalizeStationQuery } from '../lib/stationUtils';

export const defaultFilters = { section: 'all', country: '', genre: '', language: '', q: '' };
export function getFilterOptions(stations) {
  const unique = (values) => [...new Set(values)].sort();
  return {
    countries: unique(stations.map((station) => station.countryCode)),
    genres: unique(stations.flatMap((station) => station.genres)),
    languages: unique(stations.flatMap((station) => station.languageCodes)),
  };
}
export function readFilters(params, options) {
  const valid = (key, values) => values.includes(params.get(key)) ? params.get(key) : '';
  return {
    section: params.get('section') === 'favorites' ? 'favorites' : 'all',
    country: valid('country', options.countries),
    genre: valid('genre', options.genres),
    language: valid('language', options.languages),
    q: params.get('q') || '',
  };
}
export function filterStations(stations, favoriteIds, filters = defaultFilters) {
  const { section, country, genre, language, q } = { ...defaultFilters, ...filters };
  const query = normalizeStationQuery(q);
  return stations.filter((station) =>
    (section !== 'favorites' || favoriteIds.includes(station.id)) &&
    (!country || station.countryCode === country) &&
    (!genre || station.genres.includes(genre)) &&
    (!language || station.languageCodes.includes(language)) &&
    normalizeStationQuery(station.name).includes(query));
}
export default function useStationFilters(stations, favoriteIds) {
  const [params, setParams] = useSearchParams();
  const options = getFilterOptions(stations);
  const filters = readFilters(params, options);
  const updateFilters = (patch) => {
    const next = { ...filters, ...patch };
    const result = new URLSearchParams(params);
    Object.keys(defaultFilters).forEach((key) => {
      if (next[key] && next[key] !== defaultFilters[key]) result.set(key, next[key]);
      else result.delete(key);
    });
    setParams(result, { replace: true, preventScrollReset: true });
  };
  return {
    filters, options, updateFilters,
    resetFilters: () => updateFilters(defaultFilters),
    clearRefinements: () => updateFilters({ ...defaultFilters, section: filters.section }),
    searchedStations: filterStations(stations, favoriteIds, filters),
  };
}
