const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const { createAppContext } = require('./browser-context.cjs');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
async function main() {
  const root = path.resolve('build');
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) file = path.join(root, 'index.html');
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`,
    browser = await chromium.launch();
  const tone = Buffer.from(
    fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
    'base64',
  );
  let scenarios = 0;
  try {
    for (const language of ['en', 'pl'])
      for (const mode of ['light', 'dark'])
        for (const width of [320, 390, 1440]) {
          const context = await createAppContext(browser, {
            viewport: { width, height: width === 320 ? 568 : 900 },
            colorScheme: mode,
            reducedMotion: 'reduce',
          });
          await context.addInitScript(
            ({ language, mode }) => {
              localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language }));
              localStorage.setItem('wra:theme:v1', JSON.stringify({ version: 1, mode }));
              const Native = Audio;
              window.__privacyAudio = [];
              window.Audio = function (...args) {
                const audio = new Native(...args);
                window.__privacyAudio.push(audio);
                return audio;
              };
            },
            { language, mode },
          );
          await context.route('https://media-ice.musicradio.com/CapitalDance', (route) =>
            route.fulfill({
              contentType: 'audio/mpeg',
              headers: { 'access-control-allow-origin': '*' },
              body: Buffer.concat(Array(60).fill(tone)),
            }),
          );
          const page = await context.newPage();
          await page.goto(base, { waitUntil: 'networkidle' });
          await page.locator('[data-station-id="capital-dance"]').click();
          await page.locator('[data-player-status="playing"]').first().waitFor();
          await page.waitForFunction(() => window.__privacyAudio[0].currentTime > 0.2);
          await page.locator('#open-settings').click();
          const link = page.locator('a[href="/privacy/"]');
          assert.equal(
            await link.innerText(),
            language === 'pl' ? 'Polityka prywatności' : 'Privacy policy',
          );
          assert.ok((await link.boundingBox()).height >= 44);
          const before = await page.evaluate(() => window.__privacyAudio[0].currentTime);
          const popupPromise = page.waitForEvent('popup');
          await link.click();
          const popup = await popupPromise;
          await popup.waitForLoadState('networkidle');
          assert.equal(new URL(popup.url()).pathname, '/privacy/');
          await popup.locator('article[lang="pl"]').waitFor();
          assert.equal(await popup.locator('article[lang="en"]').count(), 1);
          assert.equal(
            await popup.locator('a[href="mailto:przemyslaw.pietkun@gmail.com"]').count(),
            2,
          );
          assert.equal(await popup.evaluate(() => window.opener === null), true);
          assert.equal(
            await popup.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            true,
          );
          const axe = await new AxeBuilder({ page: popup })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          assert.deepEqual(axe.violations, []);
          await page.waitForFunction((t) => window.__privacyAudio[0].currentTime > t, before);
          assert.equal(await page.evaluate(() => window.__privacyAudio.length), 1);
          assert.equal(await page.evaluate(() => window.__privacyAudio[0].paused), false);
          await popup.close();
          await page.locator('#close-settings').click();
          await context.close();
          scenarios++;
        }
    console.log(
      'PRIVACY_RESULT ' +
        JSON.stringify({
          passed: true,
          scenarios,
          widths: [320, 390, 1440],
          languages: ['en', 'pl'],
          themes: ['light', 'dark'],
          publicStaticPage: true,
          accessibility: true,
          realAudioPreserved: true,
          noOpener: true,
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
