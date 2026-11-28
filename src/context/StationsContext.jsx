import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { stations as curated } from '../data/stations';
import {
  ADDED_KEY,
  ADDED_LIMIT,
  loadAddedStations,
  normalizeDirectoryStation,
  saveAddedStations,
} from '../lib/addedStations';
import { libraryTransaction } from '../lib/libraryTransaction';
const StationsContext = createContext({ stations: curated, catalog: curated });
export const useStations = () => useContext(StationsContext);
const combine = (...lists) => {
  const result = [];
  for (const station of lists.flat())
    if (!result.some((other) => other.id === station.id || other.url === station.url))
      result.push(station);
  return result;
};
export function StationsProvider({ children }) {
  const [initial] = useState(loadAddedStations);
  const catalog = useRef(null);
  const unsaved = useRef([]);
  if (!catalog.current) catalog.current = combine(curated, initial.stations);
  const [stations, setStations] = useState(catalog.current.slice());
  const [storageIssue, setStorageIssue] = useState(!initial.canPersist);
  function replace(added) {
    catalog.current.splice(0, catalog.current.length, ...combine(curated, added));
    setStations(catalog.current.slice());
  }
  useEffect(() => {
    const sync = (event) => {
      if (event.key !== ADDED_KEY && event.key !== null) return;
      const latest = loadAddedStations();
      replace(combine(latest.stations, unsaved.current));
      setStorageIssue(!latest.canPersist || unsaved.current.length > 0);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function addStation(row) {
    const station = normalizeDirectoryStation(row);
    if (!station) return null;
    return libraryTransaction(() => {
      const latest = loadAddedStations();
      const added = combine(latest.stations, unsaved.current);
      const existing = combine(curated, added).find(
        (item) => item.id === station.id || item.url === station.url,
      );
      if (existing) {
        replace(added);
        return existing;
      }
      if (added.length >= ADDED_LIMIT) return null;
      added.push(station);
      const persisted = initial.canPersist && latest.canPersist && saveAddedStations(added);
      if (persisted) unsaved.current = [];
      else unsaved.current = combine(unsaved.current, [station]);
      setStorageIssue(!persisted);
      replace(added);
      return station;
    });
  }
  return (
    <StationsContext.Provider
      value={{
        stations,
        catalog: catalog.current,
        readCatalog: () => combine(curated, loadAddedStations().stations, unsaved.current),
        addStation,
        storageIssue,
        removeStation: (id) =>
          libraryTransaction(() => {
            const latest = loadAddedStations();
            const added = combine(latest.stations, unsaved.current);
            if (!added.some((station) => station.id === id)) return false;
            const remaining = added.filter((station) => station.id !== id);
            if (!initial.canPersist || !latest.canPersist || !saveAddedStations(remaining)) {
              setStorageIssue(true);
              return false;
            }
            unsaved.current = [];
            replace(remaining);
            setStorageIssue(false);
            return true;
          }),
        restoreStations: (added) => {
          unsaved.current = [];
          replace(added);
          setStorageIssue(false);
        },
      }}
    >
      {children}
    </StationsContext.Provider>
  );
}
