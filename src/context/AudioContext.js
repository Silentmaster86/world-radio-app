import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { stations } from '../data/stations';
import { createAudioPlayer, createInitialPlayerState } from '../lib/audioPlayer';

const AudioContext = createContext();
export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const playerRef = useRef(null);
  const [snapshot, setSnapshot] = useState(() => createInitialPlayerState(stations));

  useEffect(() => {
    const player = createAudioPlayer({ stations, initialOnline: navigator.onLine });
    playerRef.current = player;
    const session = navigator.mediaSession;
    let lastStationId;
    const sync = (next) => {
      setSnapshot(next);
      const station = player.getStation();
      if (session && next.wantsToPlay && station?.id !== lastStationId && typeof window.MediaMetadata === 'function') {
        try {
          session.metadata = new window.MediaMetadata({ title: station.name, artist: 'Online Radio', album: 'Live Stream', artwork: [{ src: station.logo }] });
          lastStationId = station.id;
        } catch { /* Optional system metadata must not break audio. */ }
      }
    };
    const unsubscribe = player.subscribe(sync);
    sync(player.getSnapshot());
    const handlers = { play: player.play, pause: player.pause, nexttrack: player.nextStation, previoustrack: player.prevStation };
    const installed = [];
    if (session) {
      Object.entries(handlers).forEach(([name, handler]) => {
        try { session.setActionHandler(name, handler); installed.push(name); } catch { /* Unsupported action. */ }
      });
    }
    const online = () => player.setOnline(true);
    const offline = () => player.setOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      unsubscribe();
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      installed.forEach((name) => { try { session.setActionHandler(name, null); } catch { /* Unsupported action. */ } });
      player.dispose();
      playerRef.current = null;
    };
  }, []);

  const invoke = (name, ...args) => playerRef.current?.[name](...args);
  const currentStation = stations.find((station) => station.id === snapshot.selectedStationId);
  return <AudioContext.Provider value={{
    ...snapshot,
    currentStation,
    playingStation: stations.find((station) => station.id === snapshot.playingStationId) || null,
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
  }}>{children}</AudioContext.Provider>;
}
