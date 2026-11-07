import styled from 'styled-components';
const Panel = styled.div`
  padding: 2rem 1rem;
  text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.muted};
  border-radius: 1rem;
  p {
    color: ${({ theme }) => theme.colors.muted};
    line-height: 1.6;
  }
  button {
    min-height: 44px;
    padding: 0.65rem 1rem;
    border-radius: 0.65rem;
    cursor: pointer;
    border: 1px solid currentColor;
    background: transparent;
  }
`;
export default function EmptyState({ emptyFavorites, emptyRecent = false, onClear, onBrowse }) {
  const emptyCollection = emptyFavorites || emptyRecent;
  return (
    <Panel>
      <h2>
        {emptyFavorites
          ? 'Your favorites start here'
          : emptyRecent
            ? 'No recent stations to show'
            : 'No matching stations'}
      </h2>
      <p>
        {emptyFavorites
          ? 'Use the heart button on a station to save it here.'
          : emptyRecent
            ? 'Stations appear here after playback starts. History stays on this device.'
            : 'Try another station name or clear the country, genre and language filters.'}
      </p>
      <button type="button" onClick={emptyCollection ? onBrowse : onClear}>
        {emptyCollection ? 'Browse all stations' : 'Clear search and filters'}
      </button>
    </Panel>
  );
}
