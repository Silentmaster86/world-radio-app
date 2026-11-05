import { act } from 'react';
import { ThemeProviderToggle, THEME_KEY, useTheme } from './ThemeContext';
import { render } from '../test/render';
function View() {
  const { mode, setThemeMode, theme, storageMessage } = useTheme();
  return <><output data-mode={mode}>{theme.colors.mode}</output><button onClick={() => setThemeMode('light')}>Light</button><button onClick={() => setThemeMode('system')}>System</button><p>{storageMessage}</p></>;
}
const mount = () => render(<ThemeProviderToggle><View /></ThemeProviderToggle>);
let query, listeners, original;
beforeEach(() => {
  localStorage.clear(); listeners = new Set(); original = window.matchMedia;
  query = { matches: true, addEventListener: jest.fn((name, fn) => listeners.add(fn)), removeEventListener: jest.fn((name, fn) => listeners.delete(fn)) };
  window.matchMedia = jest.fn(() => query);
});
afterEach(() => { window.matchMedia = original; jest.restoreAllMocks(); });
test('system appearance follows OS changes, explicit mode detaches the listener and survives reload', () => {
  let page = mount();
  expect(page.container.querySelector('output').textContent).toBe('dark');
  act(() => { query.matches = false; for (const fn of listeners) fn(); });
  expect(page.container.querySelector('output').textContent).toBe('light');
  page.click('button');
  expect(listeners.size).toBe(0);
  expect(JSON.parse(localStorage.getItem(THEME_KEY))).toEqual({ version: 1, mode: 'light' });
  page.unmount(); query.matches = true; page = mount();
  expect(page.container.querySelector('output').dataset.mode).toBe('light');
  expect(page.container.querySelector('output').textContent).toBe('light');
  act(() => page.container.querySelectorAll('button')[1].click());
  expect(page.container.querySelector('output').textContent).toBe('dark');
  page.unmount(); expect(listeners.size).toBe(0);
});
test('blocked storage keeps appearance controls functional', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  const page = mount(); page.click('button');
  expect(page.container.querySelector('output').textContent).toBe('light');
  expect(page.container.textContent).toContain('this session');
});
test('invalid preferences fall back and newer schemas are never overwritten', () => {
  localStorage.setItem(THEME_KEY, '{');
  let page = mount(); expect(page.container.querySelector('output').dataset.mode).toBe('system'); page.unmount();
  const future = JSON.stringify({ version: 9, mode: 'future' });
  localStorage.setItem(THEME_KEY, future);
  page = mount(); page.click('button');
  expect(page.container.querySelector('output').textContent).toBe('light');
  expect(localStorage.getItem(THEME_KEY)).toBe(future);
});
