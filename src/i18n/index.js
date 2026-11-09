import { en } from './en';
import { pl } from './pl';

export const LANGUAGE_KEY = 'wra:language:v1';
export const SUPPORTED_LANGUAGES = ['en', 'pl'];

const dictionaries = { en, pl };

export function translate(language, key, params = {}, fallback) {
  const catalog = dictionaries[language] || en;
  const template = catalog[key] ?? en[key] ?? fallback ?? key;
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : match,
  );
}

const storedMessageKeys = {
  'Favorites are available for this session only. Changes could not be saved.':
    'storage.favoritesSession',
  'Saved favorites could not be read. You can continue listening.':
    'storage.favoritesRecovery',
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
