const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadCuratedStations,
  looksLikeAudio,
  checkStream,
  checkAll,
} = require('./check-streams.cjs');

const station = (url = 'https://radio.example/live') => ({
  id: 'example',
  name: 'Example Radio',
  url,
});
const audio = () =>
  new Response(Buffer.from([0xff, 0xfb, 0x90, 0x64, 0, 1]), {
    status: 200,
    headers: { 'content-type': 'audio/mpeg' },
  });

test('loads curated URLs from the existing station source', () => {
  const stations = loadCuratedStations();
  assert.equal(stations.length, 12);
  assert.ok(stations.every((s) => s.id && s.name && s.url.startsWith('https://')));
  assert.equal(new Set(stations.map((s) => s.id)).size, stations.length);
  assert.ok(stations.every((s) => !s.id.startsWith('somafm-')));
  assert.ok(stations.some((s) => s.id === 'pr-chicago'));
  assert.equal(stations.filter((s) => s.fallbackUrls.length > 0).length, 3);
  assert.ok(stations.every((s) => s.fallbackUrls.every((url) => url.startsWith('https://'))));
});

test('reports bounded audio sample without downloading the stream', async () => {
  const result = await checkStream(station(), {
    fetchImpl: async () =>
      new Response(Buffer.alloc(10000, 0xff), {
        headers: { 'content-type': 'audio/mpeg' },
      }),
    maxBytes: 128,
  });
  assert.equal(result.status, 200);
  assert.equal(result.bytes, 128);
  assert.equal(result.likelyAudio, true);
  assert.equal(result.redirects, 0);
});

test('follows relative HTTPS redirects and records final address', async () => {
  const visited = [];
  const result = await checkStream(station('https://radio.example/listen'), {
    fetchImpl: async (url, options) => {
      visited.push([url, options.redirect]);
      return visited.length === 1
        ? new Response(null, { status: 302, headers: { location: '/live' } })
        : audio();
    },
  });
  assert.equal(result.redirects, 1);
  assert.equal(result.finalUrl, 'https://radio.example/live');
  assert.equal(result.likelyAudio, true);
  assert.deepEqual(
    visited.map(([url]) => url),
    ['https://radio.example/listen', 'https://radio.example/live'],
  );
  assert.ok(visited.every(([, redirect]) => redirect === 'manual'));
});

test('rejects insecure redirect destinations', async () => {
  const result = await checkStream(station(), {
    fetchImpl: async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'http://radio.example/live' },
      }),
  });
  assert.equal(result.likelyAudio, false);
  assert.match(result.error, /HTTPS/);
});

test('rejects redirect loops after the configured limit', async () => {
  const result = await checkStream(station(), {
    fetchImpl: async () =>
      new Response(null, {
        status: 302,
        headers: { location: '/again' },
      }),
    maxRedirects: 1,
  });
  assert.equal(result.redirects, 1);
  assert.match(result.error, /limit exceeded/);
});

test('distinguishes an HTML response from audio', async () => {
  const result = await checkStream(station(), {
    fetchImpl: async () =>
      new Response('<html>not a stream</html>', {
        headers: { 'content-type': 'text/html' },
      }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.likelyAudio, false);
  assert.equal(result.bytes, 25);
  assert.equal(looksLikeAudio('audio/mpeg', Buffer.from('<html>login</html>')), false);
});

test('does not treat playlists as audio bytes', () => {
  assert.equal(looksLikeAudio('audio/x-mpegurl', Buffer.from('#EXTM3U\n')), false);
  assert.equal(looksLikeAudio('application/octet-stream', Buffer.from('OggSfoo')), true);
});

test('records HTTP errors without stopping the remaining checks', async () => {
  const entries = [station('https://radio.example/down'), station('https://radio.example/up')];
  const results = await checkAll(entries, {
    concurrency: 1,
    fetchImpl: async (url) =>
      url.endsWith('/down')
        ? new Response('Unavailable', { status: 503, headers: { 'content-type': 'text/plain' } })
        : audio(),
  });
  assert.equal(results.length, 2);
  assert.equal(results[0].status, 503);
  assert.equal(results[0].likelyAudio, false);
  assert.equal(results[1].likelyAudio, true);
});

test('bounds concurrent requests', async () => {
  let active = 0;
  let peak = 0;
  const entries = Array.from({ length: 7 }, (_, i) => station('https://radio.example/' + i));
  const results = await checkAll(entries, {
    concurrency: 2,
    fetchImpl: async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return audio();
    },
  });
  assert.equal(peak, 2);
  assert.equal(results.length, 7);
});

test('times out a stalled station', async () => {
  const result = await checkStream(station(), {
    timeoutMs: 20,
    fetchImpl: async (_, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
  });
  assert.equal(result.likelyAudio, false);
  assert.equal(result.error, 'Timed out');
});
