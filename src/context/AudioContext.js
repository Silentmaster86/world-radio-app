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

  // ▶️ Play / Pause
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("[togglePlay] Autoplay failed:", err.message);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // 🔊 Volume
  const changeVolume = (vol) => {
    setVolume(vol);
    audioRef.current.volume = vol;
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  // 📻 Station switching
  const setStation = async (station) => {
    const index = stations.findIndex(
      (s) => s.name.toLowerCase() === station.name.toLowerCase()
    );
    if (index === -1 || index === currentStationIndex) return;

    setCurrentStationIndex(index);
    audioRef.current.src = station.url;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("[setStation] Autoplay blocked:", err.message);
      setIsPlaying(false);
    }
  };

  const nextStation = () => {
    const nextIndex = (currentStationIndex + 1) % stations.length;
    setStation(stations[nextIndex]);
  };

  const prevStation = () => {
    const prevIndex = (currentStationIndex - 1 + stations.length) % stations.length;
    setStation(stations[prevIndex]);
  };

  // ✅ Update metadata when station changes
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const station = stations[currentStationIndex];
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: station.name,
      artist: "Online Radio",
      album: "Live Stream",
      artwork: [
        { src: station.logo, sizes: "512x512", type: "image/png" },
      ],
    });
  }, [currentStationIndex]);

  // ✅ Set handlers once
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler("nexttrack", nextStation);
    navigator.mediaSession.setActionHandler("previoustrack", prevStation);
  }, []); // only once on mount

  // Volume + preload
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
