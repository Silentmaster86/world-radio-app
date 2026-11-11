import { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStations } from '../../context/StationsContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useRecentStations } from '../../context/RecentStationsContext';
import { useAudio } from '../../context/AudioContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  BACKUP_LIMIT,
  createBackup,
  parseBackup,
  planImport,
  withSavedLibrary,
  persistImport,
  downloadBackup,
} from '../../lib/libraryBackup';
import { backupMessage } from './messages';
import { hasLanguage, loadLanguage } from '../../i18n';

const Panel = styled.section`
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  overflow-wrap: anywhere;
  h3 {
    font-size: 1rem;
    margin: 0 0 0.5rem;
  }
  p {
    font-size: 0.875rem;
    line-height: 1.5;
  }
  button {
    max-width: 100%;
    min-width: 44px;
  }
  input[type='file'] {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 44px;
    font: inherit;
  }
  input::file-selector-button {
    min-height: 44px;
    font: inherit;
  }
  label:has(input[type='checkbox']) {
    display: flex;
    align-items: center;
    min-height: 44px;
    gap: 0.75rem;
  }
  input[type='checkbox'] {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
  .backup-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;
export default function BackupPanel() {
  const stations = useStations(),
    favorites = useFavorites(),
    recent = useRecentStations(),
    audio = useAudio();
  const { language, setLanguage, t: ui } = useLanguage();
  const { mode, setThemeMode } = useTheme();
  const [incoming, setIncoming] = useState(null),
    [includeSettings, setIncludeSettings] = useState(false),
    [reading, setReading] = useState(false),
    [applying, setApplying] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const fileRef = useRef(null),
    generation = useRef(0),
    commitRef = useRef(null);
  const title = useId();
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const t = (key, params) => backupMessage(language, key, params);
  const current = () => ({
    catalog: stations.catalog,
    favoriteIds: favorites.favoriteIds,
    recentIds: recent.recentIds,
    settings: { language, theme: mode, volume: audio.volume, muted: audio.muted },
  });
  let preview = null,
    previewError = '';
  if (incoming) {
    try {
      preview = planImport(incoming, withSavedLibrary(current()));
    } catch (e) {
      previewError = e.message;
    }
  }
  async function chooseFile(event) {
    const file = event.target.files?.[0];
    const request = ++generation.current;
    setIncoming(null);
    setMessage('');
    setError('');
    setIncludeSettings(false);
    setReading(false);
    setApplying(false);
    if (!file) {
      setReading(false);
      return;
    }
    if (file.size > BACKUP_LIMIT) {
      setError('size');
      return;
    }
    setReading(true);
    try {
      const text = await file.text();
      if (request !== generation.current) return;
      setIncoming(parseBackup(text));
    } catch (e) {
      if (request === generation.current)
        setError(['invalid', 'version', 'size'].includes(e.message) ? e.message : 'read');
    } finally {
      if (request === generation.current) setReading(false);
    }
  }
  // Playback/library may change while a language downloads; commit the latest view.
  commitRef.current = commit;
  function apply() {
    const request = ++generation.current;
    const finish = () => {
      if (request !== generation.current) return;
      setApplying(false);
      commitRef.current();
    };
    if (includeSettings && !hasLanguage(incoming.settings.language)) {
      setApplying(true);
      setError('');
      loadLanguage(incoming.settings.language).then(finish, () => {
        if (request !== generation.current) return;
        setApplying(false);
        setError('language');
      });
    } else finish();
  }
  function commit() {
    try {
      // Build again on confirmation: playback may have changed history since preview.
      const plan = planImport(incoming, withSavedLibrary(current()));
      persistImport(plan, { includeSettings, stationId: audio.selectedStationId });
      stations.restoreStations(plan.stations);
      favorites.restoreFavorites(plan.favoriteIds);
      recent.restoreRecent(plan.recentIds);
      if (includeSettings) {
        setLanguage(plan.settings.language);
        setThemeMode(plan.settings.theme);
        audio.changeVolume(plan.settings.volume);
        if (audio.muted !== plan.settings.muted) audio.toggleMute();
      }
      setIncoming(null);
      setMessage('success');
      setError('');
      fileRef.current.value = '';
      fileRef.current.focus();
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <Panel aria-labelledby={title} data-backup-panel>
      <h3 id={title}>{t('title')}</h3>
      <p>{t('intro')}</p>
      <button
        type="button"
        data-backup-export
        onClick={() => {
          try {
            downloadBackup(createBackup(current()));
            setMessage('exported');
            setError('');
          } catch {
            setError('exportError');
          }
        }}
      >
        {t('export')}
      </button>
      <label>
        {t('file')}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={chooseFile}
          data-backup-file
        />
      </label>
      {applying && <p role="status">{ui('language.loading')}</p>}
      {reading && <p role="status">{t('reading')}</p>}
      {incoming && (
        <div data-backup-preview>
          <h4>{t('preview')}</h4>
          {preview && <p>{t('counts', preview.counts)}</p>}
          <p>{t('merge')}</p>
          <label>
            <input
              type="checkbox"
              disabled={applying}
              checked={includeSettings}
              onChange={(e) => setIncludeSettings(e.target.checked)}
              data-backup-settings
            />
            {t('settings')}
          </label>
          <p>{t('settingsHint')}</p>
          <div className="backup-actions">
            <button type="button" disabled={!preview || applying} data-backup-apply onClick={apply}>
              {t('apply')}
            </button>
            <button
              type="button"
              onClick={() => {
                generation.current++;
                setApplying(false);
                setIncoming(null);
                setError('');
                fileRef.current.value = '';
                fileRef.current.focus();
              }}
              data-backup-cancel
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      {(error || previewError) && <p role="alert">{t(error || previewError)}</p>}
      {message && (
        <p role="status" data-backup-message>
          {t(message)}
        </p>
      )}
    </Panel>
  );
}
