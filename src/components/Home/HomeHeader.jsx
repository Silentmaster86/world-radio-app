import styled from 'styled-components';
import { FaGlobeEurope } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizeStoredMessage } from '../../i18n';
const Header = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 0.5rem 1rem;
  padding: 1rem 0;
  h1 {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: clamp(1.4rem, 4vw, 2rem);
    line-height: 1.2;
    margin: 0;
    min-width: 0;
  }
  h1 svg {
    flex-shrink: 0;
  }
  p {
    grid-column: 1 / -1;
    color: ${({ theme }) => theme.colors.muted};
    line-height: 1.5;
    margin: 0;
  }
  label {
    grid-row: 1;
    display: grid;
    gap: 0.35rem;
    font-size: 0.875rem;
  }
  select {
    min-height: 44px;
    border-radius: 0.65rem;
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
  @media (max-width: 640px) {
    padding: 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem 0.75rem;
    h1 {
      grid-column: 1 / -1;
    }
    label {
      grid-row: 2;
      min-width: 0;
      gap: 0.2rem;
    }
    select {
      width: 100%;
      min-width: 0;
    }
    p {
      font-size: 0.875rem;
    }
  }
  @media (max-width: 640px) and (max-height: 640px) {
    p:not([role='status']) {
      display: none;
    }
  }
`;
export default function HomeHeader() {
  const { mode, setThemeMode, storageMessage } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  return (
    <Header>
      <h1>
        <FaGlobeEurope aria-hidden="true" />
        <span>World Radio App</span>
      </h1>
      <label htmlFor="language">
        {t('header.language')}
        <select
          id="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option value="en">English</option>
          <option value="pl">Polski</option>
        </select>
      </label>
      <label htmlFor="appearance">
        {t('header.appearance')}
        <select id="appearance" value={mode} onChange={(event) => setThemeMode(event.target.value)}>
          <option value="system">{t('header.system')}</option>
          <option value="light">{t('header.light')}</option>
          <option value="dark">{t('header.dark')}</option>
        </select>
      </label>
      <p>{t('header.tagline')}</p>
      {storageMessage && <p role="status">{localizeStoredMessage(t, storageMessage)}</p>}
    </Header>
  );
}
