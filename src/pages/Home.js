// src/pages/Home.js
import styled from 'styled-components';

import { stations } from '../data/stations';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';

import HomeHeader from '../components/Home/HomeHeader';
import NowPlayingBanner from '../components/Home/NowPlayingBanner';
import StationControls from '../components/Home/StationControls';
import StationCard from '../components/Home/StationCard';
import EmptyState from '../components/Home/EmptyState';

import useStationFilters from '../hooks/useStationFilters';

const PageWrapper = styled.main`
	width: 100%;
	min-height: auto;

	padding: 1rem;
	padding-bottom: 1rem;

	background: ${({ theme }) =>
		theme.colors.mode === 'dark'
			? 'linear-gradient(to bottom, #1a1a1a, #000)'
			: theme.colors.background};

	color: ${({ theme }) => theme.colors.text};

	@media (max-width: 480px) {
		padding: 0.85rem;
		padding-bottom: 0.75rem;
	}
`;

const StationGrid = styled.section`
	display: grid;
	gap: ${({ theme }) => theme.spacing.md};
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
		gap: 0.8rem;
	}
`;

export default function Home() {
	const { setStation, currentStation, playingStationId, status } = useAudio();
	const { favoriteIds, isFavorite, toggleFavorite, storageMessage } = useFavorites();
	const browsing = useStationFilters(stations, favoriteIds);
	const { filters, searchedStations } = browsing;
	const favoriteCount = stations.filter((station) => favoriteIds.includes(station.id)).length;

	return (
		<PageWrapper>
			<HomeHeader />

			<NowPlayingBanner station={currentStation} />

			<StationControls
				{...browsing}
				total={stations.length}
				favoriteCount={favoriteCount}
			/>

			{storageMessage && <p role='status'>{storageMessage}</p>}

			<p role='status' aria-live='polite'>{searchedStations.length} of {filters.section === 'favorites' ? favoriteCount : stations.length} stations</p>
			{searchedStations.length === 0 && <EmptyState
				emptyFavorites={filters.section === 'favorites' && favoriteCount === 0}
				onClear={browsing.clearRefinements}
				onBrowse={browsing.resetFilters}
			/>}
			<StationGrid aria-label='Stations'>
				{searchedStations.map((station) => (
					<StationCard
						key={station.id}
						station={station}
						isSelected={station.id === currentStation?.id}
						isActive={station.id === playingStationId && status === 'playing'}
						playbackStatus={station.id === currentStation?.id ? status : undefined}
						isFavorite={isFavorite(station.id)}
						onPlay={() => setStation(station)}
						onFavorite={() => toggleFavorite(station.id)}
					/>
				))}
			</StationGrid>
		</PageWrapper>
	);
}
