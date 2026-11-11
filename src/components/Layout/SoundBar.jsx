import { useLayoutEffect, useRef } from 'react';
import { FaCarSide } from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';
import { usePlayerNavigation } from '../../context/BrowsingContext';
import PlayerControls from '../Player/PlayerControls';
import PlayerStatus from '../Player/PlayerStatus';
import SleepTimer from '../Player/SleepTimer';
import InstallApp from '../Pwa/InstallApp';
import UpdateNotice from '../Pwa/UpdateNotice';
import StationLogo from '../StationLogo';
import SignalBars from '../Player/SignalBars';
import { useLanguage } from '../../context/LanguageContext';

export default function SoundBar({ onHeightChange }) {
  const ref = useRef(null);
  const measureRef = useRef(() => {});
  const { currentStation, status } = useAudio();
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
    <aside className="soundbar" data-state={status} ref={ref} aria-label={t('player.radio')}>
      <div className="soundbar-content">
        <div className="soundbar-info">
          <StationLogo station={currentStation} size={48} loading="eager" />
          <div>
            <h2>{currentStation.name}</h2>
            <p>
              <SignalBars playing={status === 'playing'} /> {t('player.selected')}
            </p>
          </div>
        </div>
        <PlayerControls compact mobileMini />
        <button
          className="soundbar-open"
          id="open-player"
          type="button"
          onClick={openPlayer}
          aria-label={t('player.openCar')}
        >
          <FaCarSide aria-hidden="true" />
        </button>
        <InstallApp />
        <div className="soundbar-status">
          <div className="soundbar-status-line">
            <PlayerStatus />
            <SleepTimer />
          </div>
          <UpdateNotice />
        </div>
      </div>
    </aside>
  );
}
