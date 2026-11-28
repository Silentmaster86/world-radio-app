// Real routes, native Audio and cross-tab persistence for the five app designs.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { createAppContext, waitForServiceWorker } = require('./browser-context.cjs');
const output = path.resolve('test-results/styles', process.env.WRA_BASE_URL ? 'preview' : 'build');
fs.mkdirSync(output, { recursive: true });
const designs = ['classic', 'orbit', 'pulse', 'analog', 'signal'];
const tone = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
  'base64',
);
async function choose(page, id) {
  if (!(await page.locator('.settings-dialog[open]').count()))
    await page.locator('#open-settings').click();
  await page.locator(`[data-design-choice="${id}"]`).click();
  await page.waitForFunction((id) => document.documentElement.dataset.design === id, id);
  await page.locator('#close-settings').click();
}
async function layout(page, first = false) {
  const metrics = await page.evaluate(() => {
    const box = (node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right };
    };
    const visible = (node) =>
      node.getClientRects().length &&
      getComputedStyle(node).visibility !== 'hidden' &&
      !node.closest('dialog:not([open])');
    return {
      width: innerWidth,
      overflow: document.documentElement.scrollWidth,
      first: document.querySelector('[data-station-id]')
        ? box(document.querySelector('[data-station-id]'))
        : null,
      dock: document.querySelector('.soundbar') ? box(document.querySelector('.soundbar')) : null,
      carControls: [
        ...document.querySelectorAll('.now-playing-card button,.now-playing-card input'),
      ]
        .filter(visible)
        .map(box),
      hittable: (() => {
        const button = document.querySelector('[data-station-id]');
        if (!button) return true;
        const rect = button.getBoundingClientRect();
        return button.contains(
          document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
        );
      })(),
      small: [
        ...document.querySelectorAll(
          'button,input:not([type=checkbox]),select,.design-navigation a',
        ),
      ]
        .filter(visible)
        .filter((node) => {
          const r = node.getBoundingClientRect();
          return r.width < 43.9 || r.height < 43.9;
        })
        .map((node) => ({
          name: node.getAttribute('aria-label') || node.textContent.slice(0, 60),
          ...box(node),
        })),
    };
  });
  assert.ok(metrics.overflow <= metrics.width + 1, `overflow ${JSON.stringify(metrics)}`);
  assert.deepEqual(metrics.small, [], `touch targets ${JSON.stringify(metrics)}`);
  if (first) {
    assert.ok(metrics.hittable, 'First station is covered by another element');
  }
  for (const control of metrics.carControls)
    assert.ok(
      control.y >= -1 && control.b <= (await page.evaluate(() => innerHeight)) + 1,
      `player control outside viewport ${JSON.stringify(control)}`,
    );
  if (first)
    assert.ok(
      metrics.first.b <= metrics.dock.y + 1,
      `first station behind dock ${JSON.stringify(metrics)}`,
    );
  return metrics;
}
async function fixture(context) {
  await context.route('https://media-ice.musicradio.com/CapitalDance', (route) =>
    route.fulfill({
      contentType: 'audio/mpeg',
      headers: { 'access-control-allow-origin': '*' },
      body: Buffer.concat(Array(120).fill(tone)),
    }),
  );
}
async function init(context, settings = {}) {
  await context.addInitScript((settings) => {
    if (!localStorage.getItem('wra:language:v1'))
      localStorage.setItem(
        'wra:language:v1',
        JSON.stringify({ version: 1, language: settings.language || 'en' }),
      );
    if (!localStorage.getItem('wra:theme:v1'))
      localStorage.setItem(
        'wra:theme:v1',
        JSON.stringify({ version: 1, mode: settings.mode || 'dark' }),
      );
    if (settings.design && !localStorage.getItem('wra:design:v1'))
      localStorage.setItem(
        'wra:design:v1',
        JSON.stringify({ version: 1, design: settings.design }),
      );
    const Native = Audio;
    window.__styleAudio = [];
    window.Audio = function (...args) {
      const audio = new Native(...args);
      window.__styleAudio.push(audio);
      return audio;
    };
  }, settings);
}
async function main() {
  const root = path.resolve('build');
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
    const target =
      fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'index.html');
    res.setHeader(
      'content-type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      }[path.extname(target)] || 'application/octet-stream',
    );
    fs.createReadStream(target).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const report = [];
  try {
    for (const design of designs)
      for (const language of ['en', 'pl'])
        for (const mode of ['light', 'dark', 'system'])
          for (const viewport of [
            { width: 320, height: 568 },
            { width: 390, height: 844 },
            { width: 1440, height: 900 },
            { width: 568, height: 320 },
            { width: 1024, height: 768 },
          ]) {
            const context = await createAppContext(browser, {
              viewport,
              colorScheme: mode === 'light' ? 'light' : 'dark',
              reducedMotion: 'reduce',
              serviceWorkers: 'block',
            });
            await init(context, { design, language, mode });
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(e.message));
            const label = `${design}-${language}-${mode}-${viewport.width}`;
            try {
              await page.goto(base, { waitUntil: 'domcontentloaded' });
              await page.waitForFunction(
                (id) => document.documentElement.dataset.design === id,
                design,
              );
              await page.locator('main').waitFor();
              await layout(page, true);
              if (language === 'en' && mode === 'system' && viewport.width === 390) {
                await page.emulateMedia({ colorScheme: 'light' });
                await page.waitForFunction(
                  () => document.documentElement.style.colorScheme === 'light',
                );
                const light = await page.evaluate(
                  () => getComputedStyle(document.body).backgroundColor,
                );
                await page.emulateMedia({ colorScheme: 'dark' });
                await page.waitForFunction(
                  () => document.documentElement.style.colorScheme === 'dark',
                );
                assert.notEqual(
                  await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
                  light,
                );
              }

              if (language === 'en' && viewport.width === 390) {
                const axe = await new AxeBuilder({ page })
                  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                  .analyze();
                assert.deepEqual(
                  axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
                  [],
                  `${label} axe`,
                );
                await page.screenshot({ path: path.join(output, label + '.png'), fullPage: false });
              }
              if (mode === 'dark')
                for (const route of ['/discover', '/library', '/help', '/now-playing']) {
                  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
                  await page.waitForFunction(
                    (id) => document.documentElement.dataset.design === id,
                    design,
                  );
                  await page.locator('main').waitFor();
                  await layout(page);
                }
              assert.deepEqual(errors, []);
              report.push({ label, passed: true });
              if (report.length % 30 === 0) console.log(`STYLE_LAYOUTS ${report.length}/150`);
            } catch (error) {
              await page
                .screenshot({ path: path.join(output, 'failed-' + label + '.png') })
                .catch(() => {});
              throw new Error(`${label}: ${error.message}`, { cause: error });
            } finally {
              await context.close();
            }
          }
    // An active refinement must retain its reset action in landscape too.
    const filters = await createAppContext(browser, {
      viewport: { width: 568, height: 320 },
      serviceWorkers: 'block',
    });
    await init(filters);
    const filtering = await filters.newPage();
    await filtering.goto(base, { waitUntil: 'networkidle' });
    await filtering.locator('#station-search').fill('Capital');
    const reset = filtering.locator('.mobile-toolbar button');
    await reset.waitFor();
    const resetBox = await reset.boundingBox();
    assert.ok(resetBox.width >= 44 && resetBox.height >= 44);
    await reset.click();
    await filtering.waitForFunction(() => document.getElementById('station-search').value === '');
    assert.equal(await filtering.locator('#station-search').inputValue(), '');
    await filters.close();
    // Switch actual UI while native audio decodes, without a second audio element.
    const context = await createAppContext(browser, { viewport: { width: 390, height: 844 } });
    await init(context);
    await fixture(context);
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('.soundbar .main-play-control').click();
    await page.waitForFunction(() => window.__styleAudio[0].currentTime > 0.2);
    await page.locator('[data-sleep-timer]').click();
    await page.locator('[data-sleep-minutes="30"]').click();
    await page.locator('.station-favorite').first().click();
    await page.locator('.station-favorite[aria-pressed=true]').first().waitFor();
    const before = await page.evaluate(() => ({
      time: window.__styleAudio[0].currentTime,
      src: window.__styleAudio[0].src,
      favorites: localStorage.getItem('wra:favorites:v1'),
      recent: localStorage.getItem('wra:recent:v1'),
    }));
    for (const id of [...designs.slice(1), 'classic']) {
      await choose(page, id);
      assert.equal(await page.locator('[data-sleep-timer]').getAttribute('aria-pressed'), 'true');
      await page.waitForFunction(() => !window.__styleAudio[0].paused);
      if (id !== 'classic') {
        await page.waitForFunction(() =>
          document
            .querySelector('.design-hero')
            ?.getAnimations({ subtree: true })
            .some((animation) => animation.playState === 'running'),
        );
        await page.locator('#open-settings').click();
        await page.locator('[data-background-motion]').uncheck();
        await page.locator('#close-settings').click();
        assert.equal(
          await page
            .locator('.design-hero')
            .evaluate((node) =>
              node
                .getAnimations({ subtree: true })
                .some((animation) => animation.playState === 'running'),
            ),
          false,
        );
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.locator('#open-settings').click();
        await page.locator('[data-background-motion]').check();
        await page.locator('#close-settings').click();
        assert.equal(
          await page
            .locator('.design-hero')
            .evaluate((node) =>
              node
                .getAnimations({ subtree: true })
                .some((animation) => animation.playState === 'running'),
            ),
          false,
        );
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
    }
    const after = await page.evaluate(() => ({
      count: window.__styleAudio.length,
      time: window.__styleAudio[0].currentTime,
      src: window.__styleAudio[0].src,
      favorites: localStorage.getItem('wra:favorites:v1'),
      recent: localStorage.getItem('wra:recent:v1'),
    }));
    assert.equal(after.count, 1);
    assert.ok(after.time > before.time);
    for (const key of ['src', 'favorites', 'recent']) assert.equal(after[key], before[key]);
    await choose(page, 'analog');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.design === 'analog');
    // All styles are part of the activated offline shell; no stream is claimed offline.
    await waitForServiceWorker(page);
    await page.reload({ waitUntil: 'networkidle' });
    await context.setOffline(true);
    for (const id of designs) await choose(page, id);
    await context.setOffline(false);
    await context.close();
    // Failed optional assets keep the existing design and audio usable.
    const failure = await createAppContext(browser, { serviceWorkers: 'block' });
    await init(failure);
    await fixture(failure);
    const failed = await failure.newPage();
    await failed.goto(base, { waitUntil: 'networkidle' });
    await failed.locator('.soundbar .main-play-control').click();
    await failed.waitForFunction(() => window.__styleAudio[0].currentTime > 0.2);
    await failure.route('**/static/js/orbit.*.js', (r) => r.abort());
    await failed.locator('#open-settings').click();
    await failed.locator('[data-design-choice=orbit]').click();
    await failed.locator('.design-picker [role=alert]').waitFor();
    assert.equal(await failed.locator('html').getAttribute('data-design'), 'classic');
    assert.equal(await failed.evaluate(() => window.__styleAudio.length), 1);
    assert.equal(await failed.evaluate(() => window.__styleAudio[0].paused), false);
    await failure.close();
    // Separate tabs share a lock and fresh disk snapshots. Older browsers still
    // merge sequential edits when Web Locks are unavailable.
    for (const locks of [true, false]) {
      const tabs = await createAppContext(browser, { serviceWorkers: 'block' });
      await init(tabs);
      if (!locks)
        await tabs.addInitScript(() =>
          Object.defineProperty(navigator, 'locks', { value: undefined }),
        );
      const pages = await Promise.all([tabs.newPage(), tabs.newPage()]);
      await Promise.all(pages.map((p) => p.goto(base, { waitUntil: 'networkidle' })));
      if (locks) {
        await pages[0].evaluate(() => {
          window.__gate = new Promise((resolve) => {
            window.__release = resolve;
          });
          navigator.locks.request('wra:library:v1', () => {
            window.__held = true;
            return window.__gate;
          });
        });
        await pages[0].waitForFunction(() => window.__held);
        await Promise.all(
          pages.map((p, index) =>
            p
              .locator('.station-favorite')
              .nth(index)
              .evaluate((button) => button.click()),
          ),
        );
        await pages[0].evaluate(() => window.__release());
      } else {
        await pages[0].locator('.station-favorite').first().click();
        await pages[0].waitForFunction(
          () => JSON.parse(localStorage.getItem('wra:favorites:v1'))?.stationIds?.length === 1,
        );
        await pages[1].locator('.station-favorite').nth(1).click();
      }
      for (const p of pages) {
        await p.waitForFunction(
          () => JSON.parse(localStorage.getItem('wra:favorites:v1'))?.stationIds?.length === 2,
        );
        await p.waitForFunction(
          () => document.querySelectorAll('.station-favorite[aria-pressed=true]').length === 2,
        );
      }
      await tabs.route('**/.netlify/functions/radio-directory?*', (route) => {
        const q = new URL(route.request().url()).searchParams.get('q');
        return route.fulfill({
          json: {
            rows: [
              {
                stationuuid: `12345678-1234-1234-1234-00000000000${q === 'one' ? 1 : 2}`,
                name: q,
                url: `https://radio.example/${q}`,
                countrycode: 'GB',
              },
            ],
            hasMore: false,
          },
        });
      });
      for (const [index, p] of pages.entries()) {
        await p.goto(base + '/discover', { waitUntil: 'networkidle' });
        await p.locator('form input').fill(index ? 'two' : 'one');
        await p.locator('form button').click();
        await p.locator('article button').waitFor();
      }
      if (locks) await Promise.all(pages.map((p) => p.locator('article button').click()));
      else
        for (const p of pages) {
          await p.locator('article button').click();
          await p.waitForFunction(() => document.querySelector('article button').disabled);
        }
      for (const p of pages)
        await p.waitForFunction(
          () => JSON.parse(localStorage.getItem('wra:stations:v1'))?.stations?.length === 2,
        );
      await tabs.close();
    }
    fs.writeFileSync(
      path.join(output, 'results.json'),
      JSON.stringify(
        {
          passed: true,
          layouts: report.length,
          routeLayouts: 200,
          playback: true,
          offline: true,
          failedDownload: true,
          crossTab: true,
          report,
        },
        null,
        2,
      ),
    );
    console.log(
      'STYLES_RESULT',
      JSON.stringify({
        passed: true,
        layouts: report.length,
        playback: true,
        offline: true,
        failedDownload: true,
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
