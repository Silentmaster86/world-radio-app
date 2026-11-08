import styled from 'styled-components';
import { useAudio } from '../../context/AudioContext';
import { usePwa } from '../../context/PwaContext';

const Status = styled.div`
  font-size: 0.8rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.muted};
  overflow-wrap: anywhere;
  button {
    min-height: 44px;
    margin-left: 0.5rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid currentColor;
    border-radius: 0.5rem;
    font: inherit;
  }
`;

export default function PlayerStatus({ announce = true }) {
  const { status, wantsToPlay, online, retryAttempt, streamSourceIndex = 0, error, retry, preferenceMessage } = useAudio();
  const pwa = usePwa();
  const labels = {
    idle: 'Ready to play',
    connecting: streamSourceIndex ? 'Connecting to backup stream…' : retryAttempt ? 'Reconnecting…' : 'Connecting…',
    playing: streamSourceIndex ? 'Playing live (backup stream)' : 'Playing live',
    buffering: 'Buffering…',
    paused: 'Paused',
    error: error?.message || 'The station is currently unavailable.',
  };
  const message =
    online === false && status !== 'playing'
      ? wantsToPlay
        ? 'Offline. Waiting for a connection…'
        : pwa?.offlineReady
          ? 'Offline. Saved stations are available; connect to listen.'
          : 'Offline. Connect to listen.'
      : labels[status];
  return (
    <Status
      role={announce ? 'status' : undefined}
      aria-live={announce ? 'polite' : undefined}
      data-player-status={status}
    >
      {message}
      {status === 'error' && (
        <button type="button" onClick={retry} aria-label="Retry current station">
          Try again
        </button>
      )}
      {preferenceMessage && <small style={{ display: 'block' }}>{preferenceMessage}</small>}
    </Status>
  );
}
