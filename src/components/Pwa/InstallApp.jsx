import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { FaDownload } from 'react-icons/fa';
import { usePwa } from '../../context/PwaContext';
const Button = styled.button`
  display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px;
  border: 1px solid currentColor; border-radius: 50%; background: transparent;
`;
const Dialog = styled.dialog`
  position: fixed; inset: 0; margin: auto; padding: 1.25rem;
  width: min(92vw, 440px); max-height: 85dvh; overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text};
  &::backdrop { background: #0008; }
  &:not([open]) { display: none; }
  h2 { font-size: 1.25rem; margin: 0 0 1rem; }
  p { line-height: 1.6; } button { min-height: 44px; padding: 0.5rem 0.85rem; border: 1px solid currentColor; border-radius: 0.6rem; }
  footer { display: flex; flex-wrap: wrap; justify-content: end; gap: 0.75rem; }
`;
export default function InstallApp() {
  const pwa = usePwa();
  const dialog = useRef(null), opener = useRef(null);
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
    setOpen(false); opener.current?.focus({ preventScroll: true });
  };
  const install = async () => { if (pwa.installAvailable && await pwa.install()) return; setOpen(true); };
  return <>
    <Button ref={opener} type='button' aria-label='Install app' title='Install app' onClick={install}><FaDownload aria-hidden='true' /></Button>
    <Dialog ref={dialog} aria-labelledby='install-heading' aria-describedby='install-steps' onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => setOpen(false)}>
      <h2 id='install-heading'>Install World Radio App</h2>
      <p id='install-steps'>{pwa.ios ? 'Open this page in Safari. Tap Share, then Add to Home Screen.' : pwa.macSafari ? 'In Safari on Mac, open the File menu and choose Add to Dock.' : 'If your browser offers Install app or Add to home screen in its menu, choose it. You can also use the install button in the address bar. On desktop, Chrome and Edge support installation.'}</p>
      <p>{pwa.offlineReady ? 'Saved stations can open offline. Live radio needs an internet connection.' : pwa.status === 'error' || pwa.status === 'unsupported' ? 'Offline access is not ready in this browser. Online listening is still available.' : 'Preparing offline access. Keep this window online for a moment.'}</p>
      <footer><button type='button' onClick={pwa.check}>{pwa.status === 'error' ? 'Try offline setup again' : 'Check for updates'}</button><button type='button' onClick={close}>Close</button></footer>
    </Dialog>
  </>;
}
