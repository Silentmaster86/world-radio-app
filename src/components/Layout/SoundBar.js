// src/components/Layout/SoundBar.js
import styled from "styled-components";
import { useAudio } from "../../context/AudioContext";
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
  left: 0.8rem;
  right: 0.8rem;
  bottom: 5rem;
  width: 98%;
  margin-right: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm};
  z-index: 10;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: 0 6px 15px rgb(88, 70, 70);
  
  @media(max-width: 1440px) {
    bottom: 2.3rem;
  }

  @media(max-width: 1024px) {
    width: 97.2%;
  }
  
  @media(max-width: 768px) {
    width: 96.2%;
    bottom: 2.3rem;
  }

  @media(max-width: 425px) {
    width: 93.2%;
    bottom: 1rem;
  }

  @media(max-width: 375px) {
    width: 92.5%;
    bottom: 1rem;
  }

  @media(max-width: 320px) {
    width: 91%;
    bottom: 0.5rem;
  }

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
  height: 4px;
  appearance: none;
  background: #444;
  border-radius: 9999px;
  outline: none;
  margin: 0 0.5rem;
  transition: background 0.3s ease;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: ${({ theme }) => theme.colors.accent};
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }
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
        <button onClick={prevStation} title="Previous" aria-label="Previous Station">
          <FaStepBackward />
        </button>

        <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"} aria-label="Toggle Play">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button onClick={nextStation} title="Next" aria-label="Next Station">
          <FaStepForward />
        </button>

        <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"} aria-label="Toggle Mute">
          {muted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>

        <VolumeSlider
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
          aria-label="Volume Control"
        />

      </Controls>
    </Bar>
  );
}
