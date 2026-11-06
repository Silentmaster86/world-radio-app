import { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaHome, FaCarSide } from 'react-icons/fa';
import { usePlayerNavigation } from '../context/BrowsingContext';
import { useAudio } from '../context/AudioContext';
import { getCountryFlag, getCountryName } from '../lib/stationUtils';
import PlayerStatus from '../components/Player/PlayerStatus';
import PlayerControls from '../components/Player/PlayerControls';
import SleepTimer from '../components/Player/SleepTimer';
import StationLogo from '../components/StationLogo';

const Wrapper = styled.main`
  min-height: 100dvh;
  padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
    max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
  display: grid;
  place-items: center;
`;
const PlayerCard = styled.section`
  width: min(100%, 480px);
  padding: 1.25rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.surface || theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.muted};
  display: grid;
  gap: 1.25rem;
  justify-items: center;
  grid-template-areas: 'top' 'art' 'details' 'controls' 'description';
  > [data-area='controls'] {
    grid-area: controls;
    min-width: 0;
    width: 100%;
  }
  @media (min-width: 520px) and (max-height: 600px) {
    width: min(100%, 960px);
    padding: 0.75rem;
    gap: 0.5rem 1rem;
    grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1.3fr);
    grid-template-areas: 'top top' 'art details' 'art controls';
    > [data-area='description'] {
      display: none;
    }
  }
`;
const TopBar = styled.div`
  grid-area: top;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;
const HomeButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid currentColor;
  display: grid;
  place-items: center;
  background: transparent;
  cursor: pointer;
`;
const CarBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 700;
`;
const LogoWrapper = styled.div`
  grid-area: art;
  align-self: center;
  img {
    display: block;
    width: 168px;
    height: 168px;
    max-width: 100%;
    border-radius: 1rem;
    object-fit: contain;
  }
  @media (min-width: 520px) and (max-height: 600px) {
    img {
      width: clamp(96px, 35dvh, 168px);
      height: clamp(96px, 35dvh, 168px);
    }
  }
`;
const Details = styled.div`
  grid-area: details;
  text-align: center;
  min-width: 0;
  h1 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 2rem);
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  p {
    color: ${({ theme }) => theme.colors.muted};
    font-size: 0.875rem;
    margin: 0.25rem 0;
  }
`;
const Description = styled.p`
  grid-area: description;
  font-size: 0.875rem;
  line-height: 1.5;
  text-align: center;
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;
export default function NowPlaying() {
  const { returnToStations } = usePlayerNavigation();
  const { currentStation } = useAudio();
  const heading = useRef(null);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, []);
  return (
    <Wrapper>
      <PlayerCard aria-label="Car mode player">
        <TopBar>
          <HomeButton type="button" onClick={returnToStations} aria-label="Back to stations">
            <FaHome aria-hidden="true" />
          </HomeButton>
          <SleepTimer compact />
          <CarBadge>
            <FaCarSide aria-hidden="true" /> Car Mode
          </CarBadge>
        </TopBar>
        <LogoWrapper>
          <StationLogo station={currentStation} size={168} loading="eager" />
        </LogoWrapper>
        <Details>
          <h1 ref={heading} tabIndex={-1}>
            {currentStation.name}
          </h1>
          <p>
            <span role="img" aria-label={getCountryName(currentStation.countryCode)}>
              {getCountryFlag(currentStation.countryCode)}
            </span>{' '}
            · {currentStation.genres.join(', ')}
          </p>
          <PlayerStatus />
        </Details>
        <div data-area="controls">
          <PlayerControls variant="car" />
        </div>
        <Description data-area="description">{currentStation.description}</Description>
      </PlayerCard>
    </Wrapper>
  );
}
