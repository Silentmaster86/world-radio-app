// Real decoding and complete language layouts; independent of publisher availability.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  vm = require('node:vm');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { createAppContext, waitForServiceWorker } = require('./browser-context.cjs');
const languages = ['en', 'pl', 'de', 'es', 'fr', 'pt', 'it', 'uk'];
const output = path.resolve(
  'test-results/languages',
  process.env.WRA_BASE_URL ? 'preview' : 'build',
);
fs.mkdirSync(output, { recursive: true });
function object(file, marker) {
  const source = fs.readFileSync(file, 'utf8'),
    start = source.indexOf(marker) + marker.length;
  return vm.runInNewContext('(' + source.slice(start, source.indexOf('\n};', start) + 2) + ')');
}
function catalog(language) {
  if (!['en', 'pl'].includes(language))
    return object(`src/i18n/locales/${language}.js`, 'export default ');
  const result = object(`src/i18n/${language}.js`, `const ${language} = `);
  for (const [prefix, file] of [
    ['backup.', 'src/components/Backup/messages.js'],
    ['manage.', 'src/components/Library/messages.js'],
  ])
    for (const [key, value] of Object.entries(object(file, `const ${language} = `)))
      result[prefix + key] = value;
  return result;
}
const tone = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
  'base64',
);
async function decodedContext(browser, options) {
  const context = await createAppContext(browser, options);
  await context.addInitScript(() => {
    if (!localStorage.getItem('wra:language:v1'))
      localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language: 'en' }));
    const Native = Audio;
    window.__languageAudio = [];
    window.Audio = function (...args) {
      const audio = new Native(...args);
      window.__languageAudio.push(audio);
      return audio;
    };
  });
  await context.route('https://media-ice.musicradio.com/CapitalDance', (route) =>
    route.fulfill({
      contentType: 'audio/mpeg',
      headers: { 'access-control-allow-origin': '*' },
      body: Buffer.concat(Array(120).fill(tone)),
    }),
  );
  return context;
}
async function language(page, code) {
  await page.locator('#language').selectOption(code);
  await page.waitForFunction((code) => document.documentElement.lang === code, code);
  assert.equal(await page.locator('#language').inputValue(), code);
}
async function continuous(page, source) {
  assert.equal(await page.evaluate(() => window.__languageAudio.length), 1);
  assert.equal(await page.evaluate(() => window.__languageAudio[0].src), source);
  assert.equal(await page.evaluate(() => window.__languageAudio[0].paused), false);
  assert.equal(await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'), 'true');
}
async function accessible(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  assert.deepEqual(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    label,
  );
}
async function geometry(page, car = false) {
  await page.locator(car ? '.now-playing-card' : '.soundbar').waitFor();
  if (!car) await page.locator('[data-station-id]').first().waitFor();
  const result = await page.evaluate((car) => {
    const bounds = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const scope = document.querySelector(car ? '.now-playing-card' : '.soundbar');
    return {
      width: innerWidth,
      height: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      first: car ? null : bounds(document.querySelector('[data-station-id]')),
      dock: car ? null : bounds(scope),
      controls: [...scope.querySelectorAll('button,input')]
        .filter((el) => el.getClientRects().length)
        .map(bounds),
    };
  }, car);
  assert.equal(result.overflow, false, JSON.stringify(result));
  if (!car)
    assert.ok(
      result.first.bottom <= result.dock.y + 1,
      'First station covered: ' + JSON.stringify(result),
    );
  for (const r of result.controls)
    assert.ok(
      r.width >= 44 &&
        r.height >= 44 &&
        r.x >= -1 &&
        r.right <= result.width + 1 &&
        r.y >= -1 &&
        r.bottom <= result.height + 1,
      'Clipped/small control: ' + JSON.stringify(result),
    );
}
async function main() {
  const root = path.resolve('build'),
    server = http.createServer((req, res) => {
      const requested = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
      if (!requested.startsWith(root + path.sep) && requested !== root)
        return res.writeHead(403).end();
      const file =
        fs.existsSync(requested) && fs.statSync(requested).isFile()
          ? requested
          : path.join(root, 'index.html');
      res.setHeader(
        'Content-Type',
        {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.webp': 'image/webp',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
        }[path.extname(file)] || 'application/octet-stream',
      );
      fs.createReadStream(file).pipe(res);
    });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`,
    browser = await chromium.launch();
  let scenarios = 0;
  try {
    for (const code of languages)
      for (const colorScheme of ['light', 'dark']) {
        const expected = catalog(code),
          context = await decodedContext(browser, {
            viewport: { width: 390, height: 844 },
            colorScheme,
          });
        const page = await context.newPage(),
          errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.locator('[data-station-id="capital-dance"]').click();
        await page.locator('[data-player-status="playing"]').first().waitFor();
        await page.waitForFunction(() => window.__languageAudio[0].currentTime > 0.2);
        const source = await page.evaluate(() => window.__languageAudio[0].src);
        await page.locator('.station-card').first().locator('.station-favorite').click();
        await page.locator('[data-sleep-timer]').click();
        await page.locator('[data-sleep-minutes="15"]').click();
        await page.locator('#open-settings').click();
        assert.equal(await page.locator('#language option').count(), languages.length);
        await language(page, code);
        await page.keyboard.press('Escape');
        await page.locator('.settings-dialog').waitFor({ state: 'hidden' });
        assert.equal(await page.evaluate(() => document.activeElement.id), 'open-settings');
        await continuous(page, source);
        for (const viewport of [
          { width: 320, height: 568 },
          { width: 390, height: 844 },
          { width: 1440, height: 900 },
        ]) {
          await page.setViewportSize(viewport);
          await geometry(page);
          assert.ok(
            (await page.locator('.collection-tabs').textContent()).includes(
              expected['filters.all'].replace('{count}', '12'),
            ),
          );
          await accessible(page, `${code}-${colorScheme}-${viewport.width}-home`);
          await page.screenshot({
            path: path.join(output, `${code}-${colorScheme}-${viewport.width}-home.png`),
          });
          await page.locator('#open-player').click();
          await page.locator('.now-playing-card').waitFor();
          await geometry(page, true);
          await continuous(page, source);
          await accessible(page, `${code}-${colorScheme}-${viewport.width}-player`);
          await page.screenshot({
            path: path.join(output, `${code}-${colorScheme}-${viewport.width}-player.png`),
          });
          await page.locator('.now-playing-card button').first().click();
          scenarios++;
        }
        await page.setViewportSize({ width: 320, height: 568 });
        await page.locator('#open-settings').click();
        await page.locator('[data-open-backup]').click();
        await page.locator('[data-backup-panel]').waitFor();
        assert.equal(
          await page.locator('[data-backup-panel] h3').textContent(),
          expected['backup.title'],
        );
        await accessible(page, `${code}-${colorScheme}-backup`);
        const downloaded = page.waitForEvent('download');
        await page.locator('[data-backup-export]').click();
        const backup = JSON.parse(fs.readFileSync(await (await downloaded).path(), 'utf8'));
        assert.equal(backup.settings.language, code);
        assert.ok(backup.favoriteIds.includes('capital-dance'));
        await continuous(page, source);
        if (code === 'en' && colorScheme === 'light') {
          backup.settings.language = 'uk';
          await page.locator('[data-backup-file]').setInputFiles({
            name: 'ukrainian.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(backup)),
          });
          await page.locator('[data-backup-preview]').waitFor();
          await page.locator('[data-backup-settings]').check();
          await page.locator('[data-backup-apply]').click();
          await page.waitForFunction(() => document.documentElement.lang === 'uk');
          await page.locator('[data-backup-message]').waitFor();
          await continuous(page, source);
          assert.equal(
            await page.evaluate(() => JSON.parse(localStorage.getItem('wra:language:v1')).language),
            'uk',
          );
          await language(page, code);
        }
        await page.locator('[data-open-library]').click();
        await page.locator('.library-page').waitFor();
        assert.equal(
          await page.locator('.library-page h1').textContent(),
          expected['manage.title'],
        );
        await accessible(page, `${code}-${colorScheme}-library`);
        await continuous(page, source);
        await page.locator('header a[href="/"]').click();
        await page.locator('.soundbar .main-play-control').click();
        await page.locator('[data-player-status="paused"]').first().waitFor();
        await waitForServiceWorker(page);
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForFunction(() => !!navigator.serviceWorker.controller);
        await page.waitForFunction((code) => document.documentElement.lang === code, code);
        assert.equal(
          await page.evaluate(() => window.__languageAudio[0].getAttribute('src')),
          null,
        );
        if (code === 'de') {
          await context.setOffline(true);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => document.documentElement.lang === 'de');
          await page.locator('#open-settings').click();
          for (const offlineCode of languages) {
            await language(page, offlineCode);
            assert.equal(
              await page.locator('.settings-dialog h2').textContent(),
              catalog(offlineCode)['settings.title'],
            );
          }
          await page.locator('#close-settings').click();
          assert.equal(await page.locator('article button[aria-pressed="true"]').count(), 1);
          assert.equal(
            await page.evaluate(() => window.__languageAudio[0].getAttribute('src')),
            null,
          );
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
    // Block the new chunk with no service worker fallback: keep data/audio on failure.
    const context = await decodedContext(browser, {
        viewport: { width: 320, height: 568 },
        serviceWorkers: 'block',
      }),
      page = await context.newPage();
    await context.route('**/static/js/de.*.js', (route) => route.abort());
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('[data-station-id="capital-dance"]').click();
    await page.locator('[data-player-status="playing"]').first().waitFor();
    await page.locator('[data-sleep-timer]').click();
    await page.locator('[data-sleep-minutes="15"]').click();
    const source = await page.evaluate(() => window.__languageAudio[0].src);
    await page.locator('#open-settings').click();
    await page.locator('#language').selectOption('de');
    await page.getByRole('status').filter({ hasText: 'Could not load this language' }).waitFor();
    assert.equal(await page.locator('#language').inputValue(), 'en');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    await continuous(page, source);
    const before = await page.evaluate(() => ({ ...localStorage }));
    await page.locator('[data-open-backup]').click();
    await page.locator('[data-backup-panel]').waitFor();
    await page.locator('[data-backup-file]').setInputFiles({
      name: 'language.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          app: 'world-radio-app',
          version: 1,
          stations: [],
          favoriteIds: ['heart-uk'],
          recentIds: [],
          settings: { language: 'de', theme: 'light', volume: 0.2, muted: true },
        }),
      ),
    });
    await page.locator('[data-backup-preview]').waitFor();
    await page.locator('[data-backup-settings]').check();
    await page.locator('[data-backup-apply]').click();
    await page.getByRole('alert').filter({ hasText: 'Nothing was imported' }).waitFor();
    assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), before);
    await continuous(page, source);
    await context.close();
    console.log(
      'LANGUAGE_RESULT ' +
        JSON.stringify({
          passed: true,
          languages: languages.length,
          scenarios,
          realAudio: true,
          firstStationVisible: true,
          accessibility: true,
          backupAndLibrary: true,
          reloadPersistence: true,
          allLanguagesOffline: true,
          sharedAudioAndTimer: true,
          failedChunkKeepsLanguageAndAudio: true,
          failedImportWritesNothing: true,
          importedLanguageBeforeCommit: true,
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
