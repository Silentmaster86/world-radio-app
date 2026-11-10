// Fixture streams, real browser audio, file upload/download and local persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { createAppContext } = require('./browser-context.cjs');
const output = path.resolve('test-results/backup', process.env.WRA_BASE_URL ? 'preview' : 'build');
fs.mkdirSync(output, { recursive: true });
const uuid = '12345678-1234-1234-1234-123456789abc';
const duplicate = '22345678-1234-1234-1234-123456789abc';
const station = (id, name, url) => ({
  id: `rb-${id}`,
  directoryId: id,
  name,
  url,
  countryCode: 'GB',
  languageCodes: ['en'],
  genres: ['pop'],
  ...(url.endsWith('.m3u8') ? { streamType: 'hls' } : {}),
});
const incoming = (language, theme) => ({
  app: 'world-radio-app',
  version: 1,
  stations: [
    station(uuid, 'Imported HLS', 'https://radio.example/hls.m3u8'),
    station(duplicate, 'Duplicate Capital', 'https://media-ice.musicradio.com/CapitalDance'),
  ],
  favoriteIds: [`rb-${uuid}`, `rb-${duplicate}`, 'dormant-station'],
  recentIds: [`rb-${uuid}`, `rb-${duplicate}`],
  settings: { language, theme, volume: 0.3, muted: true },
});
const upload = (value) => ({
  name: 'world-radio-backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(value)),
});
async function setup(browser, { language, theme, width }, favorites = true, options = {}) {
  const context = await createAppContext(browser, {
    viewport: { width, height: width === 320 ? 568 : 900 },
    colorScheme: theme,
    ...options,
  });
  await context.addInitScript(
    ({ language, theme, favorites }) => {
      if (!localStorage.getItem('wra:language:v1'))
        localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language }));
      if (!localStorage.getItem('wra:theme:v1'))
        localStorage.setItem('wra:theme:v1', JSON.stringify({ version: 1, mode: theme }));
      if (favorites && !localStorage.getItem('wra:favorites:v1'))
        localStorage.setItem(
          'wra:favorites:v1',
          JSON.stringify({ version: 1, stationIds: ['capital-dance'] }),
        );
      const Original = Audio;
      window.__backupAudio = [];
      window.Audio = function (...args) {
        const audio = new Original(...args);
        window.__backupAudio.push(audio);
        return audio;
      };
    },
    { language, theme, favorites },
  );
  const tone = Buffer.from(
    fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
    'base64',
  );
  await context.route('https://media-ice.musicradio.com/CapitalDance', (route) =>
    route.fulfill({
      contentType: 'audio/mpeg',
      headers: { 'access-control-allow-origin': '*' },
      body: Buffer.concat(Array(60).fill(tone)),
    }),
  );
  return context;
}
async function openPanel(page) {
  await page.locator('#open-settings').click();
  await page.locator('[data-open-backup]').click();
  await page.locator('[data-backup-file]').waitFor();
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
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  let scenarios = 0;
  try {
    for (const language of ['en', 'pl'])
      for (const theme of ['light', 'dark'])
        for (const width of [320, 390, 1440]) {
          const context = await setup(browser, { language, theme, width }),
            page = await context.newPage(),
            errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(base + '/?q=Capital+Dance', { waitUntil: 'networkidle' });
          await page.locator('[data-station-id="capital-dance"]').click();
          await page.locator('[data-player-status="playing"]').first().waitFor();
          await page.waitForFunction(() => window.__backupAudio[0]?.currentTime > 0.1);
          const source = await page.evaluate(() => window.__backupAudio[0].src);
          await page.locator('[data-sleep-timer]').click();
          await page.locator('[data-sleep-minutes="15"]').click();
          await openPanel(page);
          const before = await page.evaluate(() => ({ ...localStorage }));
          await page.locator('[data-backup-file]').setInputFiles({
            name: 'invalid.json',
            mimeType: 'application/json',
            buffer: Buffer.from('{broken'),
          });
          await page.getByRole('alert').waitFor();
          assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), before);
          const nextLanguage = language === 'en' ? 'pl' : 'en',
            nextTheme = theme === 'light' ? 'dark' : 'light';
          const file = upload(incoming(nextLanguage, nextTheme));
          await page.locator('[data-backup-file]').setInputFiles(file);
          await page.locator('[data-backup-preview]').waitFor();
          assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), before);
          await page.locator('[data-backup-cancel]').click();
          assert.equal(await page.locator('[data-backup-preview]').count(), 0);
          await page.locator('[data-backup-file]').setInputFiles(file);
          await page.locator('[data-backup-preview]').waitFor();
          assert.equal(await page.locator('[data-backup-settings]').isChecked(), false);
          assert.ok(
            await page.evaluate(() => {
              const d = document.querySelector('dialog[open]');
              return (
                d.scrollWidth <= d.clientWidth + 1 &&
                document.documentElement.scrollWidth <= innerWidth + 1
              );
            }),
          );
          for (const locator of [
            page.locator('[data-backup-panel] button'),
            page.locator('[data-backup-file]'),
            page.locator('label').filter({ has: page.locator('[data-backup-settings]') }),
          ])
            for (const node of await locator.all()) {
              const box = await node.boundingBox();
              assert.ok(box.width >= 44 && box.height >= 44);
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
          await page.locator('[data-backup-apply]').click();
          await page.locator('[data-backup-message]').waitFor();
          const merged = await page.evaluate(() => ({
            stations: JSON.parse(localStorage.getItem('wra:stations:v1')).stations,
            favorites: JSON.parse(localStorage.getItem('wra:favorites:v1')).stationIds,
            recent: JSON.parse(localStorage.getItem('wra:recent:v1')).stationIds,
            count: window.__backupAudio.length,
            src: window.__backupAudio[0].src,
            paused: window.__backupAudio[0].paused,
          }));
          assert.equal(merged.stations.length, 1);
          assert.equal(merged.stations[0].streamType, 'hls');
          assert.deepEqual(merged.favorites, ['capital-dance', `rb-${uuid}`, 'dormant-station']);
          assert.deepEqual(merged.recent, ['capital-dance', `rb-${uuid}`]);
          assert.equal(merged.count, 1);
          assert.equal(merged.src, source);
          assert.equal(merged.paused, false);
          assert.equal(
            await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'),
            'true',
          );
          assert.equal(await page.locator('#language').inputValue(), language);
          assert.equal(await page.locator('#appearance').inputValue(), theme);
          const downloadEvent = page.waitForEvent('download');
          await page.locator('[data-backup-export]').click();
          const download = await downloadEvent;
          const downloaded = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
          assert.equal(downloaded.app, 'world-radio-app');
          assert.equal(downloaded.stations.length, 1);
          assert.deepEqual(downloaded.favoriteIds, merged.favorites);
          await page.locator('[data-backup-file]').setInputFiles(file);
          await page.locator('[data-backup-preview]').waitFor();
          await page.locator('[data-backup-settings]').check();
          await page.locator('[data-backup-apply]').click();
          assert.equal(await page.locator('#language').inputValue(), nextLanguage);
          assert.equal(await page.locator('#appearance').inputValue(), nextTheme);
          assert.equal(await page.evaluate(() => window.__backupAudio[0].paused), false);
          assert.equal(
            await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'),
            'true',
          );
          await page.locator('#close-settings').click();
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await page.evaluate(() => window.__backupAudio.length), 1);
          assert.equal(
            await page.evaluate(() => window.__backupAudio[0].getAttribute('src')),
            null,
          );
          assert.equal(
            await page.evaluate(
              () => JSON.parse(localStorage.getItem('wra:stations:v1')).stations.length,
            ),
            1,
          );
          if (width === 320) {
            await page.waitForFunction(
              async () => !!(await navigator.serviceWorker.getRegistration())?.active,
            );
            // Installation can finish after the first reload on a real host.
            // This app deliberately avoids claim/skipWaiting: navigate online
            // under the active worker before asking it to serve an offline page.
            await page.reload({ waitUntil: 'networkidle' });
            await page.waitForFunction(() => !!navigator.serviceWorker.controller);
            await context.setOffline(true);
            await page.reload({ waitUntil: 'domcontentloaded' });
            await openPanel(page);
            await page.locator('[data-backup-file]').setInputFiles(upload(downloaded));
            await page.locator('[data-backup-preview]').waitFor();
            await page.locator('[data-backup-apply]').click();
            await page.locator('[data-backup-message]').waitFor();
            assert.equal(
              await page.evaluate(() => window.__backupAudio[0].getAttribute('src')),
              null,
            );
          }
          if (scenarios === 0) {
            const fresh = await setup(
                browser,
                { language: 'en', theme: 'dark', width: 390 },
                false,
              ),
              restore = await fresh.newPage();
            await restore.goto(base, { waitUntil: 'networkidle' });
            await openPanel(restore);
            await restore.locator('[data-backup-file]').setInputFiles(upload(downloaded));
            await restore.locator('[data-backup-preview]').waitFor();
            await restore.locator('[data-backup-apply]').click();
            await restore.locator('[data-backup-message]').waitFor();
            assert.deepEqual(
              await restore.evaluate(
                () => JSON.parse(localStorage.getItem('wra:favorites:v1')).stationIds,
              ),
              downloaded.favoriteIds,
            );
            assert.equal(
              await restore.evaluate(() => window.__backupAudio[0].getAttribute('src')),
              null,
            );
            await fresh.close();
          }
          assert.deepEqual(errors, []);
          await context.close();
          scenarios++;
        }
    const blocked = await setup(browser, { language: 'en', theme: 'dark', width: 390 }, true, {
      serviceWorkers: 'block',
    });
    await blocked.route('**/BackupPanel.*.js', (route) => route.abort());
    const failedPage = await blocked.newPage();
    await failedPage.goto(base + '/?q=Capital+Dance', { waitUntil: 'networkidle' });
    await failedPage.locator('[data-station-id="capital-dance"]').click();
    await failedPage.locator('[data-player-status="playing"]').first().waitFor();
    await failedPage.locator('#open-settings').click();
    await failedPage.locator('[data-open-backup]').click();
    await failedPage.locator('[data-backup-load-error]').waitFor();
    assert.equal(await failedPage.evaluate(() => window.__backupAudio.length), 1);
    assert.equal(await failedPage.evaluate(() => window.__backupAudio[0].paused), false);
    await blocked.close();
    console.log(
      'BACKUP_RESULT ' +
        JSON.stringify({
          passed: true,
          scenarios,
          exportImportRoundTrip: true,
          validation: true,
          deduplication: true,
          settingsOptIn: true,
          audioAndTimerPreserved: true,
          persistence: true,
          offline: true,
          accessibility: true,
        }),
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
