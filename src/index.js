import ReactDOM from "react-dom/client";
import App from "./App.js";
import { AudioProvider } from "./context/AudioContext.js";
import { FavoritesProvider } from "./context/FavoritesContext.js";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <FavoritesProvider>
    <AudioProvider>
      <App />
    </AudioProvider>
  </FavoritesProvider>
);
