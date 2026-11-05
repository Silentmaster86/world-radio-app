import { ThemeProvider } from 'styled-components';
import StationControls from './StationControls';
import { darkTheme } from '../../darkTheme';
import { defaultFilters, getFilterOptions } from '../../hooks/useStationFilters';
import { stations } from '../../data/stations';
import { render } from '../../test/render';

const view = (filters, updateFilters = jest.fn()) => <ThemeProvider theme={darkTheme}><StationControls filters={{ ...defaultFilters, ...filters }} options={getFilterOptions(stations)} updateFilters={updateFilters} resetFilters={jest.fn()} total={9} favoriteCount={0} /></ThemeProvider>;
test('mobile filter disclosure counts active refinements and preserves selections while collapsed', () => {
  const update = jest.fn();
  const page = render(view({ country: 'GB', genre: 'News', language: 'pl' }, update));
  const button = page.container.querySelector('[aria-controls="station-refinements"]');
  expect(button.textContent.trim()).toBe('Filters (3)');
  expect(button.getAttribute('aria-expanded')).toBe('false');
  page.click('[aria-controls="station-refinements"]');
  expect(button.getAttribute('aria-expanded')).toBe('true');
  page.click('[aria-controls="station-refinements"]');
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(page.container.querySelector('#station-country').value).toBe('GB');
  expect(page.container.querySelector('#station-genre').value).toBe('News');
  expect(page.container.querySelector('#station-language').value).toBe('pl');
  expect(update).not.toHaveBeenCalled();
});
