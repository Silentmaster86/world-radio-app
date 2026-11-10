const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { createAppContext } = require('./browser-context.cjs');
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
  let count = 0;
  try {
    for (const language of ['en', 'pl'])
      for (const colorScheme of ['light', 'dark']) {
        const context = await createAppContext(browser, { colorScheme });
        await context.addInitScript(
          (language) =>
            localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language })),
          language,
        );
        let requests = 0;
        await context.route('**/.netlify/functions/radio-directory?*', (route) => {
          requests++;
          return route.fulfill({
            json: {
              rows: [
                {
                  stationuuid: '12345678-1234-1234-1234-123456789abc',
                  name: 'World Jazz',
                  countrycode: 'FR',
                  url_resolved: 'https://radio.example/live',
                  tags: 'jazz',
                },
              ],
              hasMore: false,
            },
          });
        });
        const page = await context.newPage();
        for (const width of [320, 390, 1440]) {
          await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
          await page.goto(base + '/discover', { waitUntil: 'networkidle' });
          await page.locator('form input').first().fill('jazz');
          await page.locator('form button').click();
          await page.getByRole('heading', { name: 'World Jazz', exact: true }).waitFor();
          assert.ok(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          );
          for (const selector of ['form input', 'form button', 'article button'])
            for (const node of await page.locator(selector).all()) {
              const box = await node.boundingBox();
              assert.ok(box.width >= 44 && box.height >= 44);
            }
          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
          assert.deepEqual(
            axe.violations.map((x) => x.id),
            [],
          );
          if (!(await page.locator('article button').isDisabled()))
            await page.locator('article button').click();
          assert.equal(await page.locator('article button').isDisabled(), true);
          const key = await page.evaluate(
            () => JSON.parse(localStorage.getItem('wra:stations:v1')).stations[0].id,
          );
          assert.equal(key, 'rb-12345678-1234-1234-1234-123456789abc');
          await page.goto(base + '/?q=World+Jazz', { waitUntil: 'networkidle' });
          assert.equal(await page.locator('article').count(), 1);
          assert.equal(await page.locator('[data-station-title]').innerText(), 'World Jazz');
          await page.locator('article button[aria-pressed]').click();
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await page.locator('article button[aria-pressed="true"]').count(), 1);
          await page.locator('article button[aria-pressed]').click();
          count++;
        }
        assert.equal(requests, 3);
        await context.close();
      }
    console.log(
      `DISCOVERY_RESULT ${JSON.stringify({ passed: true, layouts: count, accessibility: true, addition: true, persistence: true, favorites: true })}`,
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
