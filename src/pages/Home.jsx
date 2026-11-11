import { Link } from 'react-router-dom';
// src/pages/Home.js
import styled from 'styled-components';
import { useLayoutEffect, useRef } from 'react';

import { useStations } from '../context/StationsContext';
import { useAudio } from '../context/AudioContext';
import { useFavorites } from '../context/FavoritesContext';
import { useRecentStations } from '../context/RecentStationsContext';

import HomeHeader from '../components/Home/HomeHeader';
import { useBrowseRestoration } from '../context/BrowsingContext';
import StationControls from '../components/Home/StationControls';
import StationCard from '../components/Home/StationCard';
import EmptyState from '../components/Home/EmptyState';

import useStationFilters from '../hooks/useStationFilters';
import { useLanguage } from '../context/LanguageContext';
import { localizeStoredMessage } from '../i18n';

const DiscoveryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
`;
const PageWrapper = styled.main`
  width: 100%;
  max-width: 1240px;
  margin: auto;
  min-height: auto;

  padding: 1rem;
  padding-bottom: 1rem;

  background: transparent;

  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 640px) {
    padding: 0.85rem;
    padding-bottom: 0.75rem;
  }
`;

const StationGrid = styled.section`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
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
  const { stations } = useStations();
  useBrowseRestoration();
  const { setStation, currentStation, playingStationId, status } = useAudio();
  const { t } = useLanguage();
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
    <PageWrapper className="home-page">
      <HomeHeader />
      <section className="library-hero" data-playing={status === 'playing'}>
        <div>
          <p className="hero-eyebrow">{t('library.eyebrow')}</p>
          <h2>{t('library.title')}</h2>
          <p>{t('library.description')}</p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit">
            <i />
            <i />
            <i />
          </div>
          <div className="hero-globe">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <StationControls
        {...browsing}
        total={stations.length}
        favoriteCount={favoriteCount}
        recentCount={recentCount}
      />

      {storageMessage && <p role="status">{localizeStoredMessage(t, storageMessage)}</p>}

      {filters.section === 'recent' && historyMessage && (
        <p role="status">{localizeStoredMessage(t, historyMessage)}</p>
      )}
      <Results>
        <p role="status" aria-live="polite">
          {t('home.results', { visible: visibleStations.length, total: searchedStations.length })}
          {searchedStations.length !== collectionCount &&
            ` · ${t('home.collection', { count: collectionCount })}`}
        </p>
        {filters.section === 'recent' && recentIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearHistory();
              document.getElementById('recent-collection')?.focus({ preventScroll: true });
            }}
          >
            {t('home.clearHistory')}
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
      <StationGrid className="station-grid" aria-label="Stations">
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
      <p>
        <DiscoveryLink to="/discover">{t('discover.title')}</DiscoveryLink>
      </p>
      {visibleStations.length < searchedStations.length && (
        <More
          type="button"
          onClick={() => {
            nextPageFocus.current = searchedStations[visibleStations.length].id;
            browsing.updateFilters({ page: filters.page + 1 });
          }}
        >
          {t('home.more', { count: searchedStations.length - visibleStations.length })}
        </More>
      )}
    </PageWrapper>
  );
}
