// src/pages/Home.js
import styled from 'styled-components';
import { useLayoutEffect, useRef } from 'react';

import { stations } from '../data/stations';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { useRecentStations } from '../context/RecentStationsContext';

import HomeHeader from '../components/Home/HomeHeader';
import { useBrowseRestoration } from '../context/BrowsingContext';
import StationControls from '../components/Home/StationControls';
import StationCard from '../components/Home/StationCard';
import EmptyState from '../components/Home/EmptyState';

import useStationFilters from '../hooks/useStationFilters';

const PageWrapper = styled.main`
  width: 100%;
  max-width: 1200px;
  margin: auto;
  min-height: auto;

  padding: 1rem;
  padding-bottom: 1rem;

  background: ${({ theme }) => theme.colors.background};

  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 640px) {
    padding: 0.85rem;
    padding-bottom: 0.75rem;
  }
`;

const StationGrid = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
`;

const Results = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  p {
    margin: 0;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.65rem;
    background: transparent;
    font: inherit;
  }
`;
const More = styled.button`
  display: block;
  min-height: 44px;
  margin: 1rem auto 0;
  padding: 0.65rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.muted};
  border-radius: 0.65rem;
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
`;

export default function Home() {
  useBrowseRestoration();
  const { setStation, currentStation, playingStationId, status } = useAudio();
  const { favoriteIds, isFavorite, toggleFavorite, storageMessage } = useFavorites();
  const { recentIds, historyMessage, clearHistory } = useRecentStations();
  const browsing = useStationFilters(stations, favoriteIds, recentIds);
  const { filters, searchedStations, visibleStations } = browsing;
  const nextPageFocus = useRef(null);
  useLayoutEffect(() => {
    if (!nextPageFocus.current) return;
    const button = document.querySelector(`[data-station-id="${nextPageFocus.current}"]`);
    if (button) {
      button.focus();
      nextPageFocus.current = null;
    }
  }, [visibleStations]);
  const favoriteCount = stations.filter((station) => favoriteIds.includes(station.id)).length;
  const recentCount = stations.filter((station) => recentIds.includes(station.id)).length;
  const collectionCount =
    filters.section === 'favorites'
      ? favoriteCount
      : filters.section === 'recent'
        ? recentCount
        : stations.length;

  return (
    <PageWrapper>
      <HomeHeader />

      <StationControls
        {...browsing}
        total={stations.length}
        favoriteCount={favoriteCount}
        recentCount={recentCount}
      />

      {storageMessage && <p role="status">{storageMessage}</p>}

      {filters.section === 'recent' && historyMessage && <p role="status">{historyMessage}</p>}
      <Results>
        <p role="status" aria-live="polite">
          {visibleStations.length} of {searchedStations.length} stations
          {searchedStations.length !== collectionCount && ` · ${collectionCount} in collection`}
        </p>
        {filters.section === 'recent' && recentIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearHistory();
              document.getElementById('recent-collection')?.focus({ preventScroll: true });
            }}
          >
            Clear history
          </button>
        )}
      </Results>
      {searchedStations.length === 0 && (
        <EmptyState
          emptyFavorites={filters.section === 'favorites' && favoriteCount === 0}
          emptyRecent={filters.section === 'recent' && recentCount === 0}
          onClear={browsing.clearRefinements}
          onBrowse={browsing.resetFilters}
        />
      )}
      <StationGrid aria-label="Stations">
        {visibleStations.map((station) => (
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
      {visibleStations.length < searchedStations.length && (
        <More
          type="button"
          onClick={() => {
            nextPageFocus.current = searchedStations[visibleStations.length].id;
            browsing.updateFilters({ page: filters.page + 1 });
          }}
        >
          Show more stations ({searchedStations.length - visibleStations.length} remaining)
        </More>
      )}
    </PageWrapper>
  );
}
