import styled from 'styled-components';
const Panel = styled.div`
  padding: 2rem 1rem; text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.muted}; border-radius: 1rem;
  p { color: ${({ theme }) => theme.colors.muted}; line-height: 1.6; }
  button { min-height: 44px; padding: 0.65rem 1rem; border-radius: 0.65rem; cursor: pointer;
    border: 1px solid currentColor; background: transparent; }
`;
export default function EmptyState({ emptyFavorites, onClear, onBrowse }) {
  return <Panel>
    <h2>{emptyFavorites ? 'Your favorites start here' : 'No matching stations'}</h2>
    <p>{emptyFavorites ? 'Use the heart button on a station to save it here.' : 'Try another station name or clear the country, genre and language filters.'}</p>
    <button type='button' onClick={emptyFavorites ? onBrowse : onClear}>{emptyFavorites ? 'Browse all stations' : 'Clear search and filters'}</button>
  </Panel>;
}
