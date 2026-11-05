import { act } from 'react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { render } from '../test/render';

const first = { name: 'Capital Dance', url: 'https://example.com/first' };
const second = { name: 'Heart UK', url: 'https://example.com/second' };
function Harness() {
  const { favorites, toggleFavorite, storageMessage } = useFavorites();
  return <>
    <output>{JSON.stringify(favorites.map((station) => station.name))}</output>
    <p role="status">{storageMessage}</p>
    <button id="first" onClick={() => toggleFavorite(first)}>First</button>
    <button id="second" onClick={() => toggleFavorite(second)}>Second</button>
  </>;
}
const mount = () => render(<FavoritesProvider><Harness /></FavoritesProvider>);
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test.each(['{', '{}', 'null', '[null]', '[{}]'])('keeps rendering after invalid favorites: %s', (raw) => {
  localStorage.setItem('favorites', raw);
  const page = mount();
  expect(page.container.querySelector('output').textContent).toBe('[]');
  expect(page.container.querySelector('[role=status]').textContent).toContain('could not be read');
  page.click('#first');
  expect(JSON.parse(localStorage.getItem('favorites'))).toEqual([first]);
});

test('retains favorites across remounts and supports removal', () => {
  const page = mount();
  page.click('#first');
  page.unmount();
  const reloaded = mount();
  expect(reloaded.container.querySelector('output').textContent).toBe('["Capital Dance"]');
  reloaded.click('#first');
  expect(JSON.parse(localStorage.getItem('favorites'))).toEqual([]);
});

test('does not lose updates batched in the same render', () => {
  const page = mount();
  act(() => {
    page.container.querySelector('#first').click();
    page.container.querySelector('#second').click();
  });
  expect(JSON.parse(localStorage.getItem('favorites'))).toEqual([first, second]);
});

test('keeps working in memory when saving is blocked', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Full'); });
  const page = mount();
  page.click('#first');
  expect(page.container.querySelector('output').textContent).toBe('["Capital Dance"]');
  expect(page.container.querySelector('[role=status]').textContent).toContain('session only');
});

test('can start with blocked storage reads', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  const page = mount();
  expect(page.container.querySelector('output').textContent).toBe('[]');
  expect(page.container.querySelector('[role=status]').textContent).toContain('session only');
});
