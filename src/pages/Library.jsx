import { useLayoutEffect, useRef, useState } from 'react';
import HomeHeader from '../components/Home/HomeHeader';
import { LibraryPage } from '../components/Library/LibraryPage';
import ShareStation from '../components/Library/ShareStation';
import { libraryMessage } from '../components/Library/messages';
import { useStations } from '../context/StationsContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeStoredMessage } from '../i18n';
export default function Library() {
  const { stations } = useStations(),
    favorites = useFavorites(),
    audio = useAudio(),
    { language, t: appText } = useLanguage();
  const [removing, setRemoving] = useState(null),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [shareId, setShareId] = useState(audio.selectedStationId);
  const focus = useRef(null),
    list = useRef(null),
    heading = useRef(null),
    confirm = useRef(null);
  const t = (key, params) => libraryMessage(language, key, params);
  const visible = favorites.favoriteIds
      .map((id) => stations.find((s) => s.id === id))
      .filter(Boolean),
    added = stations.filter((s) => s.directoryId);
  useLayoutEffect(() => {
    if (focus.current) {
      list.current?.querySelector(`[data-favorite-heading="${focus.current}"]`)?.focus();
      focus.current = null;
    }
  }, [favorites.favoriteIds]);
  useLayoutEffect(() => {
    if (removing) confirm.current?.focus();
  }, [removing]);
  const selected = stations.find((s) => s.id === shareId) || stations[0];
  return (
    <LibraryPage>
      <HomeHeader back />
      <h1 ref={heading} tabIndex={-1}>
        {t('title')}
      </h1>
      <p>{t('intro')}</p>
      {message && <p role="status">{t(message)}</p>}
      {error && <p role="alert">{t(error)}</p>}
      {favorites.storageMessage && (
        <p role="status">{localizeStoredMessage(appText, favorites.storageMessage)}</p>
      )}
      <h2>{t('favorites')}</h2>
      {!visible.length && <p>{t('emptyFavorites')}</p>}
      <ul ref={list} data-favorite-order>
        {visible.map((station, index) => (
          <li key={station.id} data-favorite-row={station.id}>
            <h3 tabIndex={-1} data-favorite-heading={station.id}>
              {t('position', { name: station.name, position: index + 1, total: visible.length })}
            </h3>
            <div className="actions">
              <button
                type="button"
                data-move-up={station.id}
                disabled={index === 0}
                aria-label={t('up', { name: station.name })}
                onClick={() => {
                  focus.current = station.id;
                  favorites.moveFavorite(station.id, -1);
                  setMessage('moved');
                }}
              >
                ↑
              </button>
              <button
                type="button"
                data-move-down={station.id}
                disabled={index === visible.length - 1}
                aria-label={t('down', { name: station.name })}
                onClick={() => {
                  focus.current = station.id;
                  favorites.moveFavorite(station.id, 1);
                  setMessage('moved');
                }}
              >
                ↓
              </button>
              <ShareStation station={station} />
            </div>
          </li>
        ))}
      </ul>
      <h2>{t('added')}</h2>
      {!added.length && <p>{t('emptyAdded')}</p>}
      <ul data-added-library>
        {added.map((station) => (
          <li key={station.id} data-added-row={station.id}>
            <h3>{station.name}</h3>
            <div className="actions">
              <ShareStation station={station} />
              <button
                type="button"
                data-remove-station={station.id}
                onClick={() => {
                  setRemoving(station.id);
                  setError('');
                  setMessage('');
                }}
              >
                {t('remove', { name: station.name })}
              </button>
            </div>
            {removing === station.id && (
              <div
                className="confirmation"
                role="group"
                aria-label={t('confirm', { name: station.name })}
              >
                <p ref={confirm} tabIndex={-1}>
                  {t('confirm', { name: station.name })}
                </p>
                <p>{t('removeHint')}</p>
                <div className="actions">
                  <button
                    type="button"
                    data-confirm-remove
                    onClick={() => {
                      if (audio.removeStation(station.id)) {
                        setRemoving(null);
                        setMessage('removed');
                        setError('');
                        heading.current?.focus();
                      } else setError('failed');
                    }}
                  >
                    {t('yes')}
                  </button>
                  <button
                    type="button"
                    data-cancel-remove
                    onClick={() => {
                      setRemoving(null);
                      document.querySelector(`[data-remove-station="${station.id}"]`)?.focus();
                    }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <h2>{t('shareAny')}</h2>
      <label>
        {t('choose')}
        <select value={selected?.id || ''} onChange={(e) => setShareId(e.target.value)}>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </select>
      </label>
      {selected && <ShareStation key={selected.id} station={selected} />}
    </LibraryPage>
  );
}
