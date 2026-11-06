import { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { FaMoon } from 'react-icons/fa';
import { useAudio } from '../../context/AudioContext';
import { SLEEP_TIMER_MINUTES } from '../../lib/sleepTimer';

const Button = styled.button`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.border)};
  border-radius: 0.65rem;
  background: ${({ theme, $active }) => ($active ? theme.colors.accent : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.onAccent : theme.colors.text)};
  font: inherit;
  font-size: 0.8rem;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;
const Dialog = styled.dialog`
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(92vw, 420px);
  max-height: 85dvh;
  overflow-y: auto;
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  &::backdrop {
    background: #0008;
  }
  &:not([open]) {
    display: none;
  }
  h2 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
  }
  p {
    line-height: 1.5;
  }
  button {
    font: inherit;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border: 1px solid currentColor;
    border-radius: 0.6rem;
  }
  footer {
    display: flex;
    justify-content: end;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1rem;
  }
`;
const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr));
  gap: 0.5rem;
`;

export function formatRemaining(deadline, now) {
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function SleepTimer({ compact = false }) {
  const { sleepTimerDeadline = null, setSleepTimer, cancelSleepTimer } = useAudio();
  const [now, setNow] = useState(Date.now);
  const [open, setOpen] = useState(false);
  const dialog = useRef(null);
  const opener = useRef(null);
  const id = useId();
  const active = sleepTimerDeadline !== null;
  useEffect(() => {
    if (!active) return undefined;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active, sleepTimerDeadline]);
  useEffect(() => {
    if (!open) return;
    if (dialog.current.showModal) dialog.current.showModal();
    else dialog.current.setAttribute('open', '');
    dialog.current.querySelector('button')?.focus();
  }, [open]);
  const close = () => {
    if (dialog.current.close && dialog.current.open) dialog.current.close();
    else dialog.current.removeAttribute('open');
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <Button
        ref={opener}
        type="button"
        data-sleep-timer
        aria-label={active ? 'Sleep timer, active' : 'Sleep timer'}
        aria-haspopup="dialog"
        aria-pressed={active}
        $active={active}
        onClick={() => setOpen(true)}
      >
        {active ? (
          <span aria-hidden="true">{formatRemaining(sleepTimerDeadline, now)}</span>
        ) : (
          <>
            <FaMoon aria-hidden="true" />
            {!compact && <span>Sleep timer</span>}
          </>
        )}
      </Button>
      <Dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setOpen(false)}
      >
        <h2 id={`${id}-title`}>Sleep timer</h2>
        <p id={`${id}-description`}>Pause the radio automatically after a chosen time.</p>
        {active && (
          <p role="timer" aria-live="off">
            Pauses in {formatRemaining(sleepTimerDeadline, now)}.
          </p>
        )}
        <Options>
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
              {minutes} min
            </button>
          ))}
        </Options>
        <p>
          Pausing playback cancels the timer. Your browser may delay it while the app is suspended.
        </p>
        <footer>
          {active && (
            <button
              type="button"
              onClick={() => {
                cancelSleepTimer();
                close();
              }}
            >
              Cancel timer
            </button>
          )}
          <button type="button" onClick={close}>
            Close
          </button>
        </footer>
      </Dialog>
    </>
  );
}
