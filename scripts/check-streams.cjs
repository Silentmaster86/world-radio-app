// Manual network diagnostic. Never run from the app or its deterministic CI checks.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const MAX_BYTES = 2048;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 4;
const CONCURRENCY = 3;

function loadCuratedStations(filename = path.join(__dirname, '../src/data/stations.js')) {
  // Evaluate only the repository's trusted station data in a restricted context.
  // The browser-only logo import is replaced with empty objects; IDs and URLs are unchanged.
  const source = fs.readFileSync(filename, 'utf8');
  const withoutImport = source.replace(
    /^import\s+\{\s*stationLogos\s*\}\s+from\s+['"]\.\/stationLogos['"];?\r?\n/m,
    '',
  );
  if (withoutImport === source || !withoutImport.includes('export const stations =')) {
    throw new Error('Station data format changed: update the diagnostic loader.');
  }
  const expression = withoutImport.replace('export const stations =', 'const stations =');
  const logos = new Proxy({}, { get: () => ({}) });
  const stations = vm.runInNewContext(
    expression + '\nstations',
    { stationLogos: logos },
    {
      timeout: 1000,
    },
  );
  if (!Array.isArray(stations) || !stations.length) {
    throw new Error('No curated stations found.');
  }
  return Array.from(stations, (station) => {
    if (
      typeof station.id !== 'string' ||
      typeof station.name !== 'string' ||
      typeof station.url !== 'string'
    ) {
      throw new Error('Invalid curated station record.');
    }
    return {
      id: station.id,
      name: station.name,
      url: station.url,
      fallbackUrls: Array.isArray(station.fallbackUrls) ? Array.from(station.fallbackUrls) : [],
    };
  });
}

function looksLikeAudio(contentType, sample) {
  if (!sample.length) return false;
  const mime = contentType.split(';')[0].trim().toLowerCase();
  const prefix = sample.subarray(0, 100).toString('utf8').trimStart().toLowerCase();
  if (
    prefix.startsWith('<!doctype') ||
    prefix.startsWith('<html') ||
    prefix.startsWith('#extm3u') ||
    prefix.startsWith('[playlist]')
  )
    return false;
  const signature = sample.subarray(0, 4).toString('latin1');
  const magic =
    signature.startsWith('ID3') ||
    signature === 'OggS' ||
    signature === 'fLaC' ||
    (sample.length > 1 && sample[0] === 0xff && (sample[1] & 0xe0) === 0xe0);
  const mimeAudio =
    (mime.startsWith('audio/') && !mime.includes('mpegurl') && !mime.includes('playlist')) ||
    mime === 'application/ogg';
  return magic || mimeAudio;
}

async function readBoundedSample(response, maxBytes) {
  if (!response.body || !response.ok) {
    if (response.body) await response.body.cancel().catch(() => {});
    return Buffer.alloc(0);
  }
  const reader = response.body.getReader();
  const parts = [];
  let bytes = 0;
  try {
    while (bytes < maxBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      const part = chunk.subarray(0, maxBytes - bytes);
      parts.push(part);
      bytes += part.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(parts, bytes);
}

async function checkStream(
  station,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = TIMEOUT_MS,
    maxBytes = MAX_BYTES,
    maxRedirects = MAX_REDIRECTS,
  } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let currentUrl = station.url;
  const redirects = [];
  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const parsed = new URL(currentUrl);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
        throw new Error('Only credential-free HTTPS stream URLs are supported');
      }
      const response = await fetchImpl(parsed.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'audio/*, */*;q=0.8',
          'Icy-MetaData': '0',
          'User-Agent': 'WorldRadioApp-StreamDiagnostics/1.0',
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (response.body) await response.body.cancel().catch(() => {});
        if (!location) throw new Error('Redirect without Location header');
        if (hop === maxRedirects) throw new Error('Redirect limit exceeded');
        currentUrl = new URL(location, parsed.href).href;
        redirects.push(currentUrl);
        continue;
      }
      const contentType = response.headers.get('content-type') || '';
      const sample = await readBoundedSample(response, maxBytes);
      return {
        id: station.id,
        name: station.name,
        status: response.status,
        contentType,
        redirects: redirects.length,
        finalUrl: parsed.href,
        bytes: sample.length,
        likelyAudio: response.ok && looksLikeAudio(contentType, sample),
        error: '',
      };
    }
  } catch (error) {
    return {
      id: station.id,
      name: station.name,
      status: null,
      contentType: '',
      redirects: redirects.length,
      finalUrl: currentUrl,
      bytes: 0,
      likelyAudio: false,
      error: controller.signal.aborted ? 'Timed out' : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkAll(stations, { concurrency = CONCURRENCY, ...options } = {}) {
  const results = new Array(stations.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), stations.length) }, async () => {
      while (next < stations.length) {
        const index = next++;
        results[index] = await checkStream(stations[index], options);
      }
    }),
  );
  return results;
}

async function main() {
  const stations = loadCuratedStations();
  const entries = stations.flatMap((station) => [
    { id: station.id, name: station.name + ' (main)', url: station.url },
    ...station.fallbackUrls.map((url, i) => ({
      id: station.id,
      name: station.name + ' (backup ' + (i + 1) + ')',
      url,
    })),
  ]);
  console.log(
    'Checking ' +
      entries.length +
      ' curated stream endpoints (max ' +
      TIMEOUT_MS +
      ' ms each, ' +
      MAX_BYTES +
      ' sampled bytes, ' +
      CONCURRENCY +
      ' concurrent requests).',
  );
  const results = await checkAll(entries);
  for (const result of results) {
    const label = result.likelyAudio ? 'OK' : 'CHECK';
    console.log(
      '[' +
        label +
        '] ' +
        result.name +
        ' | HTTP ' +
        (result.status ?? '-') +
        ' | ' +
        (result.contentType || '-') +
        ' | bytes ' +
        result.bytes +
        ' | redirects ' +
        result.redirects,
    );
    if (result.redirects) console.log('  Final URL: ' + result.finalUrl);
    if (result.error) console.log('  Error: ' + result.error);
  }
  const ok = results.filter((result) => result.likelyAudio).length;
  console.log(
    'Summary: ' +
      ok +
      '/' +
      results.length +
      ' returned likely audio data. Recheck any CHECK results manually.',
  );
  if (ok !== results.length) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Stream diagnostic failed: ' + error.message);
    process.exitCode = 1;
  });
}

module.exports = { loadCuratedStations, looksLikeAudio, readBoundedSample, checkStream, checkAll };
