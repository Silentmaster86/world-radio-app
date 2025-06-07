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
  padding: ${({ theme }) => theme.spacing.sm};
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.danger});
  background-size: 200% 200%;
  animation: gradientX 10s ease infinite;
  color: ${({ theme }) => theme.colors.text};

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
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StationName = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: bold;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
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
