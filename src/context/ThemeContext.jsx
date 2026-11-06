import { createContext, useState, useContext, useEffect } from 'react';
import { darkTheme } from '../darkTheme';
import { lightTheme } from '../lightTheme';
import { readStorage, writeStorage } from '../lib/storage';

export const THEME_KEY = 'wra:theme:v1';
const modes = ['system', 'light', 'dark'];
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);
function systemQuery() {
  try { return window.matchMedia?.('(prefers-color-scheme: dark)') || null; } catch { return null; }
}
function readPreference() {
  const result = readStorage(THEME_KEY, null, (value) => value && Number.isInteger(value.version) && value.version >= 1 && (value.version > 1 || modes.includes(value.mode)));
  const future = result.value?.version > 1;
  return {
    mode: result.value?.version === 1 ? result.value.mode : 'system',
    preserve: future,
    message: future ? 'Newer appearance settings are preserved. Changes apply for this session.' : result.status === 'unavailable' ? 'Appearance changes apply for this session because storage is unavailable.' : '',
  };
}
export function ThemeProviderToggle({ children }) {
  const [initial] = useState(readPreference);
  const [mode, setMode] = useState(initial.mode);
  const [message, setMessage] = useState(initial.message);
  const [systemDark, setSystemDark] = useState(() => systemQuery()?.matches ?? true);
  useEffect(() => {
    if (mode !== 'system') return undefined;
    const query = systemQuery();
    if (!query) return undefined;
    const update = () => setSystemDark(query.matches);
    update();
    if (query.addEventListener) query.addEventListener('change', update);
    else query.addListener?.(update);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', update);
      else query.removeListener?.(update);
    };
  }, [mode]);
  const isDarkMode = mode === 'dark' || (mode === 'system' && systemDark);
  const theme = isDarkMode ? darkTheme : lightTheme;
  useEffect(() => {
    const root = document.documentElement;
    const previousScheme = root.style.colorScheme;
    const meta = document.querySelector('meta[name="theme-color"]');
    const previousColor = meta?.getAttribute('content');
    root.style.colorScheme = theme.colors.mode;
    meta?.setAttribute('content', theme.colors.background);
    return () => {
      root.style.colorScheme = previousScheme;
      if (meta && previousColor !== null) meta.setAttribute('content', previousColor);
    };
  }, [theme]);
  const setThemeMode = (next) => {
    if (!modes.includes(next)) return;
    setMode(next);
    if (!initial.preserve)
      setMessage(writeStorage(THEME_KEY, { version: 1, mode: next }) ? '' : 'Appearance changes apply for this session because storage is unavailable.');
  };
  return <ThemeContext.Provider value={{ mode, setThemeMode, isDarkMode, theme, storageMessage: message }}>{children}</ThemeContext.Provider>;
}
