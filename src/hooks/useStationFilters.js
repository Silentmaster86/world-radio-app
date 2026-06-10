import { useState } from 'react';

export default function useStationFilters(stations, favorites) {
	const [filter, setFilter] = useState('All');
	const [query, setQuery] = useState('');

	const filters = ['All', 'Favorites', 'UK', 'PL', 'Dance', 'News', 'Pop'];

	const filteredStations = stations.filter((station) => {
		if (filter === 'Favorites') {
			return favorites.some((favorite) => favorite.name === station.name);
		}

		if (['UK', 'PL'].includes(filter)) {
			return station.country === filter;
		}

		if (['Dance', 'News', 'Pop'].includes(filter)) {
			return station.genre === filter;
		}

		return true;
	});

	const searchedStations = filteredStations.filter((station) =>
		station.name.toLowerCase().includes(query.toLowerCase()),
	);

	return {
		filters,
		filter,
		setFilter,
		query,
		setQuery,
		searchedStations,
	};
}
