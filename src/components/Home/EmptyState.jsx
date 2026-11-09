import styled from 'styled-components';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t } = useLanguage();
  return (
    <Panel>
      <h2>
        {emptyFavorites
          ? t('empty.favoritesTitle')
          : emptyRecent
            ? t('empty.recentTitle')
            : t('empty.noMatches')}
      </h2>
      <p>
        {emptyFavorites
          ? t('empty.favoritesText')
          : emptyRecent
            ? t('empty.recentText')
            : t('empty.noMatchesText')}
      </p>
      <button type="button" onClick={emptyCollection ? onBrowse : onClear}>
        {emptyCollection ? t('empty.browse') : t('empty.clear')}
      </button>
    </Panel>
  );
}
