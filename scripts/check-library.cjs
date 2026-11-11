const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { createAppContext, waitForServiceWorker } = require('./browser-context.cjs');
const output = path.resolve('test-results/library', process.env.WRA_BASE_URL ? 'preview' : 'build');
fs.mkdirSync(output, { recursive: true });
const records = [1, 2].map((index) => ({
  id: `rb-12345678-1234-1234-1234-${String(index).padStart(12, '0')}`,
  directoryId: `12345678-1234-1234-1234-${String(index).padStart(12, '0')}`,
  name: `Library ${index}`,
  url: `https://library.fixture.test/${index}`,
  countryCode: 'GB',
  languageCodes: ['en'],
  genres: ['pop'],
  description: '',
}));
const tone = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
  'base64',
);
async function setup(browser, options, seed = true) {
  const context = await createAppContext(browser, {
    viewport: { width: options.width, height: options.width === 320 ? 568 : 900 },
    colorScheme: options.theme,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  await context.addInitScript(
    ({ options, records, seed }) => {
      if (!localStorage.getItem('wra:language:v1'))
        localStorage.setItem(
          'wra:language:v1',
          JSON.stringify({ version: 1, language: options.language }),
        );
      if (!localStorage.getItem('wra:theme:v1'))
        localStorage.setItem('wra:theme:v1', JSON.stringify({ version: 1, mode: options.theme }));
      if (seed && !localStorage.getItem('wra:stations:v1')) {
        localStorage.setItem('wra:stations:v1', JSON.stringify({ version: 1, stations: records }));
        localStorage.setItem(
          'wra:favorites:v1',
          JSON.stringify({
            version: 1,
            stationIds: [
              'heart-uk',
              'dormant-station',
              'capital-dance',
              ...records.map((s) => s.id),
            ],
          }),
        );
      }
      // Exercise the web clipboard path; native share and cancellation have unit coverage.
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      const NativeAudio = Audio;
      window.__libraryAudio = [];
      window.Audio = function (...args) {
        const a = new NativeAudio(...args);
        window.__libraryAudio.push(a);
        return a;
      };
    },
    { options, records, seed },
  );
  for (const url of ['https://media-ice.musicradio.com/CapitalDance', ...records.map((s) => s.url)])
    await context.route(url, (r) =>
      r.fulfill({
        contentType: 'audio/mpeg',
        headers: { 'access-control-allow-origin': '*' },
        body: Buffer.concat(Array(60).fill(tone)),
      }),
    );
  let lookups = 0;
  await context.route('**/.netlify/functions/radio-directory?*', (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ json: { ok: true } });
    const id = new URL(route.request().url()).searchParams.get('id');
    lookups++;
    const station = records.find((s) => s.directoryId === id);
    return route.fulfill({
      json: {
        rows: station
          ? [
              {
                stationuuid: station.directoryId,
                name: station.name,
                url_resolved: station.url,
                countrycode: 'GB',
                languagecodes: 'en',
                tags: 'pop',
              },
            ]
          : [],
        hasMore: false,
      },
    });
  });
  return { context, lookups: () => lookups };
}
async function manage(page) {
  await page.locator('#open-settings').click();
  await page.locator('[data-open-library]').click();
  await page.locator('[data-favorite-order]').waitFor();
}
async function main() {
  const root = path.resolve('build');
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
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`,
    browser = await chromium.launch();
  let scenarios = 0;
  try {
    for (const language of ['en', 'pl'])
      for (const theme of ['light', 'dark'])
        for (const width of [320, 390, 1440]) {
          const options = { language, theme, width },
            owner = await setup(browser, options),
            { context } = owner,
            page = await context.newPage(),
            errors = [];
          page.on('pageerror', (e) => errors.push(e.message));
          await page.goto(base, { waitUntil: 'networkidle' });
          await page.locator('[data-station-id="capital-dance"]').click();
          await page.locator('[data-player-status="playing"]').first().waitFor();
          await page.waitForFunction(() => window.__libraryAudio[0].currentTime > 0.1);
          const source = await page.evaluate(() => window.__libraryAudio[0].src);
          await page.locator('[data-sleep-timer]').click();
          await page.locator('[data-sleep-minutes="15"]').click();
          await manage(page);
          await page.locator('[data-move-down="heart-uk"]').click();
          assert.equal(
            await page.evaluate(() => document.activeElement.dataset.favoriteHeading),
            'heart-uk',
          );
          const order = await page.evaluate(
            () => JSON.parse(localStorage.getItem('wra:favorites:v1')).stationIds,
          );
          assert.deepEqual(order, [
            'capital-dance',
            'dormant-station',
            'heart-uk',
            ...records.map((s) => s.id),
          ]);
          assert.equal(await page.locator('[data-move-up="capital-dance"]').isDisabled(), true);
          await page.locator('[data-favorite-row="capital-dance"] [data-share-station]').click();
          await page
            .locator('[data-favorite-row="capital-dance"] .share-station [role="status"]')
            .waitFor();
          assert.equal(
            await page.evaluate(() => navigator.clipboard.readText()),
            base + '/station/capital-dance',
          );
          await page.locator(`[data-remove-station="${records[1].id}"]`).click();
          await page.locator('[data-cancel-remove]').click();
          assert.equal(await page.locator('[data-added-row]').count(), 2);
          await page.locator(`[data-remove-station="${records[1].id}"]`).click();
          await page.locator('[data-confirm-remove]').click();
          assert.equal(await page.evaluate(() => window.__libraryAudio[0].src), source);
          assert.equal(await page.evaluate(() => window.__libraryAudio[0].paused), false);
          assert.equal(
            await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'),
            'true',
          );
          await page.locator('header a[href="/"]').click();
          await page
            .locator(
              '[aria-label="' +
                (language === 'pl' ? 'Kolekcja stacji' : 'Station collection') +
                '"] button',
            )
            .nth(1)
            .click();
          await page.locator(`[data-station-id="${records[0].id}"]`).waitFor();
          assert.deepEqual(
            await page
              .locator('[data-station-id]')
              .evaluateAll((nodes) => nodes.map((n) => n.dataset.stationId)),
            ['capital-dance', 'heart-uk', records[0].id],
          );
          await page.locator(`[data-station-id="${records[0].id}"]`).click();
          await page.locator('[data-player-status="playing"]').first().waitFor();
          await manage(page);
          await page.locator(`[data-remove-station="${records[0].id}"]`).click();
          await page.locator('[data-confirm-remove]').click();
          assert.equal(await page.evaluate(() => window.__libraryAudio.length), 1);
          assert.equal(
            await page.evaluate(() => window.__libraryAudio[0].getAttribute('src')),
            null,
          );
          assert.equal(await page.locator('[data-player-status="idle"]').count(), 1);
          assert.equal(
            await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'),
            'false',
          );
          assert.equal(
            await page.evaluate(
              () => JSON.parse(localStorage.getItem('wra:stations:v1')).stations.length,
            ),
            0,
          );
          assert.ok(
            await page.evaluate(
              (id) => JSON.parse(localStorage.getItem('wra:recent:v1')).stationIds.includes(id),
              records[0].id,
            ),
          );
          await page.reload({ waitUntil: 'networkidle' });
          assert.deepEqual(
            await page
              .locator('[data-favorite-row]')
              .evaluateAll((nodes) => nodes.map((n) => n.dataset.favoriteRow)),
            ['capital-dance', 'heart-uk'],
          );
          assert.equal(
            await page.evaluate(() => window.__libraryAudio[0].getAttribute('src')),
            null,
          );
          await page.evaluate(() =>
            Object.defineProperty(navigator.clipboard, 'writeText', {
              configurable: true,
              value: async () => {
                throw Error('denied');
              },
            }),
          );
          await page.locator('[data-favorite-row="capital-dance"] [data-share-station]').click();
          const manual = page.locator('[data-favorite-row="capital-dance"] input');
          await manual.waitFor();
          assert.equal(await manual.inputValue(), base + '/station/capital-dance');
          assert.ok(
            await manual.evaluate(
              (n) => n === document.activeElement && n.selectionEnd === n.value.length,
            ),
          );
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          );
          for (const node of await page
            .locator('main button:visible, main select:visible, main input:visible')
            .all()) {
            const box = await node.boundingBox();
            assert.ok(box && box.width >= 44 && box.height >= 44);
          }
          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          assert.deepEqual(
            axe.violations.map((v) => v.id),
            [],
          );
          await page.screenshot({
            path: path.join(output, `${language}-${theme}-${width}.png`),
            fullPage: true,
          });
          if (width === 320) {
            await waitForServiceWorker(page);
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForFunction(() => !!navigator.serviceWorker.controller);
            await context.setOffline(true);
            await page.goto(base + '/station/capital-dance', { waitUntil: 'domcontentloaded' });
            await page.locator('[data-station-id="capital-dance"]').waitFor();
            assert.equal(
              await page.evaluate(() => window.__libraryAudio[0].getAttribute('src')),
              null,
            );
            await page.goto(base + '/library', { waitUntil: 'domcontentloaded' });
            await page.locator('[data-favorite-order]').waitFor();
            assert.equal(owner.lookups(), 0);
          }
          const receiver = await setup(browser, options, false),
            recipient = await receiver.context.newPage();
          recipient.on('pageerror', (e) => errors.push(e.message));
          await recipient.goto(base + '/station/' + records[0].id, { waitUntil: 'networkidle' });
          await recipient.locator('[data-add-shared]').waitFor();
          assert.equal(
            await recipient.evaluate(() => localStorage.getItem('wra:stations:v1')),
            null,
          );
          assert.equal(
            await recipient.evaluate(() => window.__libraryAudio[0].getAttribute('src')),
            null,
          );
          await recipient.locator('[data-add-shared]').click();
          await recipient.locator('[data-station-id]').waitFor();
          assert.equal(
            await recipient.evaluate(() => window.__libraryAudio[0].getAttribute('src')),
            null,
          );
          await recipient.locator('article button[aria-pressed]').click();
          await recipient.reload({ waitUntil: 'networkidle' });
          assert.equal(await recipient.locator('article button[aria-pressed="true"]').count(), 1);
          assert.equal(receiver.lookups(), 1);
          assert.equal(
            await recipient.evaluate(() => window.__libraryAudio[0].getAttribute('src')),
            null,
          );
          assert.equal(await recipient.evaluate(() => window.__libraryAudio.length), 1);
          await recipient.goto(base + '/station/not-in-catalog', { waitUntil: 'networkidle' });
          await recipient.getByRole('alert').waitFor();
          assert.equal(receiver.lookups(), 1);
          assert.deepEqual(errors, []);
          await receiver.context.close();
          await context.close();
          scenarios++;
        }
    console.log(
      'LIBRARY_RESULT ' +
        JSON.stringify({
          passed: true,
          scenarios,
          favoriteOrder: true,
          reloadPersistence: true,
          clipboard: true,
          manualShareFallback: true,
          removalPlaybackAndTimer: true,
          dormantIdsPreserved: true,
          recipientPreviewAndAdd: true,
          noAutoplay: true,
          offlineRoutes: true,
          accessibility: true,
        }),
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
