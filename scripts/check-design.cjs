// Visual/motion regression with real browser audio, without mocking play/events.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require('playwright');
const { createAppContext } = require('./browser-context.cjs');
const output = path.resolve('test-results/design', process.env.WRA_BASE_URL ? 'preview' : 'build');
fs.mkdirSync(output, { recursive: true });
const tone = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
  'base64',
);
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
      const type = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
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
      for (const mode of ['light', 'dark'])
        for (const width of [320, 390, 1440])
          for (const motion of ['no-preference', 'reduce']) {
            const context = await createAppContext(browser, {
              viewport: { width, height: width === 320 ? 568 : 900 },
              colorScheme: mode,
              reducedMotion: motion,
            });
            await context.addInitScript(
              ({ language, mode }) => {
                localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language }));
                localStorage.setItem('wra:theme:v1', JSON.stringify({ version: 1, mode }));
                const Native = Audio;
                window.__designAudio = [];
                window.Audio = function (...args) {
                  const audio = new Native(...args);
                  window.__designAudio.push(audio);
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
            const page = await context.newPage(),
              errors = [];
            page.on('pageerror', (e) => errors.push(e.message));
            await page.goto(base, { waitUntil: 'networkidle' });
            assert.equal(await page.locator('.library-hero').isVisible(), width > 640);
            const idle = await page.evaluate(() => ({
              infinite: document
                .getAnimations()
                .filter(
                  (a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity,
                ).length,
              background: getComputedStyle(document.body).backgroundColor,
              art: getComputedStyle(document.querySelector('.station-artwork [data-station-logo]'))
                .width,
            }));
            assert.equal(
              idle.infinite,
              0,
              'Idle screens must not run persistent decorative animations',
            );
            assert.equal(idle.art, width > 640 ? '96px' : '40px');
            assert.equal(
              idle.background,
              mode === 'dark' ? 'rgb(11, 16, 32)' : 'rgb(245, 244, 250)',
            );
            await page.locator('[data-station-id="capital-dance"]').click();
            await page.locator('[data-player-status="playing"]').first().waitFor();
            await page.waitForFunction(() => window.__designAudio[0].currentTime > 0.2);
            const source = await page.evaluate(() => window.__designAudio[0].src);
            assert.equal(await page.locator('.station-card[data-playing="true"]').count(), 1);
            const running = await page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter(
                    (a) =>
                      a.playState === 'running' && a.effect?.getTiming().iterations === Infinity,
                  ).length,
            );
            if (motion === 'reduce')
              assert.equal(running, 0, 'Reduced motion must disable playback animation');
            else
              assert.ok(running > 0, 'Real Playing state must activate visual playback feedback');
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            );
            await page.screenshot({
              path: path.join(output, `${language}-${mode}-${width}-${motion}-playing.png`),
              fullPage: true,
            });
            await page.locator('#open-player').click();
            await page.locator('.now-playing-card').waitFor();
            assert.equal(await page.evaluate(() => window.__designAudio.length), 1);
            assert.equal(await page.evaluate(() => window.__designAudio[0].src), source);
            assert.equal(await page.evaluate(() => window.__designAudio[0].paused), false);
            const carMotion = await page.evaluate(
              () =>
                document
                  .getAnimations()
                  .filter(
                    (a) =>
                      a.playState === 'running' && a.effect?.getTiming().iterations === Infinity,
                  ).length,
            );
            if (motion === 'reduce') assert.equal(carMotion, 0);
            else assert.ok(carMotion > 0);
            await page.screenshot({
              path: path.join(output, `${language}-${mode}-${width}-${motion}-player.png`),
              fullPage: true,
            });
            await page.locator('.now-playing-card button').first().click();
            await page.locator('#open-settings').click();
            const nextMode = mode === 'dark' ? 'light' : 'dark',
              nextLanguage = language === 'en' ? 'pl' : 'en';
            await page.locator('#appearance').selectOption(nextMode);
            await page.locator('#language').selectOption(nextLanguage);
            await page.locator('#close-settings').click();
            assert.equal(await page.evaluate(() => window.__designAudio.length), 1);
            assert.equal(await page.evaluate(() => window.__designAudio[0].src), source);
            assert.equal(await page.evaluate(() => window.__designAudio[0].paused), false);
            await page.locator('.station-card').first().locator('.station-favorite').click();
            assert.equal(
              await page
                .locator('.station-card')
                .first()
                .locator('.station-favorite')
                .getAttribute('aria-pressed'),
              'true',
            );
            await page.locator('.soundbar .main-play-control').click();
            await page.locator('[data-player-status="paused"]').first().waitFor();
            assert.equal(
              await page.evaluate(() => window.__designAudio[0].getAttribute('src')),
              null,
            );
            assert.equal(
              await page.evaluate(
                () =>
                  document
                    .getAnimations()
                    .filter(
                      (a) =>
                        a.playState === 'running' && a.effect?.getTiming().iterations === Infinity,
                    ).length,
              ),
              0,
            );
            if (motion === 'reduce')
              assert.equal(
                await page.evaluate(
                  () => document.getAnimations().filter((a) => a.playState === 'running').length,
                ),
                0,
              );
            assert.deepEqual(errors, []);
            await context.close();
            scenarios++;
          }
    console.log(
      'DESIGN_RESULT ' +
        JSON.stringify({
          passed: true,
          scenarios,
          realAudio: true,
          responsiveArtwork: true,
          stateDrivenMotion: true,
          reducedMotion: true,
          noIdleLoops: true,
          themeLanguageDuringPlayback: true,
          sharedAudioAcrossViews: true,
          pauseStopsMotion: true,
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
