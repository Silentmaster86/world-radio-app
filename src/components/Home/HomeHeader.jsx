import styled from 'styled-components';
import { FaGlobeEurope } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
const Header = styled.header`
  display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 0.5rem 1rem;
  padding: 1rem 0;
  h1 { display: flex; align-items: center; gap: 0.6rem; font-size: clamp(1.4rem, 4vw, 2rem); line-height: 1.2; margin: 0; min-width: 0; }
  h1 svg { flex-shrink: 0; }
  p { grid-column: 1 / -1; color: ${({ theme }) => theme.colors.muted}; line-height: 1.5; margin: 0; }
  label { grid-column: 2; grid-row: 1; display: grid; gap: 0.35rem; font-size: 0.875rem; }
  select { min-height: 44px; border-radius: 0.65rem; padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text}; }
  @media (max-width: 640px) { padding: 0.5rem 0; p { font-size: 0.875rem; } }
`;
export default function HomeHeader() {
  const { mode, setThemeMode, storageMessage } = useTheme();
  return <Header>
    <h1><FaGlobeEurope aria-hidden='true' /><span>World Radio App</span></h1>
    <label htmlFor='appearance'>Appearance<select id='appearance' value={mode} onChange={(event) => setThemeMode(event.target.value)}>
      <option value='system'>System</option><option value='light'>Light</option><option value='dark'>Dark</option>
    </select></label>
    <p>Your stations. One place to listen.</p>
    {storageMessage && <p role='status'>{storageMessage}</p>}
  </Header>;
}
