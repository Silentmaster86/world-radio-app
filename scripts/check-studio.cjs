const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const {
  createAppContext,
  selectAppearance,
  waitForServiceWorker,
} = require('./browser-context.cjs');
const output = path.resolve('test-results/studio', process.env.WRA_BASE_URL ? 'preview' : 'build');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const root = path.resolve('build');
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) file = path.join(root, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`,
    browser = await chromium.launch();
  let layouts = 0,
    transfers = 0;
  const contextFor = async (language, mode, width = 390, motion = 'no-preference') => {
    const context = await createAppContext(browser, {
      viewport: { width, height: width <= 375 ? 568 : 900 },
      colorScheme: mode,
      reducedMotion: motion,
      locale: language === 'pl' ? 'pl-PL' : 'en-US',
    });
    await context.addInitScript(
      ({ language, mode }) => {
        if (!localStorage.getItem('wra:language:v1'))
          localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language }));
        if (!localStorage.getItem('wra:theme:v1'))
          localStorage.setItem('wra:theme:v1', JSON.stringify({ version: 1, mode }));
        const Native = Audio;
        window.__studioAudio = [];
        window.Audio = function (...args) {
          const audio = new Native(...args);
          window.__studioAudio.push(audio);
          return audio;
        };
      },
      { language, mode },
    );
    return context;
  };
  const loops = (page) =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
        .map((a) => a.effect.target.classList.contains('ambient-wave')),
    );
  try {
    for (const language of ['en', 'pl'])
      for (const mode of ['light', 'dark'])
        for (const width of [320, 374, 375, 390, 1440]) {
          const context = await contextFor(language, mode, width),
            page = await context.newPage();
          await page.goto(base, { waitUntil: 'networkidle' });
          assert.equal(await page.locator('#header-appearance').isVisible(), width >= 375);
          if (width >= 375) {
            const box = await page.locator('#header-appearance').boundingBox();
            assert.ok(
              box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width,
            );
          }
          const play = await page.locator('[data-station-id="capital-dance"]').boundingBox(),
            dock = await page.locator('.soundbar').boundingBox();
          assert.ok(play.y + play.height <= dock.y, 'First Play must be fully above player');
          assert.deepEqual(
            await loops(page),
            [true, true],
            'Idle motion must be exactly two background waves',
          );
          await page.locator('#open-settings').click();
          assert.equal(await page.locator('#appearance').isVisible(), width < 375);
          await page.locator('[data-background-motion]').uncheck();
          assert.deepEqual(await loops(page), []);
          await page.locator('#close-settings').click();
          if (width >= 375) await selectAppearance(page, 'system');
          if (width < 375) {
            await page.locator('#open-settings').click();
            await selectAppearance(page, 'system');
            await page.locator('#close-settings').click();
          }
          const next = mode === 'light' ? 'dark' : 'light';
          await page.emulateMedia({ colorScheme: next });
          await page.waitForFunction(
            (next) => document.documentElement.style.colorScheme === next,
            next,
          );
          await page.locator('#open-settings').click();
          await page.locator('[data-background-motion]').check();
          await page.locator('#close-settings').click();
          assert.deepEqual(await loops(page), [true, true]);
          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          assert.deepEqual(axe.violations, []);
          await page.screenshot({ path: path.join(output, `${language}-${mode}-${width}.png`) });
          await context.close();
          layouts++;
        }
    for (const language of ['en', 'pl']) {
      const reduced = await contextFor(language, 'dark', 390, 'reduce'),
        quiet = await reduced.newPage();
      await quiet.goto(base, { waitUntil: 'networkidle' });
      assert.deepEqual(await loops(quiet), []);
      await reduced.close();
      const old = await contextFor(language, 'dark'),
        oldPage = await old.newPage();
      await oldPage.goto(base, { waitUntil: 'networkidle' });
      await oldPage.locator('.station-favorite').first().click();
      await oldPage.locator('#open-settings').click();
      await oldPage.locator('[data-open-backup]').click();
      await oldPage.locator('[data-backup-help] summary').first().click();
      assert.equal(await oldPage.locator('[data-backup-help] ol li').count(), 4);
      const downloadPromise = oldPage.waitForEvent('download');
      await oldPage.locator('[data-backup-export]').click();
      const download = await downloadPromise;
      assert.match(download.suggestedFilename(), /^world-radio-backup-.*\.json$/);
      const file = await download.path();
      const fresh = await contextFor(language, 'light'),
        page = await fresh.newPage();
      const tone = Buffer.from(
        fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
        'base64',
      );
      await fresh.route('https://media-ice.musicradio.com/CapitalDance', (route) =>
        route.fulfill({
          contentType: 'audio/mpeg',
          headers: { 'access-control-allow-origin': '*' },
          body: Buffer.concat(Array(60).fill(tone)),
        }),
      );
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(
        await page.locator('.station-favorite[aria-pressed="true"]').count(),
        0,
        'Separate device starts without the old library',
      );
      await page.locator('[data-station-id="capital-dance"]').click();
      await page.locator('[data-player-status="playing"]').first().waitFor();
      await page.locator('[data-sleep-timer]').click();
      await page.locator('[data-sleep-minutes="15"]').click();
      await page.locator('#open-settings').click();
      await page.locator('[data-open-backup]').click();
      await page.locator('[data-backup-file]').setInputFiles(file);
      await page.locator('[data-backup-preview]').waitFor();
      assert.equal(await page.locator('[data-backup-settings]').isChecked(), false);
      await page.locator('[data-backup-apply]').click();
      await page.locator('[data-backup-message]').waitFor();
      await page.locator('#close-settings').click();
      assert.equal(await page.locator('.station-favorite[aria-pressed="true"]').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.style.colorScheme), 'light');
      assert.equal(await page.evaluate(() => window.__studioAudio.length), 1);
      assert.equal(await page.evaluate(() => window.__studioAudio[0].paused), false);
      assert.equal(await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'), 'true');
      await page.locator('#open-settings').click();
      await page.locator('a[href="/help"]').click();
      await page.locator('[data-backup-help]').waitFor();
      assert.equal(await page.evaluate(() => window.__studioAudio[0].paused), false);
      const helpAxe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      assert.deepEqual(helpAxe.violations, []);
      await page.locator('[data-backup-help] summary').first().click();
      assert.equal(await page.locator('[data-backup-help] ol li').count(), 4);
      await waitForServiceWorker(page);
      await fresh.setOffline(true);
      await page.goto(base + '/help', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-backup-help]').waitFor();
      assert.equal(await page.evaluate(() => window.__studioAudio[0].paused), true);
      assert.equal(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem('wra:favorites:v1')).stationIds.length,
        ),
        1,
      );
      await fresh.close();
      await old.close();
      transfers++;
    }
    console.log(
      'STUDIO_RESULT ' +
        JSON.stringify({
          passed: true,
          layouts,
          transfers,
          breakpoints: [320, 374, 375, 390, 1440],
          headerTheme: true,
          systemTheme: true,
          pausableWaves: true,
          reducedMotion: true,
          crossDeviceBackup: true,
          audioAndTimerPreserved: true,
          offlineHelp: true,
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
