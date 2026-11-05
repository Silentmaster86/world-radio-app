import { createGlobalStyle } from 'styled-components';
export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-padding-bottom: calc(var(--radio-player-height, 0px) + 1rem); }
  body {
    margin: 0;
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
