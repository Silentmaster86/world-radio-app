import ReactDOM from "react-dom/client";
import App from "./App.js";
import { AudioProvider } from "./context/AudioContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ThemeProvider } from "styled-components";
import { theme } from "./theme";
import { GlobalStyle } from "./Globalstyle.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <FavoritesProvider>
    <AudioProvider>
      <ThemeProvider theme={theme}>
      <GlobalStyle />
        <App />
      </ThemeProvider>
    </AudioProvider>
  </FavoritesProvider>
);
