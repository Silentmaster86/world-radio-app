import { stations } from '../data/stations';

const countries = {
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  PL: { name: 'Poland', flag: '🇵🇱' },
  US: { name: 'United States', flag: '🇺🇸' },
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
  return countries[code]?.flag || '🌍';
}

export function getCountryName(code) {
  return countries[code]?.name || 'Unknown country';
}

export function normalizeStationQuery(value) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
