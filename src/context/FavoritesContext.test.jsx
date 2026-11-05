import { act } from 'react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { render } from '../test/render';
import { FAVORITES_KEY } from '../lib/favoritesStorage';

function Harness() {
  const { favoriteIds, toggleFavorite, storageMessage } = useFavorites();
  return <>
    <output>{JSON.stringify(favoriteIds)}</output>
    <p role="status">{storageMessage}</p>
    <button id="first" onClick={() => toggleFavorite('capital-dance')}>First</button>
    <button id="second" onClick={() => toggleFavorite('heart-uk')}>Second</button>
  </>;
}
const mount = () => render(<FavoritesProvider><Harness /></FavoritesProvider>);
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test.each(['{', '{}', 'null', '[null]', '[{}]'])('keeps rendering after invalid favorites: %s', (raw) => {
  localStorage.setItem('favorites', raw);
  const page = mount();
  expect(page.container.querySelector('output').textContent).toBe('[]');
  expect(page.container.querySelector('[role=status]').textContent).toContain('could not be');
  page.click('#first');
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY))).toEqual({ version: 1, stationIds: ['capital-dance'] });
});

test('retains favorites across remounts and supports removal', () => {
  const page = mount();
  page.click('#first');
  page.unmount();
  const reloaded = mount();
  expect(reloaded.container.querySelector('output').textContent).toBe('["capital-dance"]');
  reloaded.click('#first');
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY))).toEqual({ version: 1, stationIds: [] });
});

test('does not lose updates batched in the same render', () => {
  const page = mount();
  act(() => {
    page.container.querySelector('#first').click();
    page.container.querySelector('#second').click();
  });
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY))).toEqual({ version: 1, stationIds: ['capital-dance', 'heart-uk'] });
});

test('keeps working in memory when saving is blocked', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
  const page = mount();
  page.click('#first');
  expect(page.container.querySelector('output').textContent).toBe('["capital-dance"]');
  expect(page.container.querySelector('[role=status]').textContent).toContain('session only');
});

test('can start with blocked storage reads', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  const page = mount();
  expect(page.container.querySelector('output').textContent).toBe('[]');
  expect(page.container.querySelector('[role=status]').textContent).toContain('session only');
});

test('migrates a legacy library after mounting and removes it only after saving', () => {
  localStorage.setItem('favorites', '[{"name":"Capital Dance"},{"name":"Heart UK"},{"name":"Capital Dance"}]');
  const page = mount();
  expect(page.container.querySelector('output').textContent).toBe('["capital-dance","heart-uk"]');
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toEqual(['capital-dance', 'heart-uk']);
  expect(localStorage.getItem('favorites')).toBeNull();
});

test('a failed migration preserves the old data and can retry on the next change', () => {
  const raw = '[{"name":"Capital Dance"}]';
  localStorage.setItem('favorites', raw);
  const blocked = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
  const page = mount();
  expect(localStorage.getItem('favorites')).toBe(raw);
  expect(page.container.querySelector('output').textContent).toBe('["capital-dance"]');
  blocked.mockRestore();
  page.click('#second');
  expect(localStorage.getItem('favorites')).toBeNull();
  expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)).stationIds).toEqual(['capital-dance', 'heart-uk']);
});

test('changes remain in memory rather than overwriting a future schema', () => {
  const raw = '{"version":2,"stationIds":["heart-uk"]}';
  localStorage.setItem(FAVORITES_KEY, raw);
  const page = mount();
  page.click('#first');
  expect(page.container.querySelector('output').textContent).toBe('["capital-dance"]');
  expect(localStorage.getItem(FAVORITES_KEY)).toBe(raw);
});

test('does not delete a later legacy backup after the one-time migration', () => {
  localStorage.setItem('favorites', '[{"name":"Capital Dance"}]');
  const page = mount();
  const laterBackup = '[{"name":"Unavailable station"}]';
  localStorage.setItem('favorites', laterBackup);
  page.click('#second');
  expect(localStorage.getItem('favorites')).toBe(laterBackup);
});
