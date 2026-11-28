import { useEffect, useRef, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { usePwa } from '../../context/PwaContext';
import { useLanguage } from '../../context/LanguageContext';
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
      <button
        className="install-button"
        ref={opener}
        type="button"
        aria-label={t('install.aria')}
        title={t('install.aria')}
        onClick={install}
      >
        <FaDownload aria-hidden="true" />
      </button>
      <dialog
        className="install-dialog"
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
      </dialog>
    </>
  );
}
