import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BrowsingContext = createContext();
export function BrowsingProvider({ children }) {
  const lastBrowse = useRef(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  useLayoutEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  return <BrowsingContext.Provider value={{ lastBrowse, filtersExpanded, setFiltersExpanded }}>{children}</BrowsingContext.Provider>;
}
export function useFilterDisclosure() {
  const shared = useContext(BrowsingContext);
  const [local, setLocal] = useState(false);
  return shared ? [shared.filtersExpanded, shared.setFiltersExpanded] : [local, setLocal];
}
export function safeBrowseSearch(value) {
  return typeof value === 'string' && (value === '' || value.startsWith('?')) ? value : '';
}
export function usePlayerNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lastBrowse } = useContext(BrowsingContext);
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
  const { lastBrowse } = useContext(BrowsingContext);
  const initial = useRef(location);
  useLayoutEffect(() => {
    const entry = initial.current;
    const browse = entry.state?.restoreBrowse || lastBrowse.current;
    if (browse && safeBrowseSearch(browse.search) === entry.search) {
      document.getElementById(browse.focusId)?.focus({ preventScroll: true });
      const y = Number.isFinite(browse.scrollY) ? Math.max(0, browse.scrollY) : 0;
      window.scrollTo(0, y);
      // Dock measurement and browser scroll anchoring can settle after this
      // layout effect. Reapply once the routed list has completed a paint.
      let settledFrame;
      const firstFrame = window.requestAnimationFrame(() => {
        settledFrame = window.requestAnimationFrame(() => window.scrollTo(0, y));
      });
      return () => {
        window.cancelAnimationFrame(firstFrame);
        if (settledFrame !== undefined) window.cancelAnimationFrame(settledFrame);
      };
    }
    return undefined;
  }, [lastBrowse]);
}
