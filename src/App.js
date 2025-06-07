// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import styled from "styled-components";
import { AudioProvider } from "./context/AudioContext";
import SoundBar from "./components/Layout/SoundBar";
import Home from "./pages/Home";
import NowPlaying from "./pages/NowPlaying";

const AppWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom, #0a0a0a, #000);
  color: white;
  padding: 0 1rem 7rem;
`;

function App() {
  return (
    <AudioProvider>
      <Router>
        <AppWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/now-playing" element={<NowPlaying />} />
            {/* Add more pages here if needed in the future */}
          </Routes>
          <SoundBar />
        </AppWrapper>
      </Router>
    </AudioProvider>
  );
}

export default App;