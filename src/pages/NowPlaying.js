import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAudio } from "../context/AudioContext";
import { FaHome, FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: ${({ theme }) => theme.spacing.sm};
  text-align: center;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.danger}
  );
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

const FloatingHomeButton = styled.button`
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.15);
  color: ${({ theme }) => theme.colors.text};
  padding: 0.75rem;
  border: none;
  border-radius: 50%;
  backdrop-filter: blur(5px);
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  animation: bounce 2.5s infinite ease-in-out;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
`;

export default function NowPlaying() {
  const {
    currentStation,
    isPlaying,
    togglePlay,
    nextStation,
    prevStation,
  } = useAudio();

  const navigate = useNavigate();

  if (!currentStation?.name) {
    return (
      <Wrapper>
        <h2>Loading station...</h2>
      </Wrapper>
    );
  }

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

      <FloatingHomeButton onClick={() => navigate("/")}>
        <FaHome size={20} />
      </FloatingHomeButton>
    </Wrapper>
  );
}
