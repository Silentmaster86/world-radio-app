import { useEffect, useId, useRef } from 'react';
import { SLEEP_TIMER_MINUTES } from '../../lib/sleepTimer';
import { useLanguage } from '../../context/LanguageContext';
export default function SleepTimerDialog({
  active,
  remaining,
  setSleepTimer,
  cancelSleepTimer,
  onClose,
}) {
  const dialog = useRef(null);
  const id = useId();
  const { t } = useLanguage();
  useEffect(() => {
    const node = dialog.current;
    if (node.showModal) node.showModal();
    else node.setAttribute('open', '');
    node.querySelector('button')?.focus();
  }, []);
  const close = () => {
    const node = dialog.current;
    if (node.close && node.open) node.close();
    else node.removeAttribute('open');
    onClose();
  };
  return (
    <dialog
      className="timer-dialog"
      ref={dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
    >
      <h2 id={`${id}-title`}>{t('timer.title')}</h2>
      <p id={`${id}-description`}>{t('timer.description')}</p>
      {active && (
        <p role="timer" aria-live="off">
          {t('timer.pausesIn', { remaining })}
        </p>
      )}
      <div className="timer-options">
        {SLEEP_TIMER_MINUTES.map((minutes) => (
          <button
            key={minutes}
            type="button"
            data-sleep-minutes={minutes}
            onClick={() => {
              setSleepTimer(minutes);
              close();
            }}
          >
            {t('timer.option', { minutes })}
          </button>
        ))}
      </div>
      <p>{t('timer.warning')}</p>
      <footer>
        {active && (
          <button
            type="button"
            onClick={() => {
              cancelSleepTimer();
              close();
            }}
          >
            {t('timer.cancel')}
          </button>
        )}
        <button type="button" onClick={close}>
          {t('timer.close')}
        </button>
      </footer>
    </dialog>
  );
}
