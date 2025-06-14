// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import styled from "styled-components";
import { AudioProvider } from "./context/AudioContext";
import SoundBar from "./components/Layout/SoundBar";
import Home from "./pages/Home";
import NowPlaying from "./pages/NowPlaying";

const AppWrapper = styled.div`
  min-height: 80vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  padding: 0 ${({ theme }) => theme.spacing.sm} 8rem;

  @media(max-width: 1440px) {
    padding-top: 1rem;
  }

  @media(max-width: 1024px) {
    padding-bottom: 6rem;
  }

  @media(max-width: 1440px) {
    padding-bottom: 8rem;
  }

  @media(max-width: 1440px) {
    padding-bottom: 9rem;
  }
  
`;

function App() {

  return (
    <AudioProvider>
      <Router>
        <AppWrapper>
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
