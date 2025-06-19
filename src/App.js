import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import styled from "styled-components";
import { AnimatePresence } from "framer-motion";
import SoundBar from "./components/Layout/SoundBar";
import Home from "./pages/Home";
import NowPlaying from "./pages/NowPlaying";
import PageTransition from "./components/Layout/PageTransition";

const AppWrapper = styled.div`
  min-height: 89vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: 0 ${({ theme }) => theme.spacing.sm} 8rem;

  @media (max-width: 1440px) {
    padding-top: 1rem;
  }

  @media (max-width: 1024px) {
    padding-bottom: 8.1rem;
  }
`;

// 👇 Move AnimatePresence and useLocation into a proper route-aware component
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<PageTransition><Home /></PageTransition>}
        />
        <Route
          path="/now-playing"
          element={<PageTransition><NowPlaying /></PageTransition>}
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper>
        <AnimatedRoutes />
        <SoundBar />
      </AppWrapper>
    </Router>
  );
}

export default App;
