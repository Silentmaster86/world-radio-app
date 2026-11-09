import styled from 'styled-components';
import { useFilterDisclosure } from '../../context/BrowsingContext';
import { getCountryName } from '../../lib/stationUtils';
import { useLanguage } from '../../context/LanguageContext';

const Controls = styled.section`
  margin: 1.5rem 0;
  display: grid;
  gap: 1rem;
  @media (max-width: 640px) {
    margin: 0.75rem 0;
    gap: 0.65rem;
  }
`;
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem;
`;
const CollectionRow = styled(Row)`
  @media (max-width: 640px) {
    flex-wrap: nowrap;
    > button {
      flex: 1;
      min-width: 0;
      padding: 0.25rem;
      font-size: 0.875rem;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
  }
`;
const Field = styled.label`
  display: grid;
  gap: 0.4rem;
  flex: 1 1 150px;
  min-width: 0;
  font-size: 0.875rem;
  input,
  select {
    width: 100%;
    min-height: 44px;
    padding: 0.65rem 0.75rem;
    border-radius: 0.65rem;
    border: 1px solid ${({ theme }) => theme.colors.muted};
    background: ${({ theme }) => theme.colors.surface || theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }
  input::placeholder {
    color: ${({ theme }) => theme.colors.muted};
    opacity: 1;
  }
`;
const SectionButton = styled.button`
  min-height: 44px;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.muted};
  background: ${({ $active, theme }) => ($active ? theme.colors.accent : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.onAccent || '#fff' : theme.colors.text)};
  cursor: pointer;
`;
const Reset = styled(SectionButton)`
  border-radius: 0.65rem;
`;
const FilterButton = styled(Reset)`
  display: none;
  @media (max-width: 640px) {
    display: inline-block;
  }
`;
const MobileToolbar = styled(Row)`
  display: none;
  @media (max-width: 640px) {
    display: flex;
  }
`;
const DesktopReset = styled(Reset)`
  @media (max-width: 640px) {
    display: none;
  }
`;
const Refinements = styled(Row)`
  @media (max-width: 640px) {
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
  }
`;
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
    <Controls aria-label={t('filters.find')}>
      <CollectionRow role="group" aria-label={t('filters.collection')}>
        <SectionButton
          type="button"
          $active={filters.section === 'all'}
          aria-pressed={filters.section === 'all'}
          onClick={() => updateFilters({ section: 'all' })}
        >
          {t('filters.all', { count: total })}
        </SectionButton>
        <SectionButton
          type="button"
          $active={filters.section === 'favorites'}
          aria-pressed={filters.section === 'favorites'}
          onClick={() => updateFilters({ section: 'favorites' })}
        >
          {t('filters.favorites', { count: favoriteCount })}
        </SectionButton>
        <SectionButton
          id="recent-collection"
          type="button"
          $active={filters.section === 'recent'}
          aria-pressed={filters.section === 'recent'}
          onClick={() => updateFilters({ section: 'recent' })}
        >
          {t('filters.recent', { count: recentCount })}
        </SectionButton>
      </CollectionRow>
      <Field htmlFor="station-search">
        {t('filters.search')}
        <input
          id="station-search"
          type="search"
          placeholder={t('filters.placeholder')}
          value={filters.q}
          onChange={(event) => updateFilters({ q: event.target.value })}
        />
      </Field>
      <MobileToolbar>
        <FilterButton
          type="button"
          aria-expanded={expanded}
          aria-controls="station-refinements"
          onClick={() => setExpanded((value) => !value)}
        >
          {activeCount ? t('filters.active', { count: activeCount }) : t('filters.filters')}
        </FilterButton>
        <Reset type="button" onClick={resetFilters}>
          {t('filters.reset')}
        </Reset>
      </MobileToolbar>
      <Refinements id="station-refinements" $open={expanded}>
        <Field htmlFor="station-country">
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
        </Field>
        <Field htmlFor="station-genre">
          {t('filters.genre')}
          <select
            id="station-genre"
            value={filters.genre}
            onChange={(event) => updateFilters({ genre: event.target.value })}
          >
            <option value="">{t('filters.allGenres')}</option>
            {options.genres.map((genre) => (
              <option key={genre} value={genre}>{t(`genre.${genre}`, {}, genre)}</option>
            ))}
          </select>
        </Field>
        <Field htmlFor="station-language">
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
        </Field>
        <DesktopReset type="button" onClick={resetFilters}>
          Reset filters
        </DesktopReset>
      </Refinements>
    </Controls>
  );
}
