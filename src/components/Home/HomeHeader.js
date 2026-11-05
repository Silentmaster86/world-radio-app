import styled from 'styled-components';
import { FaGlobeEurope } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
const Header = styled.header`
  display: flex; align-items: start; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  padding: 1rem 0;
  h1 { display: flex; align-items: center; gap: 0.6rem; font-size: clamp(1.4rem, 4vw, 2rem); margin: 0; }
  p { color: ${({ theme }) => theme.colors.muted}; line-height: 1.5; margin: 0.5rem 0 0; }
  label { display: grid; gap: 0.35rem; font-size: 0.875rem; }
  select { min-height: 44px; border-radius: 0.65rem; padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface}; color: ${({ theme }) => theme.colors.text}; }
`;
export default function HomeHeader() {
  const { mode, setThemeMode, storageMessage } = useTheme();
  return <Header>
    <div><h1><FaGlobeEurope aria-hidden='true' /> World Radio App</h1><p>Your stations. One place to listen.</p></div>
    <label htmlFor='appearance'>Appearance<select id='appearance' value={mode} onChange={(event) => setThemeMode(event.target.value)}>
      <option value='system'>System</option><option value='light'>Light</option><option value='dark'>Dark</option>
    </select></label>
    {storageMessage && <p role='status'>{storageMessage}</p>}
  </Header>;
}
