import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
export default function ThemeSwitcher() {
  const { mode, setThemeMode } = useTheme();
  const { t } = useLanguage();
  const paths = {
    system: 'M3 4h18v13H3zM12 17v4M8 21h8',
    light:
      'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
    dark: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z',
  };
  return (
    <label className="theme-switcher" title={`${t('header.appearance')}: ${t(`header.${mode}`)}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={paths[mode]} />
      </svg>
      <select
        id="header-appearance"
        aria-label={t('header.appearance')}
        value={mode}
        onChange={(event) => setThemeMode(event.target.value)}
      >
        {['system', 'light', 'dark'].map((value) => (
          <option key={value} value={value}>
            {t(`header.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
