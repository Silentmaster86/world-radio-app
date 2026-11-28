import { HeroCopy, useHero, PlayGlyph } from './shared';
export { Navigation } from './shared';
import './orbit.css';
export const palette = {
  light: {
    background: '#edf2f0',
    surface: '#ffffff',
    raised: '#e4eeea',
    text: '#173a32',
    muted: '#4e685f',
    accent: '#12664d',
    onAccent: '#ffffff',
    secondary: '#12664d',
    line: '#bbcfc5',
    border: '#758e83',
    atmosphere: '#d1e6dc',
    horizon: '#dce8ed',
  },
  dark: {
    background: '#101e1b',
    surface: '#192d27',
    raised: '#223b32',
    text: '#eef8f1',
    muted: '#b3ccbf',
    accent: '#a4e2b9',
    onAccent: '#153520',
    secondary: '#a4e2b9',
    line: '#3f6051',
    border: '#6a907c',
    atmosphere: '#163d2c',
    horizon: '#142f3b',
  },
};
export function Hero() {
  const { t, title, currentStation, status, togglePlay, wantsToPlay } = useHero();
  return (
    <section className="design-hero orbit-scene" data-playing={status === 'playing'}>
      <HeroCopy title={title(10)} t={t} />
      <div className="orbit-field">
        <div className="sphere" aria-hidden="true" />
        <div className="orbital-ring" aria-hidden="true" />
        <button
          className="orbit-center"
          onClick={togglePlay}
          aria-label={t(wantsToPlay ? 'player.pause' : 'player.play')}
        >
          <PlayGlyph paused={wantsToPlay} />
        </button>
        <span className="orbit-caption">{currentStation.name}</span>
      </div>
    </section>
  );
}
