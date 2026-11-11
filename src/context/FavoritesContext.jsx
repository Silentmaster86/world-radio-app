import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStations } from './StationsContext';
import { loadFavorites, saveFavorites, SESSION_ONLY_MESSAGE } from '../lib/favoritesStorage';

const FavoritesContext = createContext();
export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { stations } = useStations();
  const [saved] = useState(loadFavorites);
  const [favoriteIds, setFavoriteIds] = useState(saved.favoriteIds);
  const [dirty, setDirty] = useState(false);
  const [storageMessage, setStorageMessage] = useState(saved.message);
  const legacyPending = useRef(saved.removeLegacyAfterSave);

  useEffect(() => {
    if ((!dirty && !saved.shouldMigrate) || !saved.canPersist) return;
    const persisted = saveFavorites(favoriteIds, legacyPending.current);
    if (persisted) legacyPending.current = false;
    setStorageMessage(persisted ? saved.preservedMessage : SESSION_ONLY_MESSAGE);
  }, [favoriteIds, dirty, saved]);

  const toggleFavorite = (id) => {
    if (!stations.some((station) => station.id === id)) return;
    setFavoriteIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
    setDirty(true);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        moveFavorite: (id, offset) => {
          if (offset !== -1 && offset !== 1) return;
          setFavoriteIds((previous) => {
            const visible = previous.filter((key) => stations.some((s) => s.id === key));
            const from = visible.indexOf(id),
              to = from + offset;
            if (from < 0 || to < 0 || to >= visible.length) return previous;
            const next = previous.slice(),
              a = next.indexOf(id),
              b = next.indexOf(visible[to]);
            [next[a], next[b]] = [next[b], next[a]];
            return next;
          });
          setDirty(true);
        },
        restoreFavorites: (ids) => {
          setFavoriteIds(ids);
          setDirty(false);
          setStorageMessage('');
        },
        isFavorite: (id) => favoriteIds.includes(id),
        toggleFavorite,
        storageMessage,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
