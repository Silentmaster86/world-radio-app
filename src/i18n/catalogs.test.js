import { en } from './en';
import { pl } from './pl';
import { en as backup } from '../components/Backup/messages';
import { en as manage } from '../components/Library/messages';
import { loadLanguage, translate } from './index';

const baseline = {
  ...en,
  ...Object.fromEntries(Object.entries(backup).map(([key, value]) => [`backup.${key}`, value])),
  ...Object.fromEntries(Object.entries(manage).map(([key, value]) => [`manage.${key}`, value])),
};
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
test('existing Polish covers English interface keys and preserves placeholders', () => {
  expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
  for (const key of Object.keys(en)) expect(placeholders(pl[key])).toEqual(placeholders(en[key]));
});
test.each(['de', 'es', 'fr', 'pt', 'it', 'uk'])(
  '%s has complete interface, backup and library messages with intact parameters',
  async (language) => {
    const { default: catalog } = await import(`./locales/${language}`);
    expect(Object.keys(catalog).sort()).toEqual(Object.keys(baseline).sort());
    await loadLanguage(language);
    for (const [key, text] of Object.entries(baseline)) {
      expect(typeof catalog[key]).toBe('string');
      expect(catalog[key].trim()).not.toBe('');
      expect(placeholders(catalog[key])).toEqual(placeholders(text));
      expect(translate(language, key)).toBe(catalog[key]);
    }
    expect(translate(language, 'settings.title')).not.toBe(en['settings.title']);
    expect(translate(language, 'station.addFavorite', { station: '<Radio>' })).toContain('<Radio>');
  },
);
test('unsupported language loading rejects without losing English fallback', async () => {
  await expect(loadLanguage('zz')).rejects.toThrow('language');
  expect(translate('zz', 'settings.title')).toBe('Settings');
});
test('additional country and language labels use local Intl data', async () => {
  await loadLanguage('fr');
  expect(translate('fr', 'country.BR')).toBe('Brésil');
  expect(translate('fr', 'language.es')).toBe('espagnol');
  expect(translate('fr', 'country.invalid', {}, 'Unknown')).toBe('Unknown');
});
