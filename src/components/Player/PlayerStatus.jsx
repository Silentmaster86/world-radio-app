import styled from 'styled-components';
import { useAudio } from '../../context/AudioContext';
import { usePwa } from '../../context/PwaContext';
import { useLanguage } from '../../context/LanguageContext';

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
  const {
    status,
    wantsToPlay,
    online,
    retryAttempt,
    streamSourceIndex = 0,
    error,
    retry,
    preferenceMessage,
  } = useAudio();
  const pwa = usePwa();
  const { t } = useLanguage();
  const labels = {
    idle: t('status.idle'),
    connecting: streamSourceIndex
      ? t('status.connectingBackup')
      : retryAttempt
        ? t('status.reconnecting')
        : t('status.connecting'),
    playing: streamSourceIndex ? t('status.playingBackup') : t('status.playing'),
    buffering: t('status.buffering'),
    paused: t('status.paused'),
    error: error?.code
      ? t(`error.${error.code}`, {}, error.message)
      : error?.message || t('status.error'),
  };
  const message =
    online === false && status !== 'playing'
      ? wantsToPlay
        ? t('status.offlineWaiting')
        : pwa?.offlineReady
          ? t('status.offlineSaved')
          : t('status.offline')
      : labels[status];
  return (
    <Status
      role={announce ? 'status' : undefined}
      aria-live={announce ? 'polite' : undefined}
      data-player-status={status}
    >
      {message}
      {status === 'error' && (
        <button type="button" onClick={retry} aria-label={t('status.retry')}>
          {t('status.tryAgain')}
        </button>
      )}
      {preferenceMessage && <small style={{ display: 'block' }}>{preferenceMessage}</small>}
    </Status>
  );
}
