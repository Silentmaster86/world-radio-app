/* Browser checks for a production build. Tools are provisioned by the CI browser job. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { createAppContext } = require('./browser-context.cjs');
const reportDir = path.resolve('test-results/ux', process.env.WRA_BASE_URL ? 'preview' : 'build');
fs.mkdirSync(reportDir, { recursive: true });
const root = path.resolve('build');
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
const report = [];

async function geometry(page, car = false) {
  const result = await page.evaluate((car) => {
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    const visible = (element) =>
      element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    const scope = car
      ? document.querySelector('[aria-label="Car mode player"]')
      : document.querySelector('[aria-label="Radio player"]');
    return {
      width: innerWidth,
      height: innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      controls: [...scope.querySelectorAll('button, input')]
        .filter(visible)
        .map((el) => ({ label: el.getAttribute('aria-label'), ...rect(el) })),
      dock: car ? null : rect(scope),
      lastStation: car ? null : rect(document.querySelector('article:last-child')),
    };
  }, car);
  assert.ok(
    result.documentWidth <= result.width + 1,
    `Horizontal overflow: ${JSON.stringify(result)}`,
  );
  for (const control of result.controls) {
    assert.ok(
      control.width >= 43 && control.height >= 43,
      `Small target: ${JSON.stringify(control)}`,
    );
    assert.ok(
      control.x >= -1 && control.right <= result.width + 1,
      `Clipped horizontal control: ${JSON.stringify(control)}`,
    );
    assert.ok(
      control.y >= -1 && control.bottom <= result.height + 1,
      `Control outside viewport: ${JSON.stringify(control)}`,
    );
  }
  if (!car)
    assert.ok(
      result.lastStation.bottom <= result.dock.y + 1,
      `Dock covers the last station: ${JSON.stringify(result)}`,
    );
  return result;
}
async function accessible(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  fs.writeFileSync(
    path.join(reportDir, `${label}-axe.json`),
    JSON.stringify(result.violations, null, 2),
  );
  assert.deepEqual(
    result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })),
    [],
    `${label}: accessibility violations`,
  );
}
async function screenshot(page, label) {
  await page.locator('img').evaluateAll(async (images) => {
    const visible = images.filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width && rect.height && rect.bottom > 0 && rect.top < innerHeight;
    });
    await Promise.all(visible.map((img) => img.decode()));
  });
  await page.screenshot({ path: path.join(reportDir, `${label}.png`), fullPage: true });
}
async function main() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}${path.sep}`) && file !== root) {
      response.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(root, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  let activePage;
  let navigationDiagnostics;
  try {
    for (const mode of ['light', 'dark']) {
      const context = await createAppContext(browser, {
        colorScheme: mode,
        reducedMotion: 'reduce',
        deviceScaleFactor: mode === 'dark' ? 2 : 1,
      });
      const page = await context.newPage();
      activePage = page;
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const viewport of [
        { width: 320, height: 568 },
        { width: 390, height: 844 },
        { width: 481, height: 800 },
        { width: 510, height: 800 },
        { width: 640, height: 800 },
        { width: 1440, height: 900 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(base, { waitUntil: 'networkidle' });
        if (viewport.width <= 640) {
          assert.equal(
            await page.locator('#station-country').isVisible(),
            false,
            'Extra mobile filters should start collapsed',
          );
          const first = await page.locator('article button').first().boundingBox();
          const dock = await page.locator('[aria-label="Radio player"]').boundingBox();
          assert.ok(
            first.y >= 0 && first.y + first.height <= dock.y + 1,
            `First station should be usable before scrolling: ${JSON.stringify({ viewport, first, dock })}`,
          );
          await screenshot(page, `${mode}-initial-${viewport.width}`);
        }
        await page.locator('article').last().scrollIntoViewIfNeeded();
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const label = `${mode}-home-${viewport.width}`;
        const dimensions = await geometry(page);
        await accessible(page, label);
        await screenshot(page, label);
        report.push({ label, dimensions });
      }
      for (const viewport of [
        { width: 844, height: 390 },
        { width: 568, height: 320 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(`${base}/now-playing`, { waitUntil: 'networkidle' });
        const label = `${mode}-car-${viewport.width}`;
        const dimensions = await geometry(page, true);
        await accessible(page, label);
        await screenshot(page, label);
        report.push({ label, dimensions });
      }
      // Direct routes, keyboard favorites, combined filters, reload and return navigation.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('[aria-controls="station-refinements"]').click();
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page
        .locator('#open-player')
        .evaluate((element) => element.focus({ preventScroll: true }));
      const fullListScroll = await page.evaluate(() => scrollY);
      navigationDiagnostics = {
        expected: fullListScroll,
        before: await page.evaluate(() => ({
          height: document.documentElement.scrollHeight,
          y: scrollY,
          padding: getComputedStyle(document.getElementById('root').firstElementChild)
            .paddingBottom,
        })),
      };
      assert.ok(fullListScroll > 0, 'The mobile catalog should scroll');
      await page.keyboard.press('Enter');
      await page.waitForURL('**/now-playing');
      await page.locator('[aria-label="Radio player"]').waitFor({ state: 'detached' });
      navigationDiagnostics.playerState = await page.evaluate(
        () => window.history.state?.usr?.browse,
      );
      await page.goBack({ waitUntil: 'networkidle' });
      await page.locator('#station-search').waitFor();
      navigationDiagnostics.after = await page.evaluate(() => ({
        height: document.documentElement.scrollHeight,
        y: scrollY,
        expanded: document
          .querySelector('[aria-controls="station-refinements"]')
          .getAttribute('aria-expanded'),
      }));
      await page.waitForFunction((expected) => Math.abs(scrollY - expected) <= 2, fullListScroll, {
        timeout: 5000,
      });
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-player');
      assert.equal(
        await page.locator('[aria-controls="station-refinements"]').getAttribute('aria-expanded'),
        'true',
      );
      await page.goto(`${base}/?country=GB&genre=News&language=pl&q=PRL`, {
        waitUntil: 'networkidle',
      });
      assert.equal(await page.locator('article').count(), 1);
      await page.getByRole('button', { name: 'Add PRL to favorites', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Favorites (1)', exact: true }).click();
      assert.equal(await page.locator('article').count(), 1);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('article').count(), 1);
      const search = new URL(page.url()).search;
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page
        .locator('#open-player')
        .evaluate((element) => element.focus({ preventScroll: true }));
      const scroll = await page.evaluate(() => scrollY);
      await page.keyboard.press('Enter');
      await page.waitForURL('**/now-playing');
      await page.locator('[aria-label="Radio player"]').waitFor({ state: 'detached' });
      assert.equal(await page.locator('[aria-label="Radio player"]').count(), 0);
      await page.getByRole('button', { name: 'Back to stations' }).click();
      await page.waitForURL((url) => url.pathname === '/' && url.search === search);
      await page.locator('#station-search').waitFor();
      assert.equal(await page.locator('#station-search').inputValue(), 'PRL');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-player');
      await page.waitForFunction((expected) => Math.abs(scrollY - expected) <= 2, scroll, {
        timeout: 5000,
      });
      await page.getByRole('button', { name: 'Remove PRL from favorites', exact: true }).click();
      await page.getByRole('heading', { name: 'Your favorites start here' }).waitFor();
      await page.getByRole('button', { name: 'Browse all stations' }).click();
      await page.locator('[aria-controls="station-refinements"]').click();
      await page.locator('#station-country').selectOption('US');
      await page.locator('#station-genre').selectOption('Pop');
      await page.getByRole('heading', { name: 'No matching stations' }).waitFor();
      await page.getByRole('button', { name: 'Clear search and filters' }).click();
      await page.waitForFunction(() => document.querySelectorAll('article').length === 9);
      assert.equal(await page.locator('article').count(), 9);
      // Timer dialog works with a keyboard and stays active across routes.
      await page.getByRole('button', { name: 'Sleep timer', exact: true }).click();
      const timerDialog = page.getByRole('dialog', { name: 'Sleep timer', exact: true });
      await timerDialog.waitFor();
      await accessible(page, `${mode}-sleep-timer`);
      await screenshot(page, `${mode}-sleep-timer`);
      await page.keyboard.press('Escape');
      await timerDialog.waitFor({ state: 'hidden' });
      assert.equal(
        await page.evaluate(() => document.activeElement.hasAttribute('data-sleep-timer')),
        true,
      );
      await page.locator('[data-sleep-timer]').click();
      await timerDialog.getByRole('button', { name: '30 min', exact: true }).click();
      await page.locator('[data-sleep-timer][aria-pressed="true"]').waitFor();
      await page.locator('#open-player').click();
      await page.waitForURL('**/now-playing');
      await page.locator('[data-sleep-timer][aria-pressed="true"]').waitFor();
      await page.locator('[data-sleep-timer]').click();
      await page.getByRole('button', { name: 'Cancel timer', exact: true }).click();
      await page.locator('[data-sleep-timer][aria-pressed="false"]').waitFor();
      await page.getByRole('button', { name: 'Back to stations', exact: true }).click();
      await page.locator('#station-search').waitFor();
      // Recent data can arrive from another app window; reload/filter/clear keep it usable.
      await page.getByRole('button', { name: 'Recent (0)', exact: true }).click();
      await page
        .getByRole('heading', { name: 'No recent stations to show', exact: true })
        .waitFor();
      const other = await context.newPage();
      await other.goto(base, { waitUntil: 'networkidle' });
      await other.evaluate(() =>
        localStorage.setItem(
          'wra:recent:v1',
          JSON.stringify({
            version: 1,
            stationIds: ['heart-uk', 'missing-station', 'capital-dance'],
          }),
        ),
      );
      await page.getByRole('button', { name: 'Recent (2)', exact: true }).waitFor();
      await other.close();
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(new URL(page.url()).searchParams.get('section'), 'recent');
      assert.deepEqual(await page.locator('[data-station-title]').allTextContents(), [
        'Heart UK',
        'Capital Dance',
      ]);
      await accessible(page, `${mode}-recent`);
      await screenshot(page, `${mode}-recent`);
      await page.locator('#station-search').fill('Heart');
      await page.waitForFunction(() => document.querySelectorAll('article').length === 1);
      await page.locator('#station-search').fill('');
      await page.waitForFunction(() => document.querySelectorAll('article').length === 2);
      await page.getByRole('button', { name: 'Add Heart UK to favorites', exact: true }).click();
      await page.getByRole('button', { name: 'Clear history', exact: true }).click();
      await page
        .getByRole('heading', { name: 'No recent stations to show', exact: true })
        .waitFor();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'recent-collection');
      assert.deepEqual(
        await page.evaluate(() => JSON.parse(localStorage.getItem('wra:recent:v1')).stationIds),
        [],
      );
      await page.getByRole('button', { name: 'Favorites (1)', exact: true }).click();
      await page
        .getByRole('button', { name: 'Remove Heart UK from favorites', exact: true })
        .click();
      await page.getByRole('button', { name: 'All stations (9)', exact: true }).click();
      await page.locator('#appearance').selectOption(mode === 'dark' ? 'light' : 'dark');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(
        await page.locator('#appearance').inputValue(),
        mode === 'dark' ? 'light' : 'dark',
      );
      // Large text must reflow; scrolling is allowed instead of clipping controls.
      await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Large text causes horizontal overflow',
      );
      await screenshot(page, `${mode}-large-text`);
      assert.deepEqual(errors, [], 'Browser runtime errors');
      await context.close();
    }
    // Use real Audio here: startup must not request a stream or autoplay.
    const context = await createAppContext(browser);
    await context.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.__radioStartupAudio = [];
      window.Audio = function Audio(...args) {
        const audio = new NativeAudio(...args);
        const play = audio.play;
        audio.startupPlayCalls = 0;
        audio.play = function (...playArgs) {
          audio.startupPlayCalls += 1;
          return play.apply(this, playArgs);
        };
        window.__radioStartupAudio.push(audio);
        return audio;
      };
      window.Audio.prototype = NativeAudio.prototype;
      Object.setPrototypeOf(window.Audio, NativeAudio);
    });
    const page = await context.newPage();
    activePage = page;
    await page.goto(base, { waitUntil: 'networkidle' });
    // Inspect the application's native audio object; preview-toolbar videos
    // belong to Netlify and are independent of radio startup behavior.
    const audioState = await page.evaluate(() =>
      window.__radioStartupAudio.map((audio) => ({
        source: audio.getAttribute('src'),
        paused: audio.paused,
        playCalls: audio.startupPlayCalls,
      })),
    );
    assert.deepEqual(audioState, [{ source: null, paused: true, playCalls: 0 }]);
    assert.equal(
      await page.locator('[data-player-status]').getAttribute('data-player-status'),
      'idle',
    );
    const timedPage = await context.newPage();
    activePage = timedPage;
    await timedPage.clock.install();
    await timedPage.goto(base, { waitUntil: 'networkidle' });
    await timedPage.locator('[data-sleep-timer]').click();
    await timedPage.getByRole('button', { name: '15 min', exact: true }).click();
    await timedPage.locator('#open-player').click();
    await timedPage.waitForURL('**/now-playing');
    await timedPage.clock.fastForward(15 * 60_000);
    await timedPage.locator('[data-player-status="paused"]').waitFor();
    await timedPage.locator('[data-sleep-timer][aria-pressed="false"]').waitFor();
    assert.deepEqual(
      await timedPage.evaluate(() =>
        window.__radioStartupAudio.map((audio) => ({
          source: audio.getAttribute('src'),
          playCalls: audio.startupPlayCalls,
        })),
      ),
      [{ source: null, playCalls: 0 }],
    );
    await context.close();
    console.log(JSON.stringify({ passed: true, scenarios: report.length, report }, null, 2));
  } catch (error) {
    if (activePage && !activePage.isClosed())
      console.error('Browser state:', {
        url: activePage.url(),
        navigationDiagnostics,
        position: await activePage.evaluate(() => ({
          scrollY,
          height: document.documentElement.scrollHeight,
          focus: document.activeElement.id,
        })),
        text: await activePage.locator('body').innerText(),
      });
    if (activePage && !activePage.isClosed()) await screenshot(activePage, 'failure');
    throw error;
  } finally {
    fs.writeFileSync(path.join(reportDir, 'geometry.json'), JSON.stringify(report, null, 2));
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
