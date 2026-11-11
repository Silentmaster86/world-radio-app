import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import { LANGUAGE_KEY, SUPPORTED_LANGUAGES, translate, hasLanguage, loadLanguage } from '../i18n';

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
  const [language, changeLanguage] = useState(() =>
    hasLanguage(initial.language) ? initial.language : 'en',
  );
  const [pendingLanguage, setPendingLanguage] = useState('');
  const [languageMessage, setLanguageMessage] = useState('');
  const canPersist = useRef(initial.canPersist);
  const generation = useRef(0);
  const selectLanguage = useCallback((next, persist = true) => {
    if (!SUPPORTED_LANGUAGES.includes(next)) return;
    const request = ++generation.current;
    setLanguageMessage('');
    const apply = () => {
      if (request !== generation.current) return;
      changeLanguage(next);
      setPendingLanguage('');
      if (persist && canPersist.current) {
        canPersist.current = writeStorage(LANGUAGE_KEY, { version: 1, language: next });
      }
      if (persist && !canPersist.current) setLanguageMessage('language.session');
    };
    if (hasLanguage(next)) {
      apply();
      return;
    }
    setPendingLanguage(next);
    loadLanguage(next).then(apply, () => {
      if (request !== generation.current) return;
      setPendingLanguage('');
      setLanguageMessage('language.failed');
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.lang;
    root.lang = language;
    return () => {
      root.lang = previous;
    };
  }, [language]);

  useEffect(() => {
    const requests = generation;
    // The current interface/player stays mounted while a language loads.
    if (!hasLanguage(initial.language)) selectLanguage(initial.language, false);
    const sync = (event) => {
      if (event.key !== LANGUAGE_KEY && event.key !== null) return;
      const next = readPreference();
      canPersist.current = next.canPersist;
      selectLanguage(next.language, false);
    };
    window.addEventListener('storage', sync);
    return () => {
      requests.current++;
      window.removeEventListener('storage', sync);
    };
  }, [initial, selectLanguage]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: selectLanguage,
      pendingLanguage,
      languageMessage,
      t: (key, params, fallback) => translate(language, key, params, fallback),
    }),
    [language, pendingLanguage, languageMessage, selectLanguage],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
