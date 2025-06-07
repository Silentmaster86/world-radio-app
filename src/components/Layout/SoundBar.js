// src/components/Layout/SoundBar.js
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styled, { keyframes } from "styled-components";
import { useAudio } from "../../context/AudioContext.js";
import { useSoundBarToggle } from "../../context/SounBarContext.js";


const Wrapper = styled.div`
  position: relative;
`;

const ToggleButton = styled.button`
  display: none;
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: #ff4500;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  z-index: 1000;
  cursor: pointer;
`;

const Box = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #1a1a1b;
  border-radius: 8px;
  color: white;
  justify-content: space-between;
  margin-top: 1rem;
`;

const Line = styled(motion.span)`
  background: white;
  height: 1rem;
  width: 3px;
  margin: 0 0.15rem;
  border-radius: 10px;
`;

const Select = styled.select`
  background: #1a1a1b;
  color: white;
  border: 1px solid white;
  padding: 0.3rem;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Volume = styled.input`
  width: 100px;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const marquee = keyframes`
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
`;

const NowPlaying = styled.div`
  overflow: hidden;
  white-space: nowrap;
  width: 220px;
  font-size: 0.9rem;
  position: relative;
  flex: 1;

  @media (max-width: 480px) {
    display: none;
  }

  & span {
    display: inline-block;
    padding-left: 100%;
    animation: ${marquee} 15s linear infinite;
  }
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
`;

const Button = styled.button`
  background-color: #272729;
  color: #fff;
  border: 1px solid #555;
  border-radius: 5px;
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #3c3c3e;
    border-color: #888;
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SoundBar = () => {
  const {
    stations,
    currentStation,
    isPlaying,
    volume,
    isMuted,
    togglePlay,
    changeStation,
    setVolume,
    toggleMute
  } = useAudio();

  const [isOpen, setIsOpen] = useState(true);
  const { visible } = useSoundBarToggle();

  if (!visible) return null;
  if (!currentStation) return null; // guard against null station

  return (
    <Wrapper>
      <ToggleButton onClick={() => setIsOpen((prev) => !prev)}>🎵</ToggleButton>

      <AnimatePresence>
        {isOpen && (
          <Box
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Logo src={currentStation.logo} alt={currentStation.name} />

            <div style={{ display: "flex" }}>
              {[0.1, 0.2, 0.3, 0.4, 0.5].map((delay, i) => (
                <Line
                  key={i}
                  variants={{
                    playing: {
                      scaleY: [1, 2, 1.3, 2.5, 1],
                      transition: { duration: 1, repeat: Infinity }
                    },
                    paused: { scaleY: 1 }
                  }}
                  animate={isPlaying ? "playing" : "paused"}
                  transition={{ delay }}
                />
              ))}
            </div>

            <Button onClick={togglePlay}>
              {isPlaying ? "⏸️ Pause" : "▶️ Play"}
            </Button>

            <Select
              onChange={(e) => {
                const selected = stations.find(
                  (s) => s.url === e.target.value
                );
                changeStation(selected);
              }}
              value={currentStation?.url}
            >
              {stations.map((station, index) => (
                <option key={index} value={station.url}>
                  {station.name}
                </option>
              ))}
            </Select>

            <Volume
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />

            <Button onClick={toggleMute}>
              {isMuted ? "🔇 Unmute" : "🔊 Mute"}
            </Button>

            <NowPlaying>
              <span>
                {isPlaying
                  ? `🎧 Now Playing: ${currentStation.name}`
                  : "⏸️ Paused"}
              </span>
            </NowPlaying>
          </Box>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};


export default SoundBar;
