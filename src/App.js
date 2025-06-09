// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import { AudioProvider } from "./context/AudioContext";
import SoundBar from "./components/Layout/SoundBar";
import Home from "./pages/Home";
import NowPlaying from "./pages/NowPlaying";
import { useTheme } from "./context/ThemeContext";

const AppWrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: 0 ${({ theme }) => theme.spacing.sm} 7rem;
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 9rem;
  padding: 0.6rem 1rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  border: none;
`;

function App() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <AudioProvider>
      <Router>
        <AppWrapper>
          <ToggleButton onClick={toggleTheme}>
            Switch to {isDarkMode ? "Light" : "Dark"} Mode
          </ToggleButton>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/now-playing" element={<NowPlaying />} />
          </Routes>
          <SoundBar />
        </AppWrapper>
      </Router>
    </AudioProvider>
  );
}

export default App;
