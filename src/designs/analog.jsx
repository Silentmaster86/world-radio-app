import { useHero, PlayGlyph } from './shared';
export { Navigation } from './shared';
import './analog.css';
export const palette = {
  light: {
    background: '#ece7da',
    surface: '#faf5e9',
    raised: '#e5ddc9',
    text: '#302c21',
    muted: '#68604e',
    accent: '#76522b',
    onAccent: '#ffffff',
    secondary: '#496135',
    line: '#c5bda8',
    border: '#96876d',
    atmosphere: '#d8cdb5',
    horizon: '#e2dcc5',
  },
  dark: {
    background: '#211e19',
    surface: '#343027',
    raised: '#423c2f',
    text: '#f5ecd4',
    muted: '#c4b99c',
    accent: '#e3bd7b',
    onAccent: '#332718',
    secondary: '#b1cb8e',
    line: '#6e624b',
    border: '#a79775',
    atmosphere: '#3b3122',
    horizon: '#272f21',
  },
};
export function Hero() {
  const { t, title, currentStation, status, togglePlay, wantsToPlay } = useHero();
  return (
    <section className="design-hero analog-cabinet" data-playing={status === 'playing'}>
      <div className="receiver-face">
        <p className="design-kicker">World Radio · {title(12)}</p>
        <div className="receiver-display">
          <small>PRESET</small>
          <h2>{currentStation.name}</h2>
          <p>
            {t(
              `station.${status === 'idle' ? 'selected' : status === 'error' ? 'unavailable' : status}`,
            )}
          </p>
        </div>
        <div className="receiver-tuner" aria-hidden="true">
          <i />
        </div>
        <div className="receiver-controls">
          <div className="reel" aria-hidden="true" />
          <div className="reel" aria-hidden="true" />
          <button
            className="receiver-power"
            onClick={togglePlay}
            aria-label={t(wantsToPlay ? 'player.pause' : 'player.play')}
          >
            <PlayGlyph paused={wantsToPlay} />
          </button>
        </div>
      </div>
      <div className="speaker-grille" aria-hidden="true" />
    </section>
  );
}
