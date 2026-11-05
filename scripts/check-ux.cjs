/* Browser checks for a production build. Tools are provisioned by the CI browser job. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const reportDir = path.resolve('test-results/ux');
fs.mkdirSync(reportDir, { recursive: true });
const root = path.resolve('build');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const report = [];

async function geometry(page, car = false) {
  const result = await page.evaluate((car) => {
    const rect = (element) => { const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height }; };
    const visible = (element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    const scope = car ? document.querySelector('[aria-label="Car mode player"]') : document.querySelector('[aria-label="Radio player"]');
    return {
      width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
      controls: [...scope.querySelectorAll('button, input')].filter(visible).map((el) => ({ label: el.getAttribute('aria-label'), ...rect(el) })),
      dock: car ? null : rect(scope),
      lastStation: car ? null : rect(document.querySelector('article:last-child')),
    };
  }, car);
  assert.ok(result.documentWidth <= result.width + 1, `Horizontal overflow: ${JSON.stringify(result)}`);
  for (const control of result.controls) {
    assert.ok(control.width >= 43 && control.height >= 43, `Small target: ${JSON.stringify(control)}`);
    assert.ok(control.x >= -1 && control.right <= result.width + 1, `Clipped horizontal control: ${JSON.stringify(control)}`);
    assert.ok(control.y >= -1 && control.bottom <= result.height + 1, `Control outside viewport: ${JSON.stringify(control)}`);
  }
  if (!car) assert.ok(result.lastStation.bottom <= result.dock.y + 1, `Dock covers the last station: ${JSON.stringify(result)}`);
  return result;
}
async function accessible(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  fs.writeFileSync(path.join(reportDir, `${label}-axe.json`), JSON.stringify(result.violations, null, 2));
  assert.deepEqual(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })), [], `${label}: accessibility violations`);
}
async function screenshot(page, label) {
  await page.screenshot({ path: path.join(reportDir, `${label}.png`), fullPage: true });
}
async function main() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(`${root}${path.sep}`) && file !== root) { response.writeHead(403).end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  let activePage;
  try {
    for (const mode of ['light', 'dark']) {
      const context = await browser.newContext({ colorScheme: mode, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      const page = await context.newPage(); activePage = page;
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 481, height: 800 }, { width: 1440, height: 900 }]) {
        await page.setViewportSize(viewport);
        await page.goto(base, { waitUntil: 'networkidle' });
        await page.locator('article').last().scrollIntoViewIfNeeded();
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const label = `${mode}-home-${viewport.width}`;
        const dimensions = await geometry(page);
        await accessible(page, label);
        await screenshot(page, label);
        report.push({ label, dimensions });
      }
      for (const viewport of [{ width: 844, height: 390 }, { width: 568, height: 320 }]) {
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
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const fullListScroll = await page.evaluate(() => scrollY);
      assert.ok(fullListScroll > 0, 'The mobile catalog should scroll');
      await page.locator('#open-player').focus();
      await page.keyboard.press('Enter');
      await page.waitForURL('**/now-playing');
      await page.goBack({ waitUntil: 'networkidle' });
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - fullListScroll) <= 2, 'Browser Back did not restore the list scroll');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-player');
      await page.goto(`${base}/?country=GB&genre=News&language=pl&q=PRL`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('article').count(), 1);
      await page.getByRole('button', { name: 'Add PRL to favorites', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Favorites (1)', exact: true }).click();
      assert.equal(await page.locator('article').count(), 1);
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('article').count(), 1);
      const search = new URL(page.url()).search;
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const scroll = await page.evaluate(() => scrollY);
      await page.locator('#open-player').focus();
      await page.keyboard.press('Enter');
      await page.waitForURL('**/now-playing');
      assert.equal(await page.locator('[aria-label="Radio player"]').count(), 0);
      await page.getByRole('button', { name: 'Back to stations' }).click();
      await page.waitForURL((url) => url.pathname === '/' && url.search === search);
      assert.equal(await page.locator('#station-search').inputValue(), 'PRL');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-player');
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - scroll) <= 2, 'List scroll was not restored');
      await page.getByRole('button', { name: 'Remove PRL from favorites', exact: true }).click();
      assert.ok(await page.getByRole('heading', { name: 'Your favorites start here' }).isVisible());
      await page.getByRole('button', { name: 'Browse all stations' }).click();
      await page.locator('#station-country').selectOption('US');
      await page.locator('#station-genre').selectOption('Pop');
      assert.ok(await page.getByRole('heading', { name: 'No matching stations' }).isVisible());
      await page.getByRole('button', { name: 'Clear search and filters' }).click();
      assert.equal(await page.locator('article').count(), 9);
      await page.locator('#appearance').selectOption(mode === 'dark' ? 'light' : 'dark');
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.locator('#appearance').inputValue(), mode === 'dark' ? 'light' : 'dark');
      // Large text must reflow; scrolling is allowed instead of clipping controls.
      await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Large text causes horizontal overflow');
      await screenshot(page, `${mode}-large-text`);
      assert.deepEqual(errors, [], 'Browser runtime errors');
      await context.close();
    }
    // Use real Audio here: startup must not request a stream or autoplay.
    const context = await browser.newContext();
    const page = await context.newPage(); activePage = page;
    const media = [];
    page.on('request', (request) => { if (request.resourceType() === 'media') media.push(request.url()); });
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.deepEqual(media, []);
    assert.equal(await page.locator('[data-player-status]').getAttribute('data-player-status'), 'idle');
    await context.close();
    console.log(JSON.stringify({ passed: true, scenarios: report.length, report }, null, 2));
  } catch (error) {
    if (activePage && !activePage.isClosed()) await screenshot(activePage, 'failure');
    throw error;
  } finally {
    fs.writeFileSync(path.join(reportDir, 'geometry.json'), JSON.stringify(report, null, 2));
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
