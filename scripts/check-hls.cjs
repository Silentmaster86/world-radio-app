// Real audio decoding through the production HLS engine. No Audio/play mocks.
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createAppContext, waitForServiceWorker } = require('./browser-context.cjs');
const uuid = '12345678-1234-1234-1234-123456789abc';
const root = path.resolve('build');
const aac = process.env.WRA_HLS_CODEC === 'aac';
const tone = Buffer.from(
  fs.readFileSync(
    path.join(__dirname, aac ? 'fixtures/hls-tone.ts.base64' : 'fixtures/hls-tone.mp3.base64'),
    'utf8',
  ),
  'base64',
);
const playlist =
  '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:7\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:6.1,\n0.' +
  (aac ? 'ts' : 'mp3') +
  '\n#EXT-X-ENDLIST\n';
async function main() {
  const server = http.createServer((req, res) => {
    const requested = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!requested.startsWith(root + path.sep) && requested !== root)
      return res.writeHead(403).end();
    const file =
      fs.existsSync(requested) && fs.statSync(requested).isFile()
        ? requested
        : path.join(root, 'index.html');
    const type = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    }[path.extname(file)];
    res.setHeader('Content-Type', type || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(
    process.env.WRA_BROWSER_EXECUTABLE
      ? { executablePath: process.env.WRA_BROWSER_EXECUTABLE }
      : {},
  );
  try {
    const context = await createAppContext(browser, { viewport: { width: 390, height: 844 } });
    await context.addInitScript(
      ({ uuid }) => {
        localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language: 'en' }));
        if (!localStorage.getItem('wra:stations:v1'))
          localStorage.setItem(
            'wra:stations:v1',
            JSON.stringify({
              version: 1,
              stations: [
                {
                  directoryId: uuid,
                  name: 'HLS fixture',
                  countryCode: 'GB',
                  languageCodes: ['en'],
                  genres: [],
                  url: 'https://hls.fixture.test/live.m3u8',
                  streamType: 'hls',
                },
              ],
            }),
          );
        const NativeAudio = window.Audio;
        window.__testAudio = [];
        window.Audio = function (...args) {
          const audio = new NativeAudio(...args);
          window.__testAudio.push(audio);
          return audio;
        };
      },
      { uuid },
    );
    let manifests = 0,
      segments = 0,
      engines = 0;
    context.on('request', (req) => {
      if (/\/hlsPlayback[^/]*\.js/.test(req.url())) engines++;
    });
    await context.route('https://hls.fixture.test/**', (route) => {
      const manifest = route.request().url().endsWith('.m3u8');
      if (manifest) manifests++;
      else segments++;
      return route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*' },
        contentType: manifest ? 'application/vnd.apple.mpegurl' : aac ? 'video/mp2t' : 'audio/mpeg',
        body: manifest ? playlist : tone,
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(base + '/?q=HLS+fixture', { waitUntil: 'networkidle' });
    await waitForServiceWorker(page);
    assert.equal(engines, 0, 'HLS must not be precached or downloaded before playback');
    assert.equal(manifests, 0);
    await page.locator('article button[aria-pressed]').click();
    await page.locator(`[data-station-id="rb-${uuid}"]`).click();
    try {
      await page.locator('[data-player-status="playing"]').first().waitFor({ timeout: 20000 });
    } catch (error) {
      console.error(
        await page.evaluate(() => ({
          status: document.querySelector('[data-player-status]')?.outerHTML,
          audios: window.__testAudio.map((a) => ({
            src: a.src,
            currentSrc: a.currentSrc,
            time: a.currentTime,
            paused: a.paused,
            ready: a.readyState,
            error: a.error?.code,
            native: a.canPlayType('application/vnd.apple.mpegurl'),
          })),
        })),
        { manifests, segments, engines, errors },
      );
      throw error;
    }
    await page.waitForFunction(() => window.__testAudio[0]?.currentTime > 0.1);
    const media = await page.evaluate(() => ({
      count: window.__testAudio.length,
      src: window.__testAudio[0].currentSrc,
      readyState: window.__testAudio[0].readyState,
      error: window.__testAudio[0].error?.code,
      nativeHls: !!window.__testAudio[0].canPlayType('application/vnd.apple.mpegurl'),
    }));
    assert.equal(media.count, 1);
    if (media.nativeHls) {
      assert.ok(media.src.startsWith('https://hls.fixture.test/'));
      assert.equal(engines, 0, 'Native HLS must not download the MSE engine');
    } else {
      assert.ok(media.src.startsWith('blob:'), 'MSE playback must use the shared blob source');
      assert.ok(engines > 0);
    }
    assert.ok(media.readyState >= 3);
    assert.ok(manifests > 0 && segments > 0);
    assert.ok(
      await page.evaluate(
        (uuid) =>
          JSON.parse(localStorage.getItem('wra:recent:v1')).stationIds.includes(`rb-${uuid}`),
        uuid,
      ),
    );
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__testAudio[0].paused), true);
    assert.equal(await page.evaluate(() => window.__testAudio[0].getAttribute('src')), null);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => window.__testAudio.length), 1);
    assert.equal(await page.evaluate(() => window.__testAudio[0].getAttribute('src')), null);
    assert.equal(await page.locator('article').count(), 1);
    assert.equal(await page.locator('article button[aria-pressed="true"]').count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      'HLS_RESULT ' +
        JSON.stringify({
          passed: true,
          realDecoding: true,
          codec: aac ? 'AAC' : 'MP3',
          mode: media.nativeHls ? 'native' : 'MediaSource',
          sharedAudio: true,
          pauseCleanup: true,
          persistence: true,
          favorites: true,
          history: true,
          noAutoplay: true,
          lazyEngine: true,
          manifests,
          segments,
        }),
    );
    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
