import { act } from 'react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { LANGUAGE_KEY, loadLanguage, hasLanguage } from '../i18n';
import { render } from '../test/render';

jest.mock('../i18n', () => ({
  ...jest.requireActual('../i18n'),
  hasLanguage: jest.fn(),
  loadLanguage: jest.fn(),
}));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
function View() {
  const { language, setLanguage, pendingLanguage, languageMessage } = useLanguage();
  return (
    <>
      <output>
        {language}:{pendingLanguage}:{languageMessage}
      </output>
      {['en', 'de', 'fr'].map((code) => (
        <button key={code} data-language={code} onClick={() => setLanguage(code)}>
          {code}
        </button>
      ))}
    </>
  );
}
const mount = () =>
  render(
    <LanguageProvider>
      <View />
    </LanguageProvider>,
  );
beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'en';
  hasLanguage.mockImplementation((code) => ['en', 'pl'].includes(code));
  loadLanguage.mockReset();
});
test('language loads atomically; the latest choice wins even when requests complete out of order', async () => {
  const de = deferred(),
    fr = deferred();
  loadLanguage.mockImplementation((code) => (code === 'de' ? de.promise : fr.promise));
  const page = mount();
  page.click('[data-language="de"]');
  page.click('[data-language="fr"]');
  expect(page.container.querySelector('output').textContent).toBe('en:fr:');
  expect(localStorage.getItem(LANGUAGE_KEY)).toBeNull();
  await act(async () => de.resolve());
  expect(document.documentElement.lang).toBe('en');
  await act(async () => fr.resolve());
  expect(document.documentElement.lang).toBe('fr');
  expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY)).language).toBe('fr');
});
test('returning to an already loaded language cancels a pending choice', async () => {
  const request = deferred();
  loadLanguage.mockReturnValue(request.promise);
  const page = mount();
  page.click('[data-language="de"]');
  page.click('[data-language="en"]');
  await act(async () => request.resolve());
  expect(page.container.querySelector('output').textContent).toBe('en::');
  expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY)).language).toBe('en');
});
test('a failed language keeps the active interface and saved preference and can be retried', async () => {
  const first = deferred(),
    retry = deferred();
  loadLanguage.mockReturnValueOnce(first.promise).mockReturnValueOnce(retry.promise);
  const page = mount();
  page.click('[data-language="de"]');
  await act(async () => first.reject(Error('network')));
  expect(page.container.querySelector('output').textContent).toBe('en::language.failed');
  expect(localStorage.getItem(LANGUAGE_KEY)).toBeNull();
  page.click('[data-language="de"]');
  await act(async () => retry.resolve());
  expect(document.documentElement.lang).toBe('de');
});
test('restores a saved new language without rewriting its record', async () => {
  const request = deferred();
  loadLanguage.mockReturnValue(request.promise);
  const saved = JSON.stringify({ version: 1, language: 'uk' });
  localStorage.setItem(LANGUAGE_KEY, saved);
  mount();
  await act(async () => request.resolve());
  expect(document.documentElement.lang).toBe('uk');
  expect(localStorage.getItem(LANGUAGE_KEY)).toBe(saved);
});
test('another tab supersedes an in-flight choice and a future record remains untouched', async () => {
  const request = deferred();
  loadLanguage.mockReturnValue(request.promise);
  const page = mount();
  page.click('[data-language="de"]');
  const future = JSON.stringify({ version: 2, language: 'fr' });
  localStorage.setItem(LANGUAGE_KEY, future);
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: LANGUAGE_KEY })));
  await act(async () => request.resolve());
  expect(document.documentElement.lang).toBe('en');
  page.click('[data-language="fr"]');
  await act(async () => {});
  expect(document.documentElement.lang).toBe('fr');
  expect(localStorage.getItem(LANGUAGE_KEY)).toBe(future);
});
test('unmounting invalidates pending work without writing a preference', async () => {
  const request = deferred();
  loadLanguage.mockReturnValue(request.promise);
  const page = mount();
  page.click('[data-language="de"]');
  page.unmount();
  await act(async () => request.resolve());
  expect(localStorage.getItem(LANGUAGE_KEY)).toBeNull();
  expect(document.documentElement.lang).toBe('en');
});
