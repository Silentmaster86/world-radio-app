import { resolveSrv } from 'node:dns/promises';
const validHost = (host) => /^[a-z0-9-]+\.api\.radio-browser\.info$/.test(host);
export function createHandler({
  lookup = resolveSrv,
  request = globalThis.fetch,
  random = Math.random,
} = {}) {
  return async (event) => {
    const input = event.queryStringParameters || {};
    const click =
      event.httpMethod === 'POST' &&
      /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(input.click || '');
    if (event.httpMethod !== 'GET' && !click) return { statusCode: 405, body: '' };
    const id = String(input.id || '').toLowerCase();
    if (input.id !== undefined && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id))
      return { statusCode: 400, body: '{}' };
    const query = String(input.q || '')
      .trim()
      .slice(0, 80);
    const rawCountry = String(input.country || '')
      .trim()
      .toUpperCase();
    const country = rawCountry === 'UK' ? 'GB' : rawCountry;
    const page = Math.min(40, Math.max(0, Number.parseInt(input.page, 10) || 0));
    if (!click && !id && query.length < 2 && !/^[A-Z]{2}$/.test(country))
      return { statusCode: 400, body: '{}' };
    let hosts;
    try {
      hosts = (await lookup('_api._tcp.radio-browser.info'))
        .map((r) => r.name.replace(/\.$/, ''))
        .filter(validHost);
    } catch {
      hosts = [];
    }
    if (!hosts.length)
      hosts = [
        'de1.api.radio-browser.info',
        'nl1.api.radio-browser.info',
        'at1.api.radio-browser.info',
      ];
    hosts = [...new Set(hosts)];
    const start = Math.floor(random() * hosts.length);
    hosts = [...hosts.slice(start), ...hosts.slice(0, start)].slice(0, 3);
    const params = new globalThis.URLSearchParams({
      name: query,
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true',
      limit: '25',
      offset: String(page * 25),
    });
    if (/^[A-Z]{2}$/.test(country)) params.set('countrycode', country);
    for (const host of hosts) {
      try {
        const response = await request(
          `https://${host}${click ? '/json/url/' + input.click : id ? '/json/stations/byuuid/' + id : '/json/stations/search?' + params}`,
          {
            headers: {
              'User-Agent':
                'WorldRadioApp/1.0 (+https://github.com/Silentmaster86/world-radio-app)',
              Accept: 'application/json',
            },
            signal: globalThis.AbortSignal.timeout(3500),
            redirect: 'error',
          },
        );
        if (!response.ok) continue;
        const bytes = await response.text();
        if (bytes.length > 500000) continue;
        const rows = JSON.parse(bytes);
        if (click)
          return { statusCode: 200, headers: { 'Cache-Control': 'no-store' }, body: '{"ok":true}' };
        if (!Array.isArray(rows)) continue;
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
          body: JSON.stringify({
            rows: id
              ? rows
                  .filter((row) => String(row?.stationuuid || '').toLowerCase() === id)
                  .slice(0, 1)
              : rows.slice(0, 25),
            hasMore: !id && rows.length === 25 && page < 40,
          }),
        };
      } catch {
        /* Try another discovered mirror. */
      }
    }
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: '{"error":"unavailable"}',
    };
  };
}
export const handler = createHandler();
