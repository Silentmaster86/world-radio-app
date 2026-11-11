import { createContext, useContext, useRef, useState } from 'react';
import { stations as curated } from '../data/stations';
import {
  ADDED_LIMIT,
  loadAddedStations,
  normalizeDirectoryStation,
  saveAddedStations,
} from '../lib/addedStations';
const StationsContext = createContext({ stations: curated, catalog: curated });
export const useStations = () => useContext(StationsContext);
export function StationsProvider({ children }) {
  const [initial] = useState(loadAddedStations);
  const catalog = useRef(null);
  if (!catalog.current)
    catalog.current = [
      ...curated,
      ...initial.stations.filter((s) => !curated.some((c) => c.url === s.url)),
    ];
  const [stations, setStations] = useState(catalog.current.slice());
  const [storageIssue, setStorageIssue] = useState(!initial.canPersist);
  function addStation(row) {
    const station = normalizeDirectoryStation(row);
    if (!station) return null;
    const existing = catalog.current.find((s) => s.id === station.id || s.url === station.url);
    if (existing) return existing;
    if (catalog.current.length - curated.length >= ADDED_LIMIT) return null;
    catalog.current.push(station);
    const added = catalog.current.filter((s) => s.directoryId);
    setStorageIssue(!initial.canPersist || !saveAddedStations(added));
    setStations(catalog.current.slice());
    return station;
  }
  return (
    <StationsContext.Provider
      value={{
        stations,
        catalog: catalog.current,
        addStation,
        storageIssue,
        removeStation: (id) => {
          const index = catalog.current.findIndex((s) => s.id === id && s.directoryId);
          if (index < 0) return false;
          const remaining = catalog.current.filter((s) => s.directoryId && s.id !== id);
          if (!initial.canPersist || !saveAddedStations(remaining)) {
            setStorageIssue(true);
            return false;
          }
          catalog.current.splice(index, 1);
          setStations(catalog.current.slice());
          setStorageIssue(false);
          return true;
        },
        restoreStations: (added) => {
          for (const station of added)
            if (!catalog.current.some((s) => s.id === station.id || s.url === station.url))
              catalog.current.push(station);
          setStations(catalog.current.slice());
          setStorageIssue(false);
        },
      }}
    >
      {children}
    </StationsContext.Provider>
  );
}
