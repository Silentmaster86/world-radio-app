import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { FaDownload } from 'react-icons/fa';
import { usePwa } from '../../context/PwaContext';
import { useLanguage } from '../../context/LanguageContext';
const Button = styled.button`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: transparent;
`;
const Dialog = styled.dialog`
  position: fixed;
  inset: 0;
  margin: auto;
  padding: 1.25rem;
  width: min(92vw, 440px);
  max-height: 85dvh;
  overflow-y: auto;
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
    font-size: 1.25rem;
    margin: 0 0 1rem;
  }
  p {
    line-height: 1.6;
  }
  button {
    min-height: 44px;
    padding: 0.5rem 0.85rem;
    border: 1px solid currentColor;
    border-radius: 0.6rem;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    gap: 0.75rem;
  }
`;
export default function InstallApp() {
  const pwa = usePwa();
  const { t } = useLanguage();
  const dialog = useRef(null),
    opener = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      if (dialog.current?.showModal) dialog.current.showModal();
      else dialog.current?.setAttribute('open', '');
    } else if (dialog.current?.hasAttribute('open')) {
      if (dialog.current.close) dialog.current.close();
      else dialog.current.removeAttribute('open');
    }
  }, [open]);
  if (!pwa || pwa.installed) return null;
  const close = () => {
    if (dialog.current?.close && dialog.current.open) dialog.current.close();
    else dialog.current?.removeAttribute('open');
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };
  const install = async () => {
    if (pwa.installAvailable && (await pwa.install())) return;
    setOpen(true);
  };
  return (
    <>
      <Button
        ref={opener}
        type="button"
        aria-label={t('install.aria')}
        title={t('install.aria')}
        onClick={install}
      >
        <FaDownload aria-hidden="true" />
      </Button>
      <Dialog
        ref={dialog}
        aria-labelledby="install-heading"
        aria-describedby="install-steps"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setOpen(false)}
      >
        <h2 id="install-heading">{t('install.title')}</h2>
        <p id="install-steps">
          {pwa.ios ? t('install.ios') : pwa.macSafari ? t('install.mac') : t('install.other')}
        </p>
        <p>
          {pwa.offlineReady
            ? t('install.offlineReady')
            : pwa.status === 'error' || pwa.status === 'unsupported'
              ? t('install.offlineError')
              : t('install.offlinePreparing')}
        </p>
        <footer>
          <button type="button" onClick={pwa.check}>
            {pwa.status === 'error' ? t('install.retry') : t('install.check')}
          </button>
          <button type="button" onClick={close}>
            {t('install.close')}
          </button>
        </footer>
      </Dialog>
    </>
  );
}
