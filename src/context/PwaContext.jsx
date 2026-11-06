import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPwaManager, isIOS, isMacSafari, isStandalone } from '../lib/pwaManager';
const PwaContext = createContext();
export function PwaProvider({ children }) {
  const manager = useRef(null);
  const [dismissed, setDismissed] = useState(null);
  const [snapshot, setSnapshot] = useState(() => ({
    status: 'checking',
    offlineReady: false,
    updateAvailable: false,
    updateId: 0,
    installAvailable: false,
    installed: isStandalone(window, navigator),
    ios: isIOS(navigator),
    macSafari: isMacSafari(navigator),
  }));
  useEffect(() => {
    const instance = createPwaManager();
    manager.current = instance;
    const unsubscribe = instance.subscribe(setSnapshot);
    setSnapshot(instance.getSnapshot());
    instance.start();
    return () => {
      unsubscribe();
      instance.dispose();
      manager.current = null;
    };
  }, []);
  return (
    <PwaContext.Provider
      value={{
        ...snapshot,
        updateVisible: snapshot.updateAvailable && dismissed !== snapshot.updateId,
        dismissUpdate: () => setDismissed(snapshot.updateId),
        install: () => manager.current?.install(),
        check: () => manager.current?.check(),
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}
export const usePwa = () => useContext(PwaContext);
