import styled from 'styled-components';
import { usePwa } from '../../context/PwaContext';
const Notice = styled.div`
  margin-top: 0.5rem; display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
  font-size: 0.875rem; color: ${({ theme }) => theme.colors.text};
  p { flex: 1 1 220px; margin: 0; }
  button { min-height: 44px; padding: 0.5rem 0.75rem; border: 1px solid currentColor; border-radius: 0.6rem; }
`;
export default function UpdateNotice() {
  const pwa = usePwa();
  if (!pwa?.updateVisible) return null;
  return <Notice role='status'><p>Update ready. Finish listening, close all app windows and tabs, then reopen.</p><button type='button' onClick={pwa.dismissUpdate}>Later</button></Notice>;
}
