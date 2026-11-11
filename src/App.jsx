import DirectoryClickReporter from './components/DirectoryClickReporter';
import { lazy, Suspense, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { useLanguage } from './context/LanguageContext';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
  Link,
} from 'react-router-dom';
import styled from 'styled-components';
import SoundBar from './components/Layout/SoundBar';
import Home from './pages/Home';
const Discover = lazy(() => import('./pages/Discover'));
const Library = lazy(() => import('./pages/Library'));
const SharedStation = lazy(() => import('./pages/SharedStation'));
import NowPlaying from './pages/NowPlaying';
import { PwaProvider } from './context/PwaContext';
import { BrowsingProvider } from './context/BrowsingContext';
import { RecentStationsProvider } from './context/RecentStationsContext';

const AppWrapper = styled.div`
  min-height: 100dvh;
  padding-bottom: ${({ $car, $playerHeight }) => ($car ? '0' : `calc(${$playerHeight}px + 1.5rem)`)};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;
function AppShell() {
  const location = useLocation();
  const { t } = useLanguage();
  const isCar = location.pathname === '/now-playing';
  const [playerHeight, setPlayerHeight] = useState(176);
  return (
    <AppWrapper $car={isCar} $playerHeight={playerHeight}>
      <ErrorBoundary
        key={location.pathname}
        fallback={
          <main style={{ padding: '1rem' }}>
            <p role="alert">{t('nav.loadError')}</p>
            <Link style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center' }} to="/">
              {t('discover.back')}
            </Link>
          </main>
        }
      >
        <Suspense fallback={<p role="status">{t('settings.loading')}</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/library" element={<Library />} />
            <Route path="/station/:id" element={<SharedStation />} />
            <Route path="/now-playing" element={<NowPlaying />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {!isCar && <SoundBar onHeightChange={setPlayerHeight} />}
    </AppWrapper>
  );
}
export default function App() {
  return (
    <PwaProvider>
      <RecentStationsProvider>
        <DirectoryClickReporter />
        <Router>
          <BrowsingProvider>
            <AppShell />
          </BrowsingProvider>
        </Router>
      </RecentStationsProvider>
    </PwaProvider>
  );
}
