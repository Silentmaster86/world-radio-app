import styled from 'styled-components';
import { getCountryName } from '../../lib/stationUtils';

const Controls = styled.section`
  margin: 1.5rem 0; display: grid; gap: 1rem;
`;
const Row = styled.div`
  display: flex; flex-wrap: wrap; align-items: end; gap: 0.75rem;
`;
const Field = styled.label`
  display: grid; gap: 0.4rem; flex: 1 1 150px; min-width: 0; font-size: 0.875rem;
  input, select {
    width: 100%; min-height: 44px; padding: 0.65rem 0.75rem;
    border-radius: 0.65rem; border: 1px solid ${({ theme }) => theme.colors.muted};
    background: ${({ theme }) => theme.colors.surface || theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }
  input::placeholder { color: ${({ theme }) => theme.colors.muted}; opacity: 1; }
`;
const SectionButton = styled.button`
  min-height: 44px; padding: 0.6rem 1rem; border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.muted};
  background: ${({ $active, theme }) => $active ? theme.colors.accent : 'transparent'};
  color: ${({ $active, theme }) => $active ? (theme.colors.onAccent || '#fff') : theme.colors.text};
  cursor: pointer;
`;
const Reset = styled(SectionButton)`border-radius: 0.65rem;`;
export default function StationControls({ filters, options, updateFilters, resetFilters, total, favoriteCount }) {
  const languages = { en: 'English', pl: 'Polish' };
  return <Controls aria-label='Find stations'>
    <Row role='group' aria-label='Station collection'>
      <SectionButton type='button' $active={filters.section === 'all'} aria-pressed={filters.section === 'all'} onClick={() => updateFilters({ section: 'all' })}>All stations ({total})</SectionButton>
      <SectionButton type='button' $active={filters.section === 'favorites'} aria-pressed={filters.section === 'favorites'} onClick={() => updateFilters({ section: 'favorites' })}>Favorites ({favoriteCount})</SectionButton>
    </Row>
    <Field htmlFor='station-search'>Search stations
      <input id='station-search' type='search' placeholder='Station name…' value={filters.q} onChange={(event) => updateFilters({ q: event.target.value })} />
    </Field>
    <Row>
      <Field htmlFor='station-country'>Country<select id='station-country' value={filters.country} onChange={(event) => updateFilters({ country: event.target.value })}>
        <option value=''>All countries</option>{options.countries.map((code) => <option key={code} value={code}>{getCountryName(code)}</option>)}
      </select></Field>
      <Field htmlFor='station-genre'>Genre<select id='station-genre' value={filters.genre} onChange={(event) => updateFilters({ genre: event.target.value })}>
        <option value=''>All genres</option>{options.genres.map((genre) => <option key={genre}>{genre}</option>)}
      </select></Field>
      <Field htmlFor='station-language'>Language<select id='station-language' value={filters.language} onChange={(event) => updateFilters({ language: event.target.value })}>
        <option value=''>All languages</option>{options.languages.map((code) => <option key={code} value={code}>{languages[code] || code}</option>)}
      </select></Field>
      <Reset type='button' onClick={resetFilters}>Reset filters</Reset>
    </Row>
  </Controls>;
}
