import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStations } from './StationsContext';
import { createAudioPlayer, createInitialPlayerState } from '../lib/audioPlayer';
import { bindMediaSession } from '../lib/mediaSession';
import { afterLibraryAction } from '../lib/libraryTransaction';
import { createSleepTimer } from '../lib/sleepTimer';
import {
  loadPlayerPreferences,
  savePlayerPreferences,
  PLAYER_SESSION_MESSAGE,
} from '../lib/playerPreferences';

const AudioContext = createContext();
export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const {
    catalog: stations,
    stations: visibleStations,
    removeStation: removeSavedStation,
  } = useStations();
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const [sleepTimerDeadline, setSleepTimerDeadline] = useState(null);
  const [settings] = useState(() => loadPlayerPreferences(stations));
  const [preferenceMessage, setPreferenceMessage] = useState(settings.message);
  const lastSaved = useRef(
    JSON.stringify({
      stationId: settings.stationId,
      volume: settings.volume,
      muted: settings.muted,
    }),
  );
  const [snapshot, setSnapshot] = useState(() =>
    createInitialPlayerState(stations, {
      initialStationId: settings.stationId,
      initialVolume: settings.volume,
      initialMuted: settings.muted,
    }),
  );

  useEffect(() => {
    const player = createAudioPlayer({
      beforeReconnect: () => timerRef.current?.check(),
      stations,
      initialOnline: navigator.onLine,
      initialStationId: settings.stationId,
      initialVolume: settings.volume,
      initialMuted: settings.muted,
    });
    playerRef.current = player;
    const timer = createSleepTimer({ onExpire: () => player.pause() });
    timerRef.current = timer;
    const unsubscribeTimer = timer.subscribe(setSleepTimerDeadline);
    let wantedPlayback = player.getSnapshot().wantsToPlay;
    let wasInterrupted = false;
    const unsubscribe = player.subscribe((state) => {
      if ((wantedPlayback || wasInterrupted) && !state.wantsToPlay && !state.interrupted)
        timer.cancel();
      wantedPlayback = state.wantsToPlay;
      wasInterrupted = state.interrupted;
      setSnapshot(state);
    });
    setSnapshot(player.getSnapshot());
    const unbindMediaSession = bindMediaSession(player);
    const online = () => player.setOnline(true);
    const offline = () => player.setOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('focus', timer.check);
    window.addEventListener('pageshow', timer.check);
    document.addEventListener('visibilitychange', timer.check);
    return () => {
      unsubscribe();
      unsubscribeTimer();
      timer.dispose();
      timerRef.current = null;
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', timer.check);
      window.removeEventListener('pageshow', timer.check);
      document.removeEventListener('visibilitychange', timer.check);
      unbindMediaSession();
      player.dispose();
      playerRef.current = null;
    };
  }, [settings, stations]);

  useEffect(() => {
    if (!settings.canPersist) return;
    const value = {
      stationId: snapshot.selectedStationId,
      volume: snapshot.volume,
      muted: snapshot.muted,
    };
    const serialized = JSON.stringify(value);
    if (serialized === lastSaved.current) return;
    if (savePlayerPreferences(value)) {
      lastSaved.current = serialized;
      setPreferenceMessage('');
    } else {
      setPreferenceMessage(PLAYER_SESSION_MESSAGE);
    }
  }, [settings, snapshot.selectedStationId, snapshot.volume, snapshot.muted]);

  useEffect(() => {
    const player = playerRef.current;
    const selected = player?.getSnapshot().selectedStationId;
    if (selected && !visibleStations.some((station) => station.id === selected)) {
      timerRef.current?.cancel();
      player.forgetStation(selected);
    }
  }, [visibleStations]);

  const invoke = (name, ...args) => playerRef.current?.[name](...args);
  const currentStation =
    stations.find((station) => station.id === snapshot.selectedStationId) || stations[0];
  return (
    <AudioContext.Provider
      value={{
        ...snapshot,
        preferenceMessage,
        currentStation,
        playingStation:
          stations.find((station) => station.id === snapshot.playingStationId) || null,
        isPlaying: snapshot.status === 'playing',
        sleepTimerDeadline,
        setSleepTimer: (minutes) => timerRef.current?.start(minutes),
        cancelSleepTimer: () => timerRef.current?.cancel(),
        removeStation: (id) =>
          afterLibraryAction(removeSavedStation(id), (removed) => {
            if (!removed) return false;
            if (playerRef.current?.getSnapshot().selectedStationId === id)
              timerRef.current?.cancel();
            invoke('forgetStation', id);
            return true;
          }),
        selectStation: (id) => invoke('selectStation', id),
        setStation: (station) => invoke('selectStation', station?.id),
        play: () => invoke('play'),
        pause: () => {
          timerRef.current?.cancel();
          return invoke('pause');
        },
        retry: () => invoke('retry'),
        togglePlay: () => invoke('togglePlay'),
        nextStation: () => invoke('nextStation'),
        prevStation: () => invoke('prevStation'),
        changeVolume: (volume) => invoke('setVolume', volume),
        toggleMute: () => invoke('toggleMute'),
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
