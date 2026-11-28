import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

export const DESIGN_KEY = 'wra:design:v1';
export const DESIGNS = ['classic', 'orbit', 'pulse', 'analog', 'signal'];
export const prepareDesign = (id) =>
  id === 'classic'
    ? Promise.resolve(null)
    : import('../designs/loader').then(({ loadDesign }) => loadDesign(id));
const Context = createContext({ design: 'classic', module: null });
export const useDesign = () => useContext(Context);
export function DesignProvider({ children }) {
  const [saved] = useState(() =>
    readStorage(
      DESIGN_KEY,
      null,
      (value) =>
        value &&
        Number.isInteger(value.version) &&
        value.version >= 1 &&
        (value.version > 1 || DESIGNS.includes(value.design)),
    ),
  );
  const [state, setState] = useState({ design: 'classic', module: null });
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const generation = useRef(0);
  async function setDesign(id, persist = true) {
    if (!DESIGNS.includes(id)) return false;
    const request = ++generation.current;
    setPending(id);
    setError('');
    try {
      const module = await prepareDesign(id);
      if (request !== generation.current) return false;
      setState({ design: id, module });
      if (
        persist &&
        (saved.value?.version > 1 || !writeStorage(DESIGN_KEY, { version: 1, design: id }))
      )
        setError('session');
      return true;
    } catch {
      if (request === generation.current) setError('load');
      return false;
    } finally {
      if (request === generation.current) setPending('');
    }
  }
  useEffect(() => {
    if (saved.value?.version === 1) setDesign(saved.value.design, false);
    return () => {
      // Cancel downloads that finish after the provider is removed.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
    };
    // Restore once; subsequent changes are deliberate user choices.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);
  useEffect(() => {
    document.documentElement.dataset.design = state.design;
    return () => {
      delete document.documentElement.dataset.design;
    };
  }, [state.design]);
  return (
    <Context.Provider value={{ ...state, pending, error, setDesign }}>{children}</Context.Provider>
  );
}
export function DesignSlot({ part, children }) {
  const { module } = useDesign();
  const Component = module?.[part];
  return Component ? <Component /> : children || null;
}
