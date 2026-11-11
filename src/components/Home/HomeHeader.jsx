import { Link } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { FaGlobeEurope, FaSlidersH, FaArrowLeft, FaCompass } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizeStoredMessage } from '../../i18n';
const BackupPanel = lazy(() => import('../Backup/BackupPanel'));
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
  const Brand = back ? Link : headingAs;
  return (
    <header className="app-header">
      <Brand className="app-brand" to={back ? '/' : undefined}>
        <span className="brand-mark" aria-hidden="true">
          {back ? <FaArrowLeft /> : <FaGlobeEurope />}
        </span>
        <span>{back ? t('discover.back') : 'World Radio App'}</span>
      </Brand>
      <div className="header-actions">
        {!back && (
          <Link
            className="header-action"
            to="/discover"
            aria-label={t('discover.title')}
            title={t('discover.open')}
          >
            <FaCompass aria-hidden="true" />
            <span className="action-label">{t('discover.open')}</span>
          </Link>
        )}
        <button
          className="header-action"
          id="open-settings"
          data-settings
          ref={opener}
          type="button"
          aria-label={t('settings.title')}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <FaSlidersH aria-hidden="true" />
          <span className="action-label">{t('settings.title')}</span>
        </button>
      </div>
      <dialog
        className="settings-dialog"
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
        <Link className="dialog-link" to="/library" onClick={close} data-open-library>
          {t('nav.library')}
        </Link>
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
      </dialog>
    </header>
  );
}
