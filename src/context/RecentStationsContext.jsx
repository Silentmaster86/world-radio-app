import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { libraryTransaction } from '../lib/libraryTransaction';
import { useAudio } from './AudioContext';
import { useStations } from './StationsContext';
import {
  loadRecent,
  saveRecent,
  prependRecent,
  RECENT_KEY,
  RECENT_SESSION_MESSAGE,
} from '../lib/recentStorage';

const RecentStationsContext = createContext();
export const useRecentStations = () => useContext(RecentStationsContext);

export function RecentStationsProvider({ children }) {
  const { catalog: stations } = useStations();
  const { status, wantsToPlay, playingStationId } = useAudio();
  const [history, setHistory] = useState(loadRecent);
  const latest = useRef(history);
  const recorded = useRef(null);
  const pending = useRef([]);
  const readRecent = () =>
    pending.current.reduce((ids, change) => change(ids), loadRecent().recentIds);
  const persist = useCallback(
    (change) =>
      libraryTransaction(() => {
        pending.current.push(change);
        const previous = loadRecent();
        const recentIds = pending.current.reduce(
          (ids, operation) => operation(ids),
          previous.recentIds,
        );
        const saved = previous.canPersist && saveRecent(recentIds);
        if (saved) pending.current = [];
        const next = {
          ...previous,
          recentIds,
          message: saved ? '' : previous.message || RECENT_SESSION_MESSAGE,
        };
        latest.current = next;
        setHistory(next);
      }),
    [],
  );
  const remember = useCallback(
    (id) => {
      if (stations.some((station) => station.id === id)) persist((ids) => prependRecent(ids, id));
    },
    [persist, stations],
  );

  useEffect(() => {
    if (!wantsToPlay) {
      recorded.current = null;
      return;
    }
    if (status !== 'playing' || !playingStationId || recorded.current === playingStationId) return;
    recorded.current = playingStationId;
    remember(playingStationId);
  }, [status, wantsToPlay, playingStationId, remember]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== RECENT_KEY && event.key !== null) return;
      const loaded = loadRecent();
      const next = {
        ...loaded,
        recentIds: pending.current.reduce((ids, change) => change(ids), loaded.recentIds),
      };
      latest.current = next;
      setHistory(next);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return (
    <RecentStationsContext.Provider
      value={{
        recentIds: history.recentIds,
        readRecent,
        restoreRecent: (recentIds) => {
          pending.current = [];
          const next = { ...latest.current, recentIds, message: '' };
          latest.current = next;
          setHistory(next);
        },
        historyMessage: history.message,
        clearHistory: () => persist(() => []),
      }}
    >
      {children}
    </RecentStationsContext.Provider>
  );
}
