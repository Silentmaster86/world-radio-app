import { useState } from 'react';
import { normalizeStationQuery } from '../lib/stationUtils';

export function filterStations(stations, favoriteIds, filter, query) {
	const countries = new Set(stations.map((station) => station.countryCode));
	const genres = new Set(stations.flatMap((station) => station.genres));
	const normalized = normalizeStationQuery(query);
	return stations.filter((station) => {
		if (filter === 'Favorites' && !favoriteIds.includes(station.id)) return false;
		if (countries.has(filter) && station.countryCode !== filter) return false;
		if (genres.has(filter) && !station.genres.includes(filter)) return false;
		return normalizeStationQuery(station.name).includes(normalized);
	});
}

export default function useStationFilters(stations, favoriteIds) {
	const [filter, setFilter] = useState('All');
	const [query, setQuery] = useState('');

	const filters = ['All', 'Favorites',
		...new Set(stations.map((station) => station.countryCode)),
		...new Set(stations.flatMap((station) => station.genres)),
	];
	const searchedStations = filterStations(stations, favoriteIds, filter, query);

	return {
		filters,
		filter,
		setFilter,
		query,
		setQuery,
		searchedStations,
	};
}
