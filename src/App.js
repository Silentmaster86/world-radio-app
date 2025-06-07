// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AudioProvider } from "./context/AudioContext";
import SoundBar from "./components/Layout/SoundBar";
import Home from "./pages/Home";
import NowPlaying from "./pages/NowPlaying";

function App() {
  return (
    <AudioProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-white pb-28 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/now-playing" element={<NowPlaying />} />
            {/* Add more pages here if needed in the future */}
          </Routes>
          <SoundBar />
        </div>
      </Router>
    </AudioProvider>
  );
}

export default App;
