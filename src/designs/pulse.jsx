import { HeroCopy, useHero, PlayGlyph } from './shared';
export { Navigation } from './shared';
import './pulse.css';
export const palette = {
  light: {
    background: '#f7f0fc',
    surface: '#ffffff',
    raised: '#eee3f6',
    text: '#321849',
    muted: '#70597e',
    accent: '#7432b9',
    onAccent: '#ffffff',
    secondary: '#7432b9',
    line: '#d9c8e5',
    border: '#9875ae',
    atmosphere: '#ead4f6',
    horizon: '#f9dbe6',
  },
  dark: {
    background: '#1b1028',
    surface: '#301c43',
    raised: '#402650',
    text: '#fbf2ff',
    muted: '#d0b9e1',
    accent: '#e0b5ff',
    onAccent: '#34154c',
    secondary: '#e0b5ff',
    line: '#604274',
    border: '#a07bb6',
    atmosphere: '#3d1953',
    horizon: '#3e162b',
  },
};
export function Hero() {
  const { t, title, status, togglePlay, wantsToPlay } = useHero();
  return (
    <section className="design-hero pulse-hero" data-playing={status === 'playing'}>
      <HeroCopy title={title(11)} t={t} />
      <div className="pulse-art">
        <i />
        <i />
        <i />
        <button onClick={togglePlay} aria-label={t(wantsToPlay ? 'player.pause' : 'player.play')}>
          <PlayGlyph paused={wantsToPlay} />
        </button>
      </div>
    </section>
  );
}
