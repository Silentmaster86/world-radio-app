import { useLanguage } from '../../context/LanguageContext';
export default function EmptyState({ emptyFavorites, emptyRecent = false, onClear, onBrowse }) {
  const emptyCollection = emptyFavorites || emptyRecent;
  const { t } = useLanguage();
  return (
    <div className="empty-state">
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
    </div>
  );
}
