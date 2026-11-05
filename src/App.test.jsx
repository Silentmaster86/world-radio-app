import { act } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from 'styled-components';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AudioProvider } from './context/AudioContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProviderToggle, useTheme } from './context/ThemeContext';
import { stations } from './data/stations';
import { FAVORITES_KEY } from './lib/favoritesStorage';
import { render } from './test/render';
import { FakeAudio } from './test/FakeAudio';

function ThemedApp() {
  const { theme } = useTheme();
  return <ThemeProvider theme={theme}><App /></ThemeProvider>;
}

function mount() {
  return render(<ErrorBoundary><FavoritesProvider><AudioProvider>
    <ThemeProviderToggle><MotionConfig reducedMotion="never" transition={{ duration: 0 }}><ThemedApp /></MotionConfig></ThemeProviderToggle>
  </AudioProvider></FavoritesProvider></ErrorBoundary>);
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  jest.spyOn(window, 'Audio').mockImplementation(() => new FakeAudio());
});
afterEach(() => jest.restoreAllMocks());

test('the full app migrates old favorites and plays current catalog data', async () => {
  localStorage.setItem('favorites', '[{"name":"Heart UK","url":"https://old.example/removed"}]');
  const page = mount();
  expect(page.container.querySelectorAll('h3').length).toBe(9);
  expect(page.container.querySelector('[aria-label="Remove Heart UK from favorites"]').textContent).toBe('♥');
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toEqual(['heart-uk']);
  const favoriteFilter = [...page.container.querySelectorAll('button')].find((item) => item.textContent === 'Favorites');
  act(() => favoriteFilter.click());
  expect([...page.container.querySelectorAll('h3')].map((item) => item.textContent)).toEqual(['Heart UK']);
  await act(async () => page.container.querySelector('[aria-label="Play Heart UK"]').click());
  expect(page.container.querySelector('h2').textContent).toBe('Heart UK');
  expect(window.Audio.mock.results[0].value.src).toBe(stations.find((station) => station.id === 'heart-uk').url);
  expect(window.Audio).toHaveBeenCalledTimes(1);
});

test('the full app uses US data for Chicago and keeps a usable catalog after invalid storage', () => {
  localStorage.setItem('favorites', '{');
  const page = mount();
  expect(page.container.querySelector('h1').textContent).toContain('World Radio App');
  expect(page.container.querySelectorAll('h3').length).toBe(9);
  const us = [...page.container.querySelectorAll('button')].find((item) => item.textContent === 'US');
  act(() => us.click());
  expect([...page.container.querySelectorAll('h3')].map((item) => item.textContent)).toEqual(['PR Chicago']);
  expect(page.container.querySelector('[aria-label="United States"]')).not.toBeNull();
  expect(page.container.querySelector('[role=alert]')).toBeNull();
});

test('the rendered player reports a failed start, retries and returns to paused', async () => {
  const page = mount();
  const audio = window.Audio.mock.results[0].value;
  expect(page.container.querySelector('[data-player-status]').textContent).toContain('Ready to play');
  audio.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  await act(async () => page.container.querySelector('[aria-label="Play"]').click());
  expect(page.container.querySelector('[data-player-status]').getAttribute('data-player-status')).toBe('error');
  expect(page.container.textContent).toContain('Playback was blocked');
  await act(async () => page.container.querySelector('[aria-label="Retry current station"]').click());
  expect(page.container.querySelector('[data-player-status]').getAttribute('data-player-status')).toBe('playing');
  page.click('[aria-label="Pause"]');
  expect(page.container.querySelector('[data-player-status]').textContent).toBe('Paused');
});
