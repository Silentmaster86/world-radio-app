import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useStations } from '../context/StationsContext';
import { useLanguage } from '../context/LanguageContext';
import { normalizeDirectoryStation } from '../lib/addedStations';
const Page = styled.main`
  max-width: 900px;
  margin: auto;
  padding: 1rem;
  form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: end;
  }
  label {
    display: grid;
    gap: 0.3rem;
    flex: 1 1 180px;
    min-width: 0;
  }
  input,
  button,
  a {
    min-height: 44px;
  }
  input,
  button {
    padding: 0.65rem;
    font: inherit;
    border: 1px solid currentColor;
    border-radius: 0.6rem;
    background: ${({ theme }) => theme.colors.surface};
    color: inherit;
  }
  input {
    width: 100%;
  }
  a {
    display: inline-flex;
    align-items: center;
  }
  article {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.75rem;
    padding: 0.75rem;
    margin: 0.75rem 0;
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
  const { t } = useLanguage();
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
  async function search(page = 0) {
    controller.current?.abort();
    const current = ++serial.current;
    const abort = new AbortController();
    controller.current = abort;
    const query = page ? lastQuery.current : { q: q.trim(), country: country.trim().toUpperCase() };
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
      const rows = data.rows.filter((row) => normalizeDirectoryStation(row));
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
      <Link to="/">{t('discover.back')}</Link>
      <h1>{t('discover.title')}</h1>
      <p>{t('discover.intro')}</p>
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
        <label>
          {t('discover.country')}
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            maxLength={2}
            pattern="[A-Za-z]{2}|"
            placeholder="PL"
          />
        </label>
        <button disabled={q.trim().length < 2 && !/^[a-z]{2}$/i.test(country.trim())}>
          {t('discover.search')}
        </button>
      </form>
      <p>
        <a href="https://www.radio-browser.info/" target="_blank" rel="noreferrer">
          Radio Browser
        </a>{' '}
        · {t('discover.notice')}
      </p>
      {storageIssue && <p role="status">{t('discover.storage')}</p>}
      {error && <p role="alert">{error}</p>}
      <p role="status">
        {busy
          ? t('discover.loading')
          : searched
            ? t('discover.count', { count: result.rows.length })
            : ''}
      </p>
      {result.rows.map((row) => {
        const station = normalizeDirectoryStation(row);
        const existing = stations.find((s) => s.id === station.id || s.url === station.url);
        return (
          <article key={station.id}>
            <div>
              <h2>{station.name}</h2>
              <p>
                {station.countryCode} · {station.genres.join(', ')}
              </p>
            </div>
            <button
              disabled={!!existing}
              onClick={() => {
                if (!addStation(row)) setError(t('discover.limit'));
              }}
            >
              {t(existing ? 'discover.added' : 'discover.add')}
            </button>
          </article>
        );
      })}
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
    </Page>
  );
}
