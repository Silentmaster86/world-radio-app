import { en } from './en';
import { pl } from './pl';

export const LANGUAGE_KEY = 'wra:language:v1';
export const LANGUAGE_NAMES = {
  en: 'English',
  pl: 'Polski',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
  uk: 'Українська',
};
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_NAMES);

const dictionaries = { en, pl };
const loaders = {
  de: () => import('./locales/de'),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  pt: () => import('./locales/pt'),
  it: () => import('./locales/it'),
  uk: () => import('./locales/uk'),
};
const loading = new Map();
const displayNames = new Map();
export const hasLanguage = (language) => Object.hasOwn(dictionaries, language);
export function loadLanguage(language) {
  if (hasLanguage(language)) return Promise.resolve();
  if (!Object.hasOwn(loaders, language)) return Promise.reject(new Error('language'));
  if (!loading.has(language)) {
    loading.set(
      language,
      loaders[language]()
        .then(({ default: dictionary }) => {
          dictionaries[language] = dictionary;
        })
        .finally(() => loading.delete(language)),
    );
  }
  return loading.get(language);
}

export function translate(language, key, params = {}, fallback) {
  const catalog = dictionaries[language] || en;
  let localized;
  const [namespace, code] = key.split('.');
  if (!catalog[key] && ['country', 'language'].includes(namespace) && code) {
    try {
      const type = namespace === 'country' ? 'region' : 'language';
      const id = `${language}:${type}`;
      if (!displayNames.has(id)) displayNames.set(id, new Intl.DisplayNames([language], { type }));
      const name = displayNames.get(id).of(code);
      if (name !== code) localized = name;
    } catch {
      // Older browsers and invalid external language/region codes use the fallback.
    }
  }
  const template = catalog[key] ?? localized ?? en[key] ?? fallback ?? key;
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
}

const storedMessageKeys = {
  'Favorites are available for this session only. Changes could not be saved.':
    'storage.favoritesSession',
  'Saved favorites could not be read. You can continue listening.': 'storage.favoritesRecovery',
  'Some previous favorites could not be matched. Their original data has been kept.':
    'storage.favoritesPreserved',
  'Saved favorites use a newer format. The original data is preserved; changes will stay in this session.':
    'storage.favoritesNewer',
  'Listening history is available for this session only. Changes could not be saved.':
    'storage.recentSession',
  'Listening history uses a newer format. Original data is preserved; changes stay in this session.':
    'storage.recentNewer',
  'Saved listening history could not be read.': 'storage.recentRecovery',
  'Player settings could not be saved. Changes stay in this session.': 'storage.playerSession',
  'Player settings use a newer format. The original data is preserved.': 'storage.playerNewer',
  'Saved player settings could not be read.': 'storage.playerRecovery',
  'Newer appearance settings are preserved. Changes apply for this session.':
    'storage.newerAppearance',
  'Appearance changes apply for this session because storage is unavailable.':
    'storage.appearanceSession',
};

export function localizeStoredMessage(t, message) {
  const key = storedMessageKeys[message];
  return key ? t(key) : message;
}
