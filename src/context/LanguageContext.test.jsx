import { useLanguage, LanguageProvider } from './LanguageContext';
import { LANGUAGE_KEY, translate } from '../i18n';
import { render } from '../test/render';

function LanguagePreview() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="message">{t('header.tagline')}</span>
      <button type="button" onClick={() => setLanguage('pl')}>
        Polski
      </button>
      <button type="button" onClick={() => setLanguage('en')}>
        English
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'en';
});

test('English remains the default; choosing Polish updates UI, lang and storage', () => {
  const page = render(
    <LanguageProvider>
      <LanguagePreview />
    </LanguageProvider>,
  );
  expect(page.container.querySelector('[data-testid="message"]').textContent).toBe(
    'Your stations. One place to listen.',
  );
  page.click('button');
  expect(page.container.querySelector('[data-testid="message"]').textContent).toBe(
    'Twoje stacje radiowe. Wszystkie w jednym miejscu.',
  );
  expect(document.documentElement.lang).toBe('pl');
  expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY))).toEqual({
    version: 1,
    language: 'pl',
  });
  page.unmount();
  expect(document.documentElement.lang).toBe('en');
});

test('saved Polish is restored without changing playback-related storage', () => {
  localStorage.setItem(LANGUAGE_KEY, JSON.stringify({ version: 1, language: 'pl' }));
  localStorage.setItem('wra:favorites:v1', JSON.stringify({ version: 1, stationIds: ['pr-chicago'] }));
  const page = render(
    <LanguageProvider>
      <LanguagePreview />
    </LanguageProvider>,
  );
  expect(page.container.querySelector('[data-testid="language"]').textContent).toBe('pl');
  expect(document.documentElement.lang).toBe('pl');
  expect(JSON.parse(localStorage.getItem('wra:favorites:v1')).stationIds).toEqual(['pr-chicago']);
});

test('invalid values fall back to English without overwriting data', () => {
  localStorage.setItem(LANGUAGE_KEY, JSON.stringify({ version: 1, language: 'de' }));
  const page = render(
    <LanguageProvider>
      <LanguagePreview />
    </LanguageProvider>,
  );
  expect(page.container.querySelector('[data-testid="language"]').textContent).toBe('en');
  expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY)).language).toBe('de');
});

test('a future schema stays untouched and changes only this session', () => {
  localStorage.setItem(LANGUAGE_KEY, JSON.stringify({ version: 2, language: 'pl' }));
  const page = render(
    <LanguageProvider>
      <LanguagePreview />
    </LanguageProvider>,
  );
  page.click('button');
  expect(page.container.querySelector('[data-testid="language"]').textContent).toBe('pl');
  expect(JSON.parse(localStorage.getItem(LANGUAGE_KEY)).version).toBe(2);
});

test('all translations support placeholders and safe English fallback', () => {
  expect(translate('pl', 'home.results', { visible: 4, total: 12 })).toBe('4 z 12 stacji');
  expect(translate('en', 'home.results', { visible: 4, total: 12 })).toBe('4 of 12 stations');
  expect(translate('pl', 'not.in.dictionary', {}, 'Fall back')).toBe('Fall back');
  expect(translate('invalid', 'header.language')).toBe('Language');
});
