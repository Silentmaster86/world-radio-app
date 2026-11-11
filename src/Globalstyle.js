import './styles/visual.css';
import { createGlobalStyle } from 'styled-components';
export const GlobalStyle = createGlobalStyle`
  :root {
    --wra-bg: ${({ theme }) => theme.colors.background};
    --wra-surface: ${({ theme }) => theme.colors.surface};
    --wra-raised: ${({ theme }) => theme.colors.raised};
    --wra-text: ${({ theme }) => theme.colors.text};
    --wra-muted: ${({ theme }) => theme.colors.muted};
    --wra-accent: ${({ theme }) => theme.colors.accent};
    --wra-on-accent: ${({ theme }) => theme.colors.onAccent};
    --wra-line: ${({ theme }) => theme.colors.line};
    --wra-border: ${({ theme }) => theme.colors.border};
    --wra-live: ${({ theme }) => theme.colors.secondary};
    --wra-atmosphere: ${({ theme }) => theme.colors.atmosphere};
    --wra-horizon: ${({ theme }) => theme.colors.horizon};
    --wra-shadow: ${({ theme }) => theme.colors.shadow};
    --wra-danger: ${({ theme }) => theme.colors.danger};
  }
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-padding-bottom: calc(var(--radio-player-height, 0px) + 1rem); }
  body {
    margin: 0;
    min-height: 100dvh;
    isolation: isolate;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.5;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }
  button { cursor: pointer; font: inherit; color: inherit; background: none; border: 0; }
  input, select { font: inherit; }
  input[type='range'] { accent-color: ${({ theme }) => theme.colors.accent}; min-height: 44px; }
  button:focus-visible, input:focus-visible, select:focus-visible, a:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent}; outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important; scroll-behavior: auto !important;
    }
  }
`;
