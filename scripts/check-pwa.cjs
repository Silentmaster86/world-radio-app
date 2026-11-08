const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const { createAppContext } = require('./browser-context.cjs');
const output = path.resolve('test-results/pwa', process.env.WRA_BASE_URL ? 'preview' : 'build');
fs.mkdirSync(output, { recursive: true });
const root = path.resolve('build');
const mime = {
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.html': 'text/html',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.txt': 'text/plain',
};
async function until(check, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out: ${label}`);
}
async function status(page) {
  return page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => {
        channel.port1.close();
        reject(new Error('Worker status timeout'));
      }, 5000);
      channel.port1.onmessage = ({ data }) => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(data);
      };
      reg.active.postMessage({ type: 'WRA_STATUS' }, [channel.port2]);
    });
  });
}
async function main() {
  let release = 1;
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(root, 'index.html');
    let bytes = fs.readFileSync(file);
    if (release === 2 && file.endsWith('service-worker.js'))
      bytes = Buffer.from(bytes.toString().replace(/("version":")[^"]+/, '$1pwa-test-release-2'));
    if (release === 2 && file.endsWith('index.html'))
      bytes = Buffer.from(
        bytes
          .toString()
          .replace(
            '<title>World Radio App</title>',
            '<title>World Radio App — update test</title>',
          ),
      );
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', file.endsWith('service-worker.js') ? 'no-store' : 'no-cache');
    res.end(bytes);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const context = await createAppContext(browser, { viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    });
    window.__pwaAudio = [];
    window.Audio = class extends EventTarget {
      constructor() {
        super();
        this._src = '';
        this.currentSrc = '';
        this.volume = 1;
        this.muted = false;
        this.paused = true;
        this.ended = false;
        this.readyState = 0;
        this.error = null;
        this.playCalls = 0;
        window.__pwaAudio.push(this);
      }
      set src(value) {
        this._src = value;
      }
      get src() {
        return this._src;
      }
      getAttribute(name) {
        return name === 'src' && this._src ? this._src : null;
      }
      removeAttribute() {
        this._src = '';
        this.currentSrc = '';
      }
      load() {
        this.currentSrc = '';
        this.readyState = 0;
      }
      play() {
        this.playCalls += 1;
        this.paused = false;
        this.currentSrc = this._src;
        this.readyState = 4;
        this.dispatchEvent(new Event('playing'));
        return Promise.resolve();
      }
      pause() {
        const changed = !this.paused;
        this.paused = true;
        if (changed) this.dispatchEvent(new Event('pause'));
      }
    };
  });
  let page = await context.newPage();
  const report = {};
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    const manifestResponse = await page.request.get(`${base}/manifest.json`);
    const manifest = await manifestResponse.json();
    assert.equal(manifest.id, '/');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.orientation, 'any');
    for (const icon of manifest.icons) {
      const response = await page.request.get(new URL(icon.src, base).href);
      const bytes = await response.body();
      const size = Number(icon.sizes.split('x')[0]);
      assert.equal(response.status(), 200);
      assert.equal(bytes.readUInt32BE(16), size);
      assert.equal(bytes.readUInt32BE(20), size);
    }
    assert.ok(
      manifest.icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512'),
    );
    const workerResponse = await page.request.get(`${base}/service-worker.js`);
    assert.ok(workerResponse.headers()['content-type'].includes('javascript'));
    if (process.env.WRA_BASE_URL)
      assert.ok(workerResponse.headers()['cache-control'].includes('no-cache'));
    const first = await status(page);
    assert.equal(first.ready, true);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.getByRole('button', { name: 'Install app', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(
      await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
      'Install app',
    );
    await page.getByRole('button', { name: 'Add Capital Dance to favorites', exact: true }).click();
    await page.locator('#appearance').selectOption('dark');
    // Confirmed playback uses the controlled fixture, never a real network stream.
    await page.locator('[data-station-id="heart-uk"]').click();
    await page.locator('[data-player-status="playing"]').waitFor();
    await page.locator('[data-station-id="capital-dance"]').click();
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem('wra:recent:v1') || '{}').stationIds?.[0] ===
        'capital-dance',
    );
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await context.setOffline(true);
    await page.goto(`${base}/?section=favorites`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-station-id="capital-dance"]').waitFor();
    assert.equal(await page.locator('[data-station-title]').count(), 1);
    assert.equal(await page.locator('#appearance').inputValue(), 'dark');
    await page.waitForFunction(() =>
      document
        .querySelector('[data-player-status]')
        .textContent.includes('Saved stations are available'),
    );
    assert.equal(await page.evaluate(() => window.__pwaAudio[0].playCalls), 0);
    await page.screenshot({ path: path.join(output, 'offline-favorites.png'), fullPage: true });
    await page.goto(`${base}/?section=recent`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Recent (2)', exact: true }).waitFor();
    assert.deepEqual(await page.locator('[data-station-title]').allTextContents(), [
      'Capital Dance',
      'Heart UK',
    ]);
    assert.equal(await page.evaluate(() => window.__pwaAudio[0].playCalls), 0);
    await page.screenshot({ path: path.join(output, 'offline-recent.png'), fullPage: true });
    await page.goto(`${base}/?page=2`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('article').count(), 12);
    await page.locator('[aria-controls="station-refinements"]').click();
    await page.locator('#station-country').selectOption('DE');
    await page.locator('#station-language').selectOption('de');
    await page.waitForFunction(() => document.querySelectorAll('article').length === 3);
    assert.equal(await page.locator('article svg').count(), 3);
    assert.equal(await page.evaluate(() => window.__pwaAudio[0].playCalls), 0);
    await page.screenshot({ path: path.join(output, 'offline-catalog.png'), fullPage: true });
    await page.goto(`${base}/now-playing`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Capital Dance', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__pwaAudio[0].playCalls), 0);
    await page.screenshot({ path: path.join(output, 'offline-car.png'), fullPage: true });
    await context.setOffline(false);
    await page.goto(base, { waitUntil: 'networkidle' });
    const cacheReport = await page.evaluate(async () => {
      const names = (await caches.keys()).filter((name) => name.startsWith('wra-shell-'));
      const cache = await caches.open(names[0]);
      return { names, urls: (await cache.keys()).map((request) => request.url) };
    });
    assert.equal(cacheReport.names.length, 1);
    assert.ok(cacheReport.urls.every((url) => new URL(url).origin === new URL(base).origin));
    assert.ok(cacheReport.urls.every((url) => !new URL(url).search && !/\.mp3/.test(url)));
    report.manifest = true;
    report.offlineFavorites = true;
    report.offlineRecent = true;
    report.offlineCuratedCatalog = true;
    report.offlineDirectCar = true;
    report.noAutoplay = true;
    report.cache = cacheReport;
    if (!process.env.WRA_BASE_URL) {
      await page.evaluate(async () => {
        const cache = await caches.open('unrelated-app-data');
        await cache.put('/example', new Response('keep'));
        window.__pwaDocument = 'original';
      });
      await page.locator('[data-station-id="capital-dance"]').click();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-player-status]').getAttribute('data-player-status') ===
          'playing',
      );
      const second = await context.newPage();
      await second.goto(base, { waitUntil: 'networkidle' });
      const created = context.waitForEvent('serviceworker');
      release = 2;
      await second.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration('/');
        await registration.update();
      });
      const nextWorker = await created;
      await page.waitForFunction(async () =>
        Boolean((await navigator.serviceWorker.getRegistration('/')).waiting),
      );
      await page
        .getByText('Update ready. Finish listening, close all app windows and tabs, then reopen.', {
          exact: true,
        })
        .waitFor();
      assert.equal((await status(page)).version, first.version);
      assert.equal(await page.evaluate(() => window.__pwaDocument), 'original');
      assert.equal(
        await page.locator('[data-player-status]').getAttribute('data-player-status'),
        'playing',
      );
      await second.goto(`${base}/now-playing`, { waitUntil: 'networkidle' });
      assert.equal(await second.title(), 'World Radio App');
      await second.close();
      assert.ok(
        await page.evaluate(async () =>
          Boolean((await navigator.serviceWorker.getRegistration('/')).waiting),
        ),
      );
      await page.close();
      await until(
        () =>
          nextWorker.evaluate(
            () =>
              self.registration.waiting === null && self.registration.active?.state === 'activated',
          ),
        'activation after all app windows close',
      );
      page = await context.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(await page.title(), 'World Radio App — update test');
      assert.equal((await status(page)).version, 'pwa-test-release-2');
      assert.equal(
        await page
          .getByRole('button', { name: 'Remove Capital Dance from favorites', exact: true })
          .count(),
        1,
      );
      assert.equal(await page.locator('#appearance').inputValue(), 'dark');
      assert.equal(await page.evaluate(() => window.__pwaAudio[0].playCalls), 0);
      assert.deepEqual(
        await page.evaluate(() => JSON.parse(localStorage.getItem('wra:recent:v1')).stationIds),
        ['capital-dance', 'heart-uk'],
      );
      const names = await page.evaluate(() => caches.keys());
      assert.ok(names.includes('unrelated-app-data'));
      assert.equal(names.filter((name) => name.startsWith('wra-shell-')).length, 1);
      report.safeMultiTabUpdate = true;
      report.preferencesPreserved = true;
      report.unrelatedCachePreserved = true;
    }
    console.log('PWA_RESULT ' + JSON.stringify(report));
  } catch (error) {
    if (!page.isClosed()) {
      console.error('PWA failure state', {
        url: page.url(),
        text: await page.locator('body').innerText(),
      });
      await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
    }
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
