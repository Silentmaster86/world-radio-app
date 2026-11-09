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
