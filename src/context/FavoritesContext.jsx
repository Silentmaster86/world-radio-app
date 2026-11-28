import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStations } from './StationsContext';
import {
  loadFavorites,
  saveFavorites,
  FAVORITES_KEY,
  SESSION_ONLY_MESSAGE,
} from '../lib/favoritesStorage';
import { libraryTransaction } from '../lib/libraryTransaction';

const FavoritesContext = createContext();
export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { stations } = useStations();
  const [saved] = useState(loadFavorites);
  const [snapshot, setSnapshot] = useState(saved);
  const current = useRef(saved);
  const pending = useRef([]);
  const legacyPending = useRef(saved.removeLegacyAfterSave);
  const alive = useRef(true);
  const publish = (next) => {
    current.current = next;
    if (alive.current) setSnapshot(next);
  };
  function update(operation) {
    return libraryTransaction(() => {
      pending.current.push(operation);
      const latest = loadFavorites();
      const ids = pending.current.reduce((value, change) => change(value), latest.favoriteIds);
      const persisted =
        saved.canPersist && latest.canPersist && saveFavorites(ids, legacyPending.current);
      if (persisted) {
        pending.current = [];
        legacyPending.current = false;
      }
      publish({
        ...latest,
        favoriteIds: ids,
        message: persisted
          ? latest.preservedMessage
          : latest.canPersist
            ? SESSION_ONLY_MESSAGE
            : latest.message,
      });
      return persisted;
    });
  }
  useEffect(() => {
    alive.current = true;
    if (saved.shouldMigrate) update((ids) => ids);
    const sync = (event) => {
      if (event.key !== FAVORITES_KEY && event.key !== null) return;
      const latest = loadFavorites();
      publish({
        ...latest,
        favoriteIds: pending.current.reduce((ids, change) => change(ids), latest.favoriteIds),
      });
    };
    window.addEventListener('storage', sync);
    return () => {
      alive.current = false;
      window.removeEventListener('storage', sync);
    };
    // The provider's initial migration and storage subscription have one lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);
  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds: snapshot.favoriteIds,
        readFavorites: () =>
          pending.current.reduce((ids, change) => change(ids), loadFavorites().favoriteIds),
        storageMessage: snapshot.message,
        isFavorite: (id) => snapshot.favoriteIds.includes(id),
        toggleFavorite: (id) => {
          if (!stations.some((station) => station.id === id)) return;
          const include = !current.current.favoriteIds.includes(id);
          const change = (ids) =>
            include ? [...new Set([...ids, id])] : ids.filter((key) => key !== id);
          current.current = {
            ...current.current,
            favoriteIds: change(current.current.favoriteIds),
          };
          return update(change);
        },
        moveFavorite: (id, offset) => {
          if (offset !== -1 && offset !== 1) return;
          return update((ids) => {
            const visible = ids.filter((key) => stations.some((station) => station.id === key));
            const from = visible.indexOf(id),
              to = from + offset;
            if (from < 0 || to < 0 || to >= visible.length) return ids;
            const next = ids.slice(),
              a = next.indexOf(id),
              b = next.indexOf(visible[to]);
            [next[a], next[b]] = [next[b], next[a]];
            return next;
          });
        },
        restoreFavorites: (ids) => {
          pending.current = [];
          publish({ ...current.current, favoriteIds: ids, message: '' });
        },
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
