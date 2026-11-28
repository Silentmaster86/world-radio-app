import { HeroCopy, useHero } from './shared';
export { Navigation } from './shared';
import './signal.css';
export const palette = {
  light: {
    background: '#f2f3e9',
    surface: '#ffffff',
    raised: '#e5e9d9',
    text: '#22291c',
    muted: '#56604c',
    accent: '#375c00',
    onAccent: '#ffffff',
    secondary: '#375c00',
    line: '#8c987e',
    border: '#58654a',
    atmosphere: '#e1e9be',
    horizon: '#e8e9da',
  },
  dark: {
    background: '#151a11',
    surface: '#222b1b',
    raised: '#2d3823',
    text: '#f1f6e5',
    muted: '#c2cdb2',
    accent: '#c5f264',
    onAccent: '#24310c',
    secondary: '#c5f264',
    line: '#70805d',
    border: '#8e9e79',
    atmosphere: '#2e3b14',
    horizon: '#202819',
  },
};
export function Hero() {
  const { t, title, status } = useHero();
  return (
    <section className="design-hero signal-hero" data-playing={status === 'playing'}>
      <span className="signal-index" aria-hidden="true">
        01 /
      </span>
      <HeroCopy title={title(13)} t={t} />
      <div className="signal-wave" aria-hidden="true">
        {[35, 65, 100, 50, 80, 40, 90, 60, 100, 45].map((height, index) => (
          <i key={index} style={{ height: `${height}%`, animationDelay: `${index * -0.12}s` }} />
        ))}
      </div>
    </section>
  );
}
