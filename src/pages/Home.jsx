import { DesignSlot } from '../context/DesignContext';
import { Link } from 'react-router-dom';
// src/pages/Home.js
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
    <main className="home-page">
      <HomeHeader />
      <DesignSlot part="Hero">
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
      </DesignSlot>

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
      <div className="station-results">
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
      </div>
      {searchedStations.length === 0 && (
        <EmptyState
          emptyFavorites={filters.section === 'favorites' && favoriteCount === 0}
          emptyRecent={filters.section === 'recent' && recentCount === 0}
          onClear={browsing.clearRefinements}
          onBrowse={browsing.resetFilters}
        />
      )}
      <section className="station-grid" aria-label="Stations">
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
      </section>
      <p>
        <Link className="discovery-link" to="/discover">
          {t('discover.title')}
        </Link>
      </p>
      {visibleStations.length < searchedStations.length && (
        <button
          className="station-more"
          type="button"
          onClick={() => {
            nextPageFocus.current = searchedStations[visibleStations.length].id;
            browsing.updateFilters({ page: filters.page + 1 });
          }}
        >
          {t('home.more', { count: searchedStations.length - visibleStations.length })}
        </button>
      )}
    </main>
  );
}
