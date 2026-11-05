import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from 'styled-components';
import StationCard from './StationCard';
import { stations } from '../../data/stations';
import { darkTheme } from '../../darkTheme';
import { render } from '../../test/render';

const station = stations[0];
const view = (props) => <ThemeProvider theme={darkTheme}><MotionConfig reducedMotion="never" transition={{ duration: 0 }}>
  <StationCard station={station} {...props} />
</MotionConfig></ThemeProvider>;

test('station selection is a native focusable button with an independent favorite action', () => {
  const onPlay = jest.fn();
  const onFavorite = jest.fn();
  const page = render(view({ onPlay, onFavorite, isFavorite: false }));
  const play = page.container.querySelector('[aria-label="Play Capital Dance"]');
  expect(play.tagName).toBe('BUTTON');
  expect(play.tabIndex).toBe(0);
  play.focus();
  expect(document.activeElement).toBe(play);
  page.click('[aria-label="Play Capital Dance"]');
  expect(onPlay).toHaveBeenCalledTimes(1);
  page.click('[aria-label="Add Capital Dance to favorites"]');
  expect(onFavorite).toHaveBeenCalledTimes(1);
  expect(onPlay).toHaveBeenCalledTimes(1);
  expect(page.container.querySelector('button button')).toBeNull();
});

test('favorite state and the selected station are accessible without relying on color', () => {
  const page = render(view({ isFavorite: false, isSelected: true, playbackStatus: 'paused' }));
  expect(page.container.querySelector('[aria-label="Play Capital Dance"]').getAttribute('aria-current')).toBe('true');
  expect(page.container.textContent).toContain('Paused');
  page.rerender(view({ isFavorite: true, isSelected: true, isActive: true, playbackStatus: 'playing' }));
  expect(page.container.querySelector('[aria-label="Remove Capital Dance from favorites"]').getAttribute('aria-pressed')).toBe('true');
  expect(page.container.textContent).toContain('Playing');
});
