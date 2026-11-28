import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { FaMoon } from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';
import ErrorBoundary from '../ErrorBoundary';
const SleepTimerDialog = lazy(() => import('./SleepTimerDialog'));
import { useLanguage } from '../../context/LanguageContext';

export function formatRemaining(deadline, now) {
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function SleepTimer({ compact = false }) {
  const { sleepTimerDeadline = null, setSleepTimer, cancelSleepTimer } = useAudio();
  const { t } = useLanguage();
  const [now, setNow] = useState(Date.now);
  const [open, setOpen] = useState(false);
  const opener = useRef(null);
  const active = sleepTimerDeadline !== null;
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active, sleepTimerDeadline]);
  const close = () => {
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <button
        className="timer-button"
        ref={opener}
        type="button"
        data-sleep-timer
        aria-label={t(active ? 'timer.active' : 'timer.title')}
        aria-haspopup="dialog"
        aria-pressed={active}
        data-active={active}
        onClick={() => setOpen(true)}
      >
        {active ? (
          <span aria-hidden="true">{formatRemaining(sleepTimerDeadline, now)}</span>
        ) : (
          <>
            <FaMoon aria-hidden="true" />
            {!compact && <span>{t('timer.title')}</span>}
          </>
        )}
      </button>
      {open && (
        <ErrorBoundary
          fallback={
            <p role="alert">
              {t('nav.loadError')} <button onClick={close}>{t('timer.close')}</button>
            </p>
          }
        >
          <Suspense fallback={<p role="status">{t('settings.loading')}</p>}>
            <SleepTimerDialog
              active={active}
              remaining={active ? formatRemaining(sleepTimerDeadline, now) : ''}
              setSleepTimer={setSleepTimer}
              cancelSleepTimer={cancelSleepTimer}
              onClose={close}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
}
