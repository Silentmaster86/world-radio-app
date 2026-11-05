import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BrowsingContext = createContext();
export function BrowsingProvider({ children }) {
  const lastBrowse = useRef(null);
  useLayoutEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  return <BrowsingContext.Provider value={lastBrowse}>{children}</BrowsingContext.Provider>;
}
export function safeBrowseSearch(value) {
  return typeof value === 'string' && (value === '' || value.startsWith('?')) ? value : '';
}
export function usePlayerNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBrowse = useContext(BrowsingContext);
  return {
    openPlayer() {
      const browse = { search: location.search, scrollY: window.scrollY, focusId: document.activeElement?.id };
      lastBrowse.current = browse;
      navigate('/now-playing', { state: { browse } });
    },
    returnToStations() {
      const browse = location.state?.browse || lastBrowse.current;
      navigate(`/${safeBrowseSearch(browse?.search)}`, { state: { restoreBrowse: browse } });
    },
  };
}
export function useBrowseRestoration() {
  const location = useLocation();
  const lastBrowse = useContext(BrowsingContext);
  const initial = useRef(location);
  useLayoutEffect(() => {
    const entry = initial.current;
    const browse = entry.state?.restoreBrowse || lastBrowse.current;
    if (browse && safeBrowseSearch(browse.search) === entry.search) {
      document.getElementById(browse.focusId)?.focus({ preventScroll: true });
      window.scrollTo(0, Number.isFinite(browse.scrollY) ? Math.max(0, browse.scrollY) : 0);
    }
  }, [lastBrowse]);
}
