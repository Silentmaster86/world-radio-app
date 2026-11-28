import { FaFilter } from 'react-icons/fa';
import { useFilterDisclosure } from '../../context/BrowsingContext';
import { getCountryName } from '../../lib/stationUtils';
import { useLanguage } from '../../context/LanguageContext';

export default function StationControls({
  filters,
  options,
  updateFilters,
  resetFilters,
  total,
  favoriteCount,
  recentCount = 0,
}) {
  const [expanded, setExpanded] = useFilterDisclosure();
  const { t } = useLanguage();
  const activeCount = [filters.country, filters.genre, filters.language].filter(Boolean).length;
  return (
    <section className="station-controls" aria-label={t('filters.find')}>
      <div className="collection-tabs" role="group" aria-label={t('filters.collection')}>
        <button
          className="section-button"
          type="button"
          aria-pressed={filters.section === 'all'}
          onClick={() => updateFilters({ section: 'all' })}
        >
          {t('filters.all', { count: total })}
        </button>
        <button
          className="section-button"
          type="button"
          aria-pressed={filters.section === 'favorites'}
          onClick={() => updateFilters({ section: 'favorites' })}
        >
          {t('filters.favorites', { count: favoriteCount })}
        </button>
        <button
          className="section-button"
          id="recent-collection"
          type="button"
          aria-pressed={filters.section === 'recent'}
          onClick={() => updateFilters({ section: 'recent' })}
        >
          {t('filters.recent', { count: recentCount })}
        </button>
      </div>
      <div className="station-search-row">
        <label className="filter-field search-field" htmlFor="station-search">
          <span>{t('filters.search')}</span>
          <input
            id="station-search"
            type="search"
            placeholder={t('filters.placeholder')}
            value={filters.q}
            onChange={(event) => updateFilters({ q: event.target.value })}
          />
        </label>
        <button
          className="filter-button"
          type="button"
          aria-expanded={expanded}
          aria-controls="station-refinements"
          onClick={() => setExpanded((value) => !value)}
        >
          <FaFilter aria-hidden="true" />
          <span>
            {activeCount ? t('filters.active', { count: activeCount }) : t('filters.filters')}
          </span>
        </button>
      </div>
      {(activeCount > 0 || filters.q || filters.section !== 'all') && (
        <div className="mobile-toolbar">
          <button className="section-button" type="button" onClick={resetFilters}>
            {t('filters.reset')}
          </button>
        </div>
      )}
      <div className="station-refinements" id="station-refinements" data-open={expanded}>
        <label className="filter-field" htmlFor="station-country">
          {t('filters.country')}
          <select
            id="station-country"
            value={filters.country}
            onChange={(event) => updateFilters({ country: event.target.value })}
          >
            <option value="">{t('filters.allCountries')}</option>
            {options.countries.map((code) => (
              <option key={code} value={code}>
                {t(`country.${code}`, {}, getCountryName(code))}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field" htmlFor="station-genre">
          {t('filters.genre')}
          <select
            id="station-genre"
            value={filters.genre}
            onChange={(event) => updateFilters({ genre: event.target.value })}
          >
            <option value="">{t('filters.allGenres')}</option>
            {options.genres.map((genre) => (
              <option key={genre} value={genre}>
                {t(`genre.${genre}`, {}, genre)}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field" htmlFor="station-language">
          {t('filters.language')}
          <select
            id="station-language"
            value={filters.language}
            onChange={(event) => updateFilters({ language: event.target.value })}
          >
            <option value="">{t('filters.allLanguages')}</option>
            {options.languages.map((code) => (
              <option key={code} value={code}>
                {t(`language.${code}`, {}, code)}
              </option>
            ))}
          </select>
        </label>
        <button className="section-button desktop-reset" type="button" onClick={resetFilters}>
          {t('filters.reset')}
        </button>
      </div>
    </section>
  );
}
