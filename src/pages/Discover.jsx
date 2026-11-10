import HomeHeader from '../components/Home/HomeHeader';
import { countryOptions } from '../lib/countries';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useStations } from '../context/StationsContext';
import { useLanguage } from '../context/LanguageContext';
import { normalizeDirectoryStation } from '../lib/addedStations';
const Page = styled.main`
  max-width: 900px;
  margin: auto;
  padding: 1rem;
  form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: end;
    margin: 1.25rem 0;
  }
  .country-field {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .country-field select {
    flex: 1;
    width: 0;
  }
  .intro {
    color: ${({ theme }) => theme.colors.muted};
  }
  > h1 {
    font-size: 1.75rem;
    letter-spacing: -0.035em;
    margin: 1.5rem 0 0.5rem;
  }
  @media (max-width: 640px) {
    .intro {
      display: none;
    }
    > h1 {
      font-size: 1.4rem;
      margin: 1rem 0 0.5rem;
    }
  }
  .directory-info {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.muted};
    margin-top: 1.5rem;
  }
  summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  article h2 {
    margin: 0 0 0.25rem;
    font-size: 0.95rem;
  }
  article p {
    margin: 0;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  article button {
    min-width: 44px;
  }
  article details p {
    margin: 0.5rem 0;
  }
  label {
    display: grid;
    gap: 0.3rem;
    flex: 1 1 180px;
    min-width: 0;
  }
  input,
  select,
  button,
  a {
    min-height: 44px;
  }
  input,
  select,
  button {
    padding: 0.65rem;
    font: inherit;
    border: 1px solid currentColor;
    border-radius: 0.6rem;
    background: ${({ theme }) => theme.colors.surface};
    color: inherit;
  }
  input,
  select {
    width: 100%;
    min-width: 0;
  }
  a {
    display: inline-flex;
    align-items: center;
  }
  article {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.85rem;
    padding: 0.65rem;
    margin: 0.5rem 0;
    overflow-wrap: anywhere;
  }
  article div {
    min-width: 0;
  }
  article button {
    flex-shrink: 0;
  }
  h2 {
    font-size: 1.1rem;
  }
`;
export default function Discover() {
  const { t, language } = useLanguage();
  const { stations, addStation, storageIssue } = useStations();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [result, setResult] = useState({ rows: [], page: 0, hasMore: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const controller = useRef(null);
  const serial = useRef(0);
  const lastQuery = useRef(null);
  useEffect(
    () => () => {
      serial.current += 1;
      controller.current?.abort();
    },
    [],
  );
  async function search(page = 0, overrides = {}) {
    controller.current?.abort();
    const current = ++serial.current;
    const abort = new AbortController();
    controller.current = abort;
    const query = page
      ? lastQuery.current
      : { q: q.trim(), country: country.trim().toUpperCase(), ...overrides };
    lastQuery.current = query;
    const timeout = setTimeout(() => abort.abort(), 15000);
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/.netlify/functions/radio-directory?${new URLSearchParams({ ...query, page })}`,
        { signal: abort.signal },
      );
      if (!response.ok) throw new Error('directory');
      const data = await response.json();
      if (!Array.isArray(data.rows)) throw new Error('directory');
      if (current !== serial.current) return;
      const rows = data.rows.filter(
        (row) =>
          typeof row?.name === 'string' &&
          row.name.trim() &&
          /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(row.stationuuid || ''),
      );
      setResult((previous) => ({
        rows: [
          ...new Map(
            [...(page ? previous.rows : []), ...rows].map((row) => [row.stationuuid, row]),
          ).values(),
        ],
        page,
        hasMore: data.hasMore === true,
      }));
      setSearched(true);
    } catch {
      if (current === serial.current) setError(t('discover.error'));
    } finally {
      clearTimeout(timeout);
      if (current === serial.current) setBusy(false);
    }
  }
  return (
    <Page>
      <HomeHeader headingAs="div" back />
      <h1>{t('discover.heading')}</h1>
      <p className="intro">{t('discover.intro')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <label>
          {t('discover.name')}
          <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} />
        </label>
        <button disabled={q.trim().length < 2 && !/^[a-z]{2}$/i.test(country.trim())}>
          {t('discover.search')}
        </button>
        <label className="country-field">
          {t('discover.country')}
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t('filters.allCountries')}</option>
            {countryOptions(language).map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </form>
      {storageIssue && <p role="status">{t('discover.storage')}</p>}
      {error && <p role="alert">{error}</p>}
      <p role="status">
        {busy
          ? t('discover.loading')
          : searched
            ? t('discover.count', {
                count: result.rows.length,
                compatible: result.rows.filter((row) => normalizeDirectoryStation(row)).length,
              })
            : ''}
      </p>
      {searched && !busy && result.rows.length === 0 && <p>{t('discover.empty')}</p>}
      {result.rows.map((row) => {
        const station = normalizeDirectoryStation(row);
        const existing =
          station && stations.find((s) => s.id === station.id || s.url === station.url);
        return (
          <article key={row.stationuuid}>
            <div>
              <h2>{row.name.slice(0, 120)}</h2>
              <p>
                {station?.countryCode || String(row.countrycode || '').slice(0, 2)} ·{' '}
                {station?.genres.join(', ') || String(row.codec || '').slice(0, 24)}
              </p>
              {!station && (
                <details>
                  <summary>{t('discover.unsupportedShort')}</summary>
                  <p>{t('discover.unsupported')}</p>
                </details>
              )}
            </div>
            <button
              disabled={!station || !!existing}
              aria-label={!station ? t('discover.unavailableLabel') : undefined}
              onClick={() => {
                if (!addStation(row)) setError(t('discover.limit'));
              }}
            >
              {t(!station ? 'discover.unavailable' : existing ? 'discover.added' : 'discover.add')}
            </button>
          </article>
        );
      })}
      {searched && !busy && lastQuery.current?.country && q.trim().length >= 2 && (
        <button
          onClick={() => {
            setCountry('');
            search(0, { country: '' });
          }}
        >
          {t('discover.allCountries')}
        </button>
      )}
      {result.hasMore && (
        <button disabled={busy} onClick={() => search(result.page + 1)}>
          {t('discover.more')}
        </button>
      )}
      {searched && (
        <p>
          <button onClick={() => navigate('/')}>{t('discover.back')}</button>
        </p>
      )}
      <p className="directory-info">
        <a href="https://www.radio-browser.info/" target="_blank" rel="noreferrer">
          Radio Browser
        </a>{' '}
        · {t('discover.notice')}
      </p>
    </Page>
  );
}
