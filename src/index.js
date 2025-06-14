import ReactDOM from "react-dom/client";
import App from "./App.js";
import { AudioProvider } from "./context/AudioContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ThemeProvider } from "styled-components";
import { theme } from "./darkTheme.js";
import { GlobalStyle } from "./Globalstyle.js";
import { ThemeProviderToggle, useTheme } from "./context/ThemeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
const AppWithTheme = () => {
  const { theme } = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  );
};

root.render(
  <FavoritesProvider>
    <AudioProvider>
      <ThemeProviderToggle>
        <AppWithTheme />
      </ThemeProviderToggle>
    </AudioProvider>
  </FavoritesProvider>
);