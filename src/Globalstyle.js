import './styles/base.css';
import './styles/controls.css';
import './styles/visual.css';
import { createGlobalStyle } from 'styled-components';
export const GlobalStyle = createGlobalStyle`
  :root {
    ${({ theme }) =>
      Object.entries(theme.colors)
        .map(
          ([key, value]) =>
            `--wra-${{ background: 'bg', secondary: 'live', onAccent: 'on-accent' }[key] || key}: ${value};`,
        )
        .join('')}
  }
`;
