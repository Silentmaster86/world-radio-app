// src/components/Layout/SoundBar.js
import React from "react";
import styled from "styled-components";
import { useAudio } from "../../context/AudioContext";
import { stations } from "../../data/stations";
import {
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaStepForward,
  FaStepBackward
} from "react-icons/fa";

const Bar = styled.div`
  position: fixed;
  bottom: 0;
  width: 100%;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm};
  z-index: 50;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: 0.5rem;

  @media(min-width: 640px) {
    margin-bottom: 0;
  }
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  justify-content: center;
`;

const VolumeSlider = styled.input`
  width: 100px;
`;

const StationSelect = styled.select`
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.4rem 0.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: none;
`;

export default function SoundBar() {
  const {
    currentStation,
    togglePlay,
    nextStation,
    prevStation,
    isPlaying,
    volume,
    changeVolume,
    muted,
    toggleMute,
    setStation,
  } = useAudio();

  return (
    <Bar>
      <Info>
        <Logo src={currentStation.logo} alt={currentStation.name} />
        <div>
          <div style={{ fontWeight: "bold" }}>{currentStation.name}</div>
          <div style={{ fontSize: "0.8rem", color: "#ccc" }}>Live Radio</div>
        </div>
      </Info>

      <Controls>
        <button onClick={prevStation} title="Previous">
          <FaStepBackward />
        </button>

        <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button onClick={nextStation} title="Next">
          <FaStepForward />
        </button>

        <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
          {muted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>

        <VolumeSlider
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
        />

        <StationSelect
          value={currentStation.name}
          onChange={(e) => {
            const selected = stations.find((s) => s.name === e.target.value);
            setStation(selected);
          }}
        >
          {stations.map((station, i) => (
            <option key={i} value={station.name}>
              {station.name}
            </option>
          ))}
        </StationSelect>
      </Controls>
    </Bar>
  );
}
