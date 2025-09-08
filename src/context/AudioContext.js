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

  // 🔁 Main playback function
  const playStation = async (station, index) => {
    if (!station || !station.url || index === currentStationIndex) return;

    console.log("[playStation] Switching to:", station.name);

    try {
      audioRef.current.pause(); // Ensure stream stops before switching
      audioRef.current.src = station.url;
      await audioRef.current.play();

      setIsPlaying(true);
      setCurrentStationIndex(index);
      updateMediaSession(station);
    } catch (err) {
      console.warn("[playStation] Autoplay failed:", err.message);
      setIsPlaying(false);
    }
  };

  // ▶️ Toggle play/pause
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

  // 📻 Manual set station
  const setStation = (station) => {
    const index = stations.findIndex(s => s.name === station.name);
    if (index !== -1) {
      playStation(station, index);
    }
  };

  // ⏭️ Next/Previous
  const nextStation = () => {
    const nextIndex = (currentStationIndex + 1) % stations.length;
    console.log("→ nextStation:", stations[nextIndex].name);
    playStation(stations[nextIndex], nextIndex);
  };

  const prevStation = () => {
    const prevIndex = (currentStationIndex - 1 + stations.length) % stations.length;
    console.log("← prevStation:", stations[prevIndex].name);
    playStation(stations[prevIndex], prevIndex);
  };

  // 🧠 Media Session
  const updateMediaSession = (station) => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: station.name,
      artist: "Online Radio",
      album: "Live Stream",
      artwork: [{ src: station.logo, sizes: "512x512", type: "image/png" }],
    });
  };

  // 📱 Register media button controls
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

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      console.log("[MediaSession] Next track");
      nextStation();
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      console.log("[MediaSession] Previous track");
      prevStation();
    });
  }, []);

  // 🔁 Update volume/mute on change
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