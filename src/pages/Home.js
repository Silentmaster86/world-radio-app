// src/pages/Home.js
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { stations } from '../data/stations';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTheme } from '../context/ThemeContext';

import HomeHeader from '../components/Home/HomeHeader';
import NowPlayingBanner from '../components/Home/NowPlayingBanner';
import StationControls from '../components/Home/StationControls';
import StationCard from '../components/Home/StationCard';

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
	const navigate = useNavigate();

	const { setStation, currentStation } = useAudio();
	const { favorites, toggleFavorite } = useFavorites();
	const { isDarkMode, toggleTheme } = useTheme();

	const { filters, filter, setFilter, query, setQuery, searchedStations } =
		useStationFilters(stations, favorites);

	return (
		<PageWrapper>
			<HomeHeader />

			<NowPlayingBanner station={currentStation} />

			<StationControls
				filters={filters}
				filter={filter}
				setFilter={setFilter}
				query={query}
				setQuery={setQuery}
				isDarkMode={isDarkMode}
				toggleTheme={toggleTheme}
			/>

			<StationGrid>
				{searchedStations.map((station) => (
					<StationCard
						key={station.name}
						station={station}
						isActive={station.name === currentStation?.name}
						isFavorite={favorites.some((f) => f.name === station.name)}
						onPlay={() => setStation(station)}
						onFavorite={() => toggleFavorite(station)}
					/>
				))}
			</StationGrid>
		</PageWrapper>
	);
}
