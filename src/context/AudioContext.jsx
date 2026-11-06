import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
import { createAudioPlayer, createInitialPlayerState } from '../lib/audioPlayer';
import { bindMediaSession } from '../lib/mediaSession';
import {
  loadPlayerPreferences,
  savePlayerPreferences,
  PLAYER_SESSION_MESSAGE,
} from '../lib/playerPreferences';

const AudioContext = createContext();
export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const playerRef = useRef(null);
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
      stations,
      initialOnline: navigator.onLine,
      initialStationId: settings.stationId,
      initialVolume: settings.volume,
      initialMuted: settings.muted,
    });
    playerRef.current = player;
    const unsubscribe = player.subscribe(setSnapshot);
    setSnapshot(player.getSnapshot());
    const unbindMediaSession = bindMediaSession(player);
    const online = () => player.setOnline(true);
    const offline = () => player.setOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      unsubscribe();
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      unbindMediaSession();
      player.dispose();
      playerRef.current = null;
    };
  }, [settings]);

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

  const invoke = (name, ...args) => playerRef.current?.[name](...args);
  const currentStation = stations.find((station) => station.id === snapshot.selectedStationId);
  return (
    <AudioContext.Provider
      value={{
        ...snapshot,
        preferenceMessage,
        currentStation,
        playingStation:
          stations.find((station) => station.id === snapshot.playingStationId) || null,
        isPlaying: snapshot.status === 'playing',
        selectStation: (id) => invoke('selectStation', id),
        setStation: (station) => invoke('selectStation', station?.id),
        play: () => invoke('play'),
        pause: () => invoke('pause'),
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
