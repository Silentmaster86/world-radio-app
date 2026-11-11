import { Link } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { FaGlobeEurope, FaSlidersH, FaArrowLeft, FaCompass } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizeStoredMessage } from '../../i18n';
const BackupPanel = lazy(() => import('../Backup/BackupPanel'));
const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0 1.25rem;
  @media (max-width: 640px) {
    padding: 0.5rem 0 0.75rem;
  }
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;
const Brand = styled.h1`
  display: flex;
  flex: 1 1 180px;
  align-items: center;
  gap: 0.6rem;
  overflow-wrap: anywhere;
  span {
    min-width: 0;
  }
  text-decoration: none;
  color: inherit;
  margin: 0;
  min-width: 0;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  line-height: 1.2;
  letter-spacing: -0.025em;
  svg {
    color: ${({ theme }) => theme.colors.accent};
    flex-shrink: 0;
  }
`;
const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
const Settings = styled.button`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 44px;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.875rem;
  flex-shrink: 0;
  @media (max-width: 640px) {
    span {
      display: none;
    }
  }
`;
const Dialog = styled.dialog`
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(92vw, 420px);
  max-height: 85dvh;
  padding: 1.5rem;
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  &::backdrop {
    background: #0009;
    backdrop-filter: blur(4px);
  }
  &:not([open]) {
    display: none;
  }
  h2 {
    margin: 0 0 1.5rem;
    font-size: 1.25rem;
  }
  label {
    display: grid;
    gap: 0.5rem;
    margin: 1rem 0;
    font-size: 0.875rem;
  }
  select {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 0.65rem;
    border: 1px solid ${({ theme }) => theme.colors.muted};
    border-radius: 0.65rem;
    background: ${({ theme }) => theme.colors.background};
    color: inherit;
  }
  footer {
    display: flex;
    justify-content: end;
    margin-top: 1.5rem;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 1rem;
    border-radius: 0.65rem;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.onAccent};
  }
`;
export default function HomeHeader({ headingAs = 'h1', back = false }) {
  const { mode, setThemeMode, storageMessage } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const dialog = useRef(null);
  const opener = useRef(null);
  const title = useId();
  useEffect(() => {
    if (open) {
      if (dialog.current.showModal) dialog.current.showModal();
      else dialog.current.setAttribute('open', '');
      dialog.current.querySelector('select')?.focus();
    }
  }, [open]);
  const close = () => {
    if (dialog.current.close && dialog.current.open) dialog.current.close();
    else dialog.current.removeAttribute('open');
    setOpen(false);
    setBackupOpen(false);
    opener.current?.focus({ preventScroll: true });
  };
  return (
    <Header>
      <Brand as={back ? Link : headingAs} to={back ? '/' : undefined}>
        {back ? <FaArrowLeft aria-hidden="true" /> : <FaGlobeEurope aria-hidden="true" />}
        <span>{back ? t('discover.back') : 'World Radio App'}</span>
      </Brand>
      <Actions>
        {!back && (
          <Settings
            as={Link}
            to="/discover"
            aria-label={t('discover.title')}
            title={t('discover.open')}
          >
            <FaCompass aria-hidden="true" />
            <span>{t('discover.open')}</span>
          </Settings>
        )}
        <Settings
          id="open-settings"
          data-settings
          ref={opener}
          type="button"
          aria-label={t('settings.title')}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <FaSlidersH aria-hidden="true" />
          <span>{t('settings.title')}</span>
        </Settings>
      </Actions>
      <Dialog
        ref={dialog}
        aria-labelledby={title}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = [
            ...dialog.current.querySelectorAll('select, button, input, a[href]'),
          ].filter((node) => !node.disabled);
          const first = controls[0],
            last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={() => setOpen(false)}
      >
        <h2 id={title}>{t('settings.title')}</h2>
        <label htmlFor="language">
          {t('header.language')}
          <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </label>
        <label htmlFor="appearance">
          {t('header.appearance')}
          <select id="appearance" value={mode} onChange={(e) => setThemeMode(e.target.value)}>
            <option value="system">{t('header.system')}</option>
            <option value="light">{t('header.light')}</option>
            <option value="dark">{t('header.dark')}</option>
          </select>
        </label>
        {storageMessage && <p role="status">{localizeStoredMessage(t, storageMessage)}</p>}
        <Settings as={Link} to="/library" onClick={close} data-open-library>
          {t('nav.library')}
        </Settings>
        <button type="button" data-open-backup onClick={() => setBackupOpen(true)}>
          {t('settings.backup')}
        </button>
        {backupOpen && (
          <ErrorBoundary
            fallback={
              <p role="alert" data-backup-load-error>
                {t('settings.backupError')}
              </p>
            }
          >
            <Suspense fallback={<p role="status">{t('settings.loading')}</p>}>
              <BackupPanel />
            </Suspense>
          </ErrorBoundary>
        )}
        <footer>
          <button id="close-settings" data-close-settings type="button" onClick={close}>
            {t('settings.done')}
          </button>
        </footer>
      </Dialog>
    </Header>
  );
}
