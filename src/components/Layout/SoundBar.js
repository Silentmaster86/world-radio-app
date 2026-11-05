import { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaCarSide } from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';
import { usePlayerNavigation } from '../../context/BrowsingContext';
import PlayerControls from '../Player/PlayerControls';
import PlayerStatus from '../Player/PlayerStatus';

const Dock = styled.aside`
  position: fixed; z-index: 20; inset: auto 0 0;
  padding: 0.75rem max(1rem, env(safe-area-inset-right)) calc(0.75rem + env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  background: ${({ theme }) => theme.colors.surface || theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.muted};
  box-shadow: 0 -4px 24px #0002;
`;
const Content = styled.div`
  max-width: 1200px; margin: auto;
  display: grid; grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center; gap: 0.6rem 1rem;
  @media (max-width: 640px) { gap: 0.5rem; }
`;
const Info = styled.div`
  display: flex; align-items: center; gap: 0.75rem; min-width: 0;
  img { width: 48px; height: 48px; flex-shrink: 0; border-radius: 0.65rem; }
  h2 { font-size: 1rem; margin: 0; overflow-wrap: anywhere; }
  p { color: ${({ theme }) => theme.colors.muted}; font-size: 0.8rem; margin: 0.2rem 0 0; }
  @media (max-width: 360px) { img { display: none; } }
`;
const StatusRow = styled.div`grid-column: 1 / -1;`;
const OpenButton = styled.button`
  display: grid; place-items: center;
  width: 44px; height: 44px; border: 1px solid currentColor; border-radius: 50%;
  background: transparent; cursor: pointer;
`;

export default function SoundBar({ onHeightChange }) {
  const ref = useRef(null);
  const { currentStation } = useAudio();
  const { openPlayer } = usePlayerNavigation();
  useLayoutEffect(() => {
    const measure = () => onHeightChange(Math.ceil(ref.current?.getBoundingClientRect().height || 176));
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (ref.current) observer?.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [onHeightChange]);
  if (!currentStation) return null;
  return <Dock ref={ref} aria-label='Radio player'>
    <Content>
      <Info><img src={currentStation.logo} width='48' height='48' alt='' /><div><h2>{currentStation.name}</h2><p>Selected station</p></div></Info>
      <PlayerControls compact mobileMini />
      <OpenButton id='open-player' type='button' onClick={openPlayer} aria-label='Open car mode'><FaCarSide aria-hidden='true' /></OpenButton>
      <StatusRow><PlayerStatus /></StatusRow>
    </Content>
  </Dock>;
}
