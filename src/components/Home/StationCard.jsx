import { FaPlay } from 'react-icons/fa';
import StationLogo from '../StationLogo';
import SignalBars from '../Player/SignalBars';
import { stationHue } from '../../lib/stationVisuals';
import { getCountryFlag, getCountryName } from '../../lib/stationUtils';
import { useLanguage } from '../../context/LanguageContext';

export default function StationCard({
  station,
  isActive,
  isSelected,
  playbackStatus,
  isFavorite,
  onPlay,
  onFavorite,
}) {
  const { t } = useLanguage();
  const status = isActive
    ? t('station.playing')
    : {
        idle: t('station.selected'),
        connecting: t('station.connecting'),
        playing: t('station.playing'),
        buffering: t('station.buffering'),
        paused: t('station.paused'),
        error: t('station.unavailable'),
      }[playbackStatus];
  return (
    <article
      className="station-card"
      data-selected={!!isSelected}
      data-playing={!!isActive}
      style={{ '--station-hue': stationHue(station.id) }}
    >
      <button
        className="station-button"
        type="button"
        onClick={onPlay}
        data-station-id={station.id}
        aria-current={isSelected ? 'true' : undefined}
      >
        <span className="visually-hidden">{t('station.play')} </span>
        <span className="station-artwork" aria-hidden="true">
          <StationLogo station={station} size={96} sizes="(max-width: 640px) 40px, 96px" />
          <span className="station-play-indicator">
            {isActive ? <SignalBars playing /> : <FaPlay />}
          </span>
        </span>
        <span className="station-info">
          <h2 data-station-title>{station.name}</h2>
          <p className="station-meta">
            <span
              role="img"
              aria-label={t(
                `country.${station.countryCode}`,
                {},
                getCountryName(station.countryCode),
              )}
            >
              {getCountryFlag(station.countryCode)}
            </span>{' '}
            · {station.genres.map((genre) => t(`genre.${genre}`, {}, genre)).join(', ')}
          </p>
          {isSelected && <p className="station-meta">{status}</p>}
        </span>
      </button>
      <button
        className="station-favorite"
        type="button"
        onClick={onFavorite}
        aria-label={t(isFavorite ? 'station.removeFavorite' : 'station.addFavorite', {
          station: station.name,
        })}
        aria-pressed={isFavorite}
      >
        <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
      </button>
    </article>
  );
}
