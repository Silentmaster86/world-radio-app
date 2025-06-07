// src/pages/NowPlaying.js
import styled from "styled-components";
import { useAudio } from "../context/AudioContext";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward
} from "react-icons/fa";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 1rem;
  background: linear-gradient(90deg, #9333ea, #ec4899, #ef4444);
  background-size: 200% 200%;
  animation: gradientX 10s ease infinite;
  color: white;

  @keyframes gradientX {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
`;

const StationLogo = styled.img`
  width: 12rem;
  height: 12rem;
  border-radius: 1rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  margin-bottom: 1.5rem;
`;

const StationName = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #cbd5e1;
  margin-bottom: 2rem;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 2rem;
`;

export default function NowPlaying() {
  const {
    currentStation,
    isPlaying,
    togglePlay,
    nextStation,
    prevStation
  } = useAudio();

  return (
    <Wrapper>
      <StationLogo src={currentStation.logo} alt={currentStation.name} />
      <StationName>{currentStation.name}</StationName>
      <Subtitle>Streaming Live</Subtitle>

      <ControlGroup>
        <button onClick={prevStation} title="Previous">
          <FaStepBackward />
        </button>
        <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button onClick={nextStation} title="Next">
          <FaStepForward />
        </button>
      </ControlGroup>
    </Wrapper>
  );
}
