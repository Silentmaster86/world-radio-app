import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HomeHeader from '../components/Home/HomeHeader';
import StationCard from '../components/Home/StationCard';
import { LibraryPage } from '../components/Library/LibraryPage';
import ShareStation from '../components/Library/ShareStation';
import { libraryMessage } from '../components/Library/messages';
import { useStations } from '../context/StationsContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { normalizeDirectoryStation } from '../lib/addedStations';
export default function SharedStation() {
  const { id } = useParams(),
    { stations, addStation, storageIssue } = useStations(),
    favorites = useFavorites(),
    audio = useAudio(),
    { language, t: appText } = useLanguage();
  const navigate = useNavigate();
  const t = (key, params) => libraryMessage(language, key, params);
  const saved = stations.find((s) => s.id === id),
    [lookup, setLookup] = useState(null),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0);
  const uuid = /^rb-([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/.exec(id || '')?.[1];
  useEffect(() => {
    setLookup(null);
    setError('');
    if (saved || !uuid) return undefined;
    const abort = new AbortController();
    let active = true;
    const timeout = setTimeout(() => abort.abort(), 15000);
    fetch(`/.netlify/functions/radio-directory?id=${uuid}`, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw Error('error');
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const row = Array.isArray(data.rows)
          ? data.rows.find((row) => String(row?.stationuuid || '').toLowerCase() === uuid)
          : null;
        const station = normalizeDirectoryStation(row);
        if (!station) {
          setError('missing');
          return;
        }
        setLookup({ row, station });
      })
      .catch(() => {
        if (active) setError('error');
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      abort.abort();
    };
  }, [id, uuid, saved, retry]);
  const station = saved || lookup?.station;
  return (
    <LibraryPage>
      <HomeHeader back />
      <h1>{t('sharedTitle')}</h1>
      {saved ? (
        <>
          <p>{t('saved')}</p>
          {storageIssue && <p role="status">{appText('discover.storage')}</p>}
          <StationCard
            station={saved}
            isSelected={audio.selectedStationId === saved.id}
            isActive={audio.playingStationId === saved.id && audio.status === 'playing'}
            playbackStatus={audio.selectedStationId === saved.id ? audio.status : undefined}
            isFavorite={favorites.isFavorite(saved.id)}
            onPlay={() => audio.selectStation(saved.id)}
            onFavorite={() => favorites.toggleFavorite(saved.id)}
          />
        </>
      ) : station ? (
        <section className="station-detail">
          <h2>{station.name}</h2>
          <p>
            {station.countryCode} · {station.genres.join(', ')}
          </p>
          <p>{t('notice')}</p>
          <button
            type="button"
            data-add-shared
            onClick={() => {
              const added = addStation(lookup.row);
              if (!added) setError('addFailed');
              else if (added.id !== id) navigate('/station/' + added.id, { replace: true });
            }}
          >
            {t('add')}
          </button>
        </section>
      ) : error || !uuid ? (
        <p role="alert">{t(error || 'missing')}</p>
      ) : (
        <p role="status">{t('loading')}</p>
      )}
      {station && <ShareStation station={station} />}
      {station && error && <p role="alert">{t(error)}</p>}
      {error === 'error' && (
        <button type="button" onClick={() => setRetry((n) => n + 1)}>
          {t('retry')}
        </button>
      )}
    </LibraryPage>
  );
}
