// src/components/Player/PlayerControls.js
import {
  FaPlay,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaStepForward,
  FaStepBackward,
} from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';
import { useLanguage } from '../../context/LanguageContext';

export default function PlayerControls({
  showVolume = true,
  compact = false,
  mobileMini = false,
  variant = 'default',
}) {
  const {
    togglePlay,
    nextStation,
    prevStation,
    wantsToPlay,
    status,
    volume,
    changeVolume,
    muted,
    toggleMute,
    canChangeVolume,
  } = useAudio();
  const { t } = useLanguage();

  return (
    <div
      className="wra-player-controls"
      data-compact={compact}
      data-car={variant === 'car'}
      role="group"
      aria-label={t('player.playback')}
    >
      <div className="player-secondary" data-hide-mobile={mobileMini}>
        <button
          className="player-icon-control"
          type="button"
          data-car={variant === 'car'}
          onClick={prevStation}
          aria-label={t('player.previous')}
        >
          <FaStepBackward aria-hidden="true" />
        </button>
      </div>

      <button
        className="player-icon-control main-play-control"
        data-compact={compact}
        data-car={variant === 'car'}
        type="button"
        onClick={togglePlay}
        aria-label={
          wantsToPlay
            ? status === 'connecting'
              ? t('player.cancel')
              : t('player.pause')
            : t('player.play')
        }
      >
        {wantsToPlay ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
      </button>

      <div className="player-secondary" data-hide-mobile={mobileMini}>
        <button
          className="player-icon-control"
          type="button"
          data-car={variant === 'car'}
          onClick={nextStation}
          aria-label={t('player.next')}
        >
          <FaStepForward aria-hidden="true" />
        </button>
      </div>
      {showVolume && (
        <div
          className="player-volume"
          data-mini={mobileMini}
          role="group"
          aria-label={t('player.volumeControls')}
        >
          <button
            className="player-icon-control"
            type="button"
            onClick={toggleMute}
            aria-label={muted ? t('player.unmute') : t('player.mute')}
            aria-pressed={muted}
          >
            {muted ? <FaVolumeMute aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
          </button>
          {canChangeVolume !== false ? (
            <>
              <input
                className="player-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                aria-label={t('player.volume')}
                aria-valuetext={`${Math.round(volume * 100)}%`}
                onChange={(event) => changeVolume(Number(event.target.value))}
              />
              <span aria-hidden="true">{Math.round(volume * 100)}%</span>
            </>
          ) : (
            <small>{t('player.useDevice')}</small>
          )}
        </div>
      )}
    </div>
  );
}
