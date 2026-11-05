import { act } from 'react';
import { PwaProvider } from './PwaContext';
import UpdateNotice from '../components/Pwa/UpdateNotice';
import { ThemeProvider } from 'styled-components';
import { darkTheme } from '../darkTheme';
import { render } from '../test/render';
let mockNotify;
const mockState = { updateAvailable: true, updateId: 1, installed: false };
jest.mock('../lib/pwaManager', () => ({
  isStandalone: () => false, isIOS: () => false, isMacSafari: () => false,
  createPwaManager: () => ({ getSnapshot: () => mockState, subscribe: (fn) => { mockNotify = fn; return () => {}; }, start() {}, dispose() {} }),
}));
const view = (label) => <ThemeProvider theme={darkTheme}><PwaProvider><p>{label}</p><UpdateNotice /></PwaProvider></ThemeProvider>;
test('Later stays dismissed across view changes and a subsequent release is announced', () => {
  const page = render(view('Catalog'));
  expect(page.container.textContent).toContain('Update ready');
  page.click('button');
  expect(page.container.textContent).not.toContain('Update ready');
  page.rerender(view('Player'));
  expect(page.container.textContent).not.toContain('Update ready');
  act(() => mockNotify({ ...mockState, updateId: 2 }));
  expect(page.container.textContent).toContain('Update ready');
});
