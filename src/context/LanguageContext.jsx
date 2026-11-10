import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import { LANGUAGE_KEY, SUPPORTED_LANGUAGES, translate } from '../i18n';

const defaultContext = {
  language: 'en',
  setLanguage: () => {},
  t: (key, params, fallback) => translate('en', key, params, fallback),
};
const LanguageContext = createContext(defaultContext);
export const useLanguage = () => useContext(LanguageContext);

function readPreference() {
  const saved = readStorage(
    LANGUAGE_KEY,
    null,
    (value) =>
      value &&
      Number.isInteger(value.version) &&
      value.version >= 1 &&
      (value.version > 1 || SUPPORTED_LANGUAGES.includes(value.language)),
  );
  return {
    language: saved.value?.version === 1 ? saved.value.language : 'en',
    canPersist: saved.value?.version > 1 ? false : saved.status !== 'unavailable',
  };
}

export function LanguageProvider({ children }) {
  const [initial] = useState(readPreference);
  const [language, changeLanguage] = useState(initial.language);
  const [canPersist, setCanPersist] = useState(initial.canPersist);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = language;
    return () => {
      root.lang = previous;
    };
  }, [language]);

  useEffect(() => {
    const sync = (event) => {
      if (event.key !== LANGUAGE_KEY && event.key !== null) return;
      const next = readPreference();
      changeLanguage(next.language);
      setCanPersist(next.canPersist);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next) => {
        if (!SUPPORTED_LANGUAGES.includes(next) || next === language) return;
        changeLanguage(next);
        if (canPersist) setCanPersist(writeStorage(LANGUAGE_KEY, { version: 1, language: next }));
      },
      t: (key, params, fallback) => translate(language, key, params, fallback),
    }),
    [language, canPersist],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
