import { stations } from '../data/stations';

const countries = {
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  US: { name: 'United States', flag: '🇺🇸' },
  DE: { name: 'Germany', flag: '🇩🇪' },
};

export function findStationById(id) {
  return stations.find((station) => station.id === id);
}

export function resolveLegacyStationId(saved) {
  if (!saved || typeof saved !== 'object') return undefined;
  if (findStationById(saved.id)) return saved.id;
  return stations.find((station) => station.name === saved.name)?.id;
}

export function getCountryFlag(code) {
  if (countries[code]) return countries[code].flag;
  return /^[A-Z]{2}$/.test(code || '') && !['XX', 'ZZ'].includes(code)
    ? String.fromCodePoint(...[...code].map((c) => c.charCodeAt(0) + 127397))
    : '🌍';
}

export function getCountryName(code) {
  if (countries[code]) return countries[code].name;
  if (!/^[A-Z]{2}$/.test(code || '') || ['XX', 'ZZ'].includes(code)) return 'Unknown country';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
  } catch {
    return 'Unknown country';
  }
}

export function normalizeStationQuery(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ');
}
