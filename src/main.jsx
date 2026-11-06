import ReactDOM from 'react-dom/client';
import App from './App';
import { AudioProvider } from './context/AudioContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './Globalstyle.js';
import { ThemeProviderToggle, useTheme } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

const AppWithTheme = () => {
  const { theme } = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <FavoritesProvider>
      <AudioProvider>
        <ThemeProviderToggle>
          <AppWithTheme />
        </ThemeProviderToggle>
      </AudioProvider>
    </FavoritesProvider>
  </ErrorBoundary>,
);
