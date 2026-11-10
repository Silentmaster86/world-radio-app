import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const persist = useCallback((recentIds) => {
    const previous = latest.current;
    const next = {
      ...previous,
      recentIds,
      message: !previous.canPersist
        ? previous.message
        : saveRecent(recentIds)
          ? ''
          : RECENT_SESSION_MESSAGE,
    };
    latest.current = next;
    setHistory(next);
  }, []);
  const remember = useCallback(
    (id) => {
      if (!stations.some((station) => station.id === id)) return;
      const previous = latest.current;
      const ids = prependRecent(previous.recentIds, id);
      if (
        !previous.message &&
        ids.length === previous.recentIds.length &&
        ids.every((item, index) => item === previous.recentIds[index])
      )
        return;
      persist(ids);
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
      const next = loadRecent();
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
        historyMessage: history.message,
        clearHistory: () => persist([]),
      }}
    >
      {children}
    </RecentStationsContext.Provider>
  );
}
