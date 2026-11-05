import { createContext, useContext, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

const FavoritesContext = createContext();
export const useFavorites = () => useContext(FavoritesContext);

function isFavorites(value) {
  return Array.isArray(value) && value.every((station) => (
    station && typeof station.name === 'string' && station.name.length > 0
  ));
}

export const FavoritesProvider = ({ children }) => {
  const [saved] = useState(() => readStorage('favorites', [], isFavorites));
  const [favorites, setFavorites] = useState(saved.value);
  const [dirty, setDirty] = useState(false);
  const [storageMessage, setStorageMessage] = useState(() => {
    if (saved.status === 'unavailable') return 'Favorites are available for this session only.';
    if (saved.status === 'invalid') return 'Saved favorites could not be read. You can continue listening.';
    return '';
  });

  useEffect(() => {
    if (!dirty) return;
    const persisted = writeStorage('favorites', favorites);
    setStorageMessage(persisted ? '' : 'Favorites are available for this session only. Changes could not be saved.');
  }, [favorites, dirty]);

  const toggleFavorite = (station) => {
    setFavorites((previous) => previous.some((item) => item.name === station.name)
      ? previous.filter((item) => item.name !== station.name)
      : [...previous, station]);
    setDirty(true);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, storageMessage }}>
      {children}
    </FavoritesContext.Provider>
  );
};
