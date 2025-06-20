// src/context/AudioContext.js
import { createContext, useContext, useRef, useState, useEffect } from "react";
import { stations } from "../data/stations";

const AudioContext = createContext();
export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio(stations[0].url));
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const playStation = (station, index) => {
    audioRef.current.src = station.url;
    audioRef.current.play().then(() => {
      setCurrentStationIndex(index);
      setIsPlaying(true);
      updateMediaSession(station);
    }).catch((err) => {
      console.warn("[playStation] Playback error:", err.message);
      setIsPlaying(false);
    });
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("[togglePlay] Autoplay error:", err.message);
      });
    }
  };

  const changeVolume = (vol) => {
    setVolume(vol);
    audioRef.current.volume = vol;
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const setStation = (station) => {
    const index = stations.findIndex(s => s.name === station.name);
    if (index !== -1) {
      playStation(station, index);
    }
  };

  const nextStation = () => {
    const nextIndex = (currentStationIndex + 1) % stations.length;
    playStation(stations[nextIndex], nextIndex);
  };

  const prevStation = () => {
    const prevIndex = (currentStationIndex - 1 + stations.length) % stations.length;
    playStation(stations[prevIndex], prevIndex);
  };

  const updateMediaSession = (station) => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: station.name,
      artist: "Online Radio",
      album: "Live Stream",
      artwork: [{ src: station.logo, sizes: "512x512", type: "image/png" }],
    });
  };

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current.play().then(() => setIsPlaying(true));
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler("nexttrack", nextStation);
    navigator.mediaSession.setActionHandler("previoustrack", prevStation);
  }, []);

  useEffect(() => {
    audioRef.current.preload = "none";
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  return (
    <AudioContext.Provider
      value={{
        audio: audioRef.current,
        currentStation: stations[currentStationIndex],
        setStation,
        togglePlay,
        nextStation,
        prevStation,
        isPlaying,
        volume,
        changeVolume,
        muted,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
