import { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaCarSide } from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';
import { usePlayerNavigation } from '../../context/BrowsingContext';
import PlayerControls from '../Player/PlayerControls';
import PlayerStatus from '../Player/PlayerStatus';
import SleepTimer from '../Player/SleepTimer';
import InstallApp from '../Pwa/InstallApp';
import UpdateNotice from '../Pwa/UpdateNotice';
import StationLogo from '../StationLogo';
import { useLanguage } from '../../context/LanguageContext';

const Dock = styled.aside`
  position: fixed;
  z-index: 20;
  inset: auto 0 0;
  padding: 0.75rem max(1rem, env(safe-area-inset-right)) calc(0.75rem + env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
  background: ${({ theme }) => theme.colors.surface || theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.muted};
  box-shadow: 0 -4px 24px #0002;
  @media (max-width: 640px) {
    padding-top: 0.375rem;
    padding-bottom: calc(0.375rem + env(safe-area-inset-bottom));
  }
`;
const Content = styled.div`
  max-width: 1200px;
  margin: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 0.6rem 1rem;
  @media (max-width: 640px) {
    gap: 0.25rem 0.5rem;
  }
`;
const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  > [data-station-logo] {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 0.65rem;
  }
  h2 {
    font-size: 1rem;
    margin: 0;
    overflow-wrap: anywhere;
  }
  p {
    color: ${({ theme }) => theme.colors.muted};
    font-size: 0.8rem;
    margin: 0.2rem 0 0;
  }
  @media (max-width: 360px) {
    > [data-station-logo] {
      display: none;
    }
  }
`;
const StatusRow = styled.div`
  grid-column: 1 / -1;
`;
const StatusLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
const OpenButton = styled.button`
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
`;

export default function SoundBar({ onHeightChange }) {
  const ref = useRef(null);
  const measureRef = useRef(() => {});
  const { currentStation } = useAudio();
  const { t } = useLanguage();
  const { openPlayer } = usePlayerNavigation();
  useLayoutEffect(() => {
    const previous = document.documentElement.style.getPropertyValue('--radio-player-height');
    const measure = () => {
      const height = Math.ceil(ref.current?.getBoundingClientRect().height || 176);
      document.documentElement.style.setProperty('--radio-player-height', `${height}px`);
      onHeightChange(height);
    };
    measureRef.current = measure;
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (ref.current) observer?.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      if (previous) document.documentElement.style.setProperty('--radio-player-height', previous);
      else document.documentElement.style.removeProperty('--radio-player-height');
    };
  }, [onHeightChange]);
  // Also measure content changes in browsers without ResizeObserver.
  useLayoutEffect(() => {
    measureRef.current();
  });
  if (!currentStation) return null;
  return (
    <Dock ref={ref} aria-label={t('player.radio')}>
      <Content>
        <Info>
          <StationLogo station={currentStation} size={48} loading="eager" />
          <div>
            <h2>{currentStation.name}</h2>
            <p>{t('player.selected')}</p>
          </div>
        </Info>
        <PlayerControls compact mobileMini />
        <OpenButton id="open-player" type="button" onClick={openPlayer} aria-label={t('player.openCar')}>
          <FaCarSide aria-hidden="true" />
        </OpenButton>
        <InstallApp />
        <StatusRow>
          <StatusLine>
            <PlayerStatus />
            <SleepTimer />
          </StatusLine>
          <UpdateNotice />
        </StatusRow>
      </Content>
    </Dock>
  );
}
