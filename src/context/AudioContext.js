// src/context/AudioContext.js
import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { stations } from "../data/stations";

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio(stations[0].url));
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Play/Pause logic
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Volume and mute logic
  const changeVolume = (vol) => {
    setVolume(vol);
    audioRef.current.volume = vol;
  };

  const toggleMute = () => {
    setMuted(!muted);
    audioRef.current.muted = !muted;
  };

  // Station change logic
  const setStation = (station) => {
    const index = stations.findIndex((s) => s.name === station.name);
    if (index !== -1) {
      setCurrentStationIndex(index);
      audioRef.current.src = station.url;
      audioRef.current.play();
      setIsPlaying(true);
      updateMediaSession(station);
    }
  };

  const nextStation = () => {
    const nextIndex = (currentStationIndex + 1) % stations.length;
    setStation(stations[nextIndex]);
  };

  const prevStation = () => {
    const prevIndex =
      (currentStationIndex - 1 + stations.length) % stations.length;
    setStation(stations[prevIndex]);
  };

  // Media Session API
  const updateMediaSession = (station) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: station.name,
        artist: "Online Radio",
        album: "Live Stream",
        artwork: [{ src: station.logo, sizes: "512x512", type: "image/png" }],
      });

      navigator.mediaSession.setActionHandler("play", togglePlay);
      navigator.mediaSession.setActionHandler("pause", togglePlay);
      navigator.mediaSession.setActionHandler("nexttrack", nextStation);
      navigator.mediaSession.setActionHandler("previoustrack", prevStation);
    }
  };

  // Auto-update audio on station or volume change
  useEffect(() => {
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
