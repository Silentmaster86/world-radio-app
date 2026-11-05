import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import SoundBar from './components/Layout/SoundBar';
import Home from './pages/Home';
import NowPlaying from './pages/NowPlaying';
import { BrowsingProvider } from './context/BrowsingContext';

const AppWrapper = styled.div`
  min-height: 100dvh;
  padding-bottom: ${({ $car, $playerHeight }) => $car ? '0' : `calc(${$playerHeight}px + 1.5rem)`};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;
function AppShell() {
  const location = useLocation();
  const isCar = location.pathname === '/now-playing';
  const [playerHeight, setPlayerHeight] = useState(176);
  return <AppWrapper $car={isCar} $playerHeight={playerHeight}>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/now-playing' element={<NowPlaying />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
    {!isCar && <SoundBar onHeightChange={setPlayerHeight} />}
  </AppWrapper>;
}
export default function App() {
  return <Router><BrowsingProvider><AppShell /></BrowsingProvider></Router>;
}
