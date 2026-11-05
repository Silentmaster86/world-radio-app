import { stations } from '../data/stations';
import { findStationById, resolveLegacyStationId, getCountryFlag, getCountryName, normalizeStationQuery } from './stationUtils';

test('station IDs are unique and country, language and genres have distinct fields', () => {
  expect(new Set(stations.map((station) => station.id)).size).toBe(9);
  for (const station of stations) {
    expect(station.id).toMatch(/^[a-z0-9-]+$/);
    expect(station.countryCode).toMatch(/^[A-Z]{2}$/);
    expect(station.languageCodes.length).toBeGreaterThan(0);
    expect(station.genres.length).toBeGreaterThan(0);
    expect(new URL(station.url).protocol).toBe('https:');
  }
  expect(findStationById('pr-chicago')).toMatchObject({ countryCode: 'US', languageCodes: ['pl'] });
});

test('legacy resolution never depends on the old URL or logo hash', () => {
  expect(resolveLegacyStationId({ name: 'Capital Dance', url: 'old', logo: 'old' })).toBe('capital-dance');
  expect(resolveLegacyStationId({ id: 'capital-dance', name: 'Renamed station' })).toBe('capital-dance');
  expect(resolveLegacyStationId(null)).toBeUndefined();
  expect(resolveLegacyStationId({ name: 'Unknown' })).toBeUndefined();
});

test('country formatting includes Chicago and handles missing codes', () => {
  expect(getCountryFlag('US')).toBe('🇺🇸');
  expect(getCountryName('GB')).toBe('United Kingdom');
  expect(getCountryFlag(undefined)).toBe('🌍');
  expect(getCountryName('XX')).toBe('Unknown country');
});

test('normalizes casing, surrounding whitespace and accented search text', () => {
  expect(normalizeStationQuery('  CAPiTAL  ')).toBe('capital');
  expect(normalizeStationQuery('Łódź')).toBe('łodz');
});
