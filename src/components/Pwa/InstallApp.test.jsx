import { ThemeProvider } from 'styled-components';
import InstallApp from './InstallApp';
import { darkTheme } from '../../darkTheme';
import { render } from '../../test/render';
let mockPwa;
jest.mock('../../context/PwaContext', () => ({ usePwa: () => mockPwa }));
beforeEach(() => { mockPwa = { installed: false, ios: false, status: 'ready', offlineReady: true, check: jest.fn() }; });
const mount = () => render(<ThemeProvider theme={darkTheme}><InstallApp /></ThemeProvider>);
test('manual installation help is a labelled dialog and returns focus to its opener', () => {
  const page = mount(); page.click('[aria-label="Install app"]');
  expect(page.container.querySelector('dialog').hasAttribute('open')).toBe(true);
  expect(page.container.textContent).toContain('Live radio needs an internet connection');
  const close = [...page.container.querySelectorAll('button')].find((button) => button.textContent === 'Close');
  page.click('dialog footer button:last-child');
  expect(page.container.querySelector('dialog').hasAttribute('open')).toBe(false);
  expect(document.activeElement.getAttribute('aria-label')).toBe('Install app');
  expect(close).not.toBeNull();
});
test('Safari help appears for iOS and the install button disappears in installed mode', () => {
  mockPwa.ios = true; const page = mount(); page.click('[aria-label="Install app"]');
  expect(page.container.textContent).toContain('Tap Share, then Add to Home Screen');
  mockPwa.installed = true; page.rerender(<ThemeProvider theme={darkTheme}><InstallApp /></ThemeProvider>);
  expect(page.container.querySelector('button')).toBeNull();
});
