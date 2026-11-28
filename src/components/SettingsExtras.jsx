import DesignPicker from '../designs/DesignPicker';
import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeStoredMessage } from '../i18n';

const BackupPanel = lazy(() => import('./Backup/BackupPanel'));

export default function SettingsExtras({ onNavigate }) {
  const { backgroundMotion, setBackgroundMotion, storageMessage } = useTheme();
  const { t } = useLanguage();
  const [backupOpen, setBackupOpen] = useState(false);
  return (
    <>
      <DesignPicker />
      {storageMessage && <p role="status">{localizeStoredMessage(t, storageMessage)}</p>}
      <label className="motion-choice">
        <input
          type="checkbox"
          checked={backgroundMotion}
          onChange={(event) => setBackgroundMotion(event.target.checked)}
          data-background-motion
        />
        <span>
          {t('settings.motion')}
          <small>{t('settings.motionHint')}</small>
        </span>
      </label>
      <Link className="dialog-link" to="/library" onClick={onNavigate} data-open-library>
        {t('nav.library')}
      </Link>
      <button type="button" data-open-backup onClick={() => setBackupOpen(true)}>
        {t('settings.backup')}
      </button>
      <a className="dialog-link" href="/privacy/" target="_blank" rel="noopener noreferrer">
        {t('settings.privacy')}
      </a>
      <Link className="dialog-link" to="/help" onClick={onNavigate}>
        {t('settings.help')}
      </Link>
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
    </>
  );
}
