// Real native MP3 playback across a broken TLS stream; no play/event mocks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { createAppContext, waitForServiceWorker } = require('./browser-context.cjs');
const output = path.resolve(
  'test-results/recovery',
  process.env.WRA_BASE_URL ? 'preview' : 'build',
);
const uuid = '23456789-1234-1234-1234-123456789abc';
const id = `rb-${uuid}`;
const fixtureUrl = 'https://recovery.fixture.test/live.mp3';
const tone = Buffer.from(
  fs.readFileSync(path.join(__dirname, 'fixtures/hls-tone.mp3.base64'), 'utf8'),
  'base64',
);
const root = path.resolve('build');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label, ms = 45000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
}
async function main() {
  fs.mkdirSync(output, { recursive: true });
  // Ephemeral localhost certificate: never a deployment key, never committed.
  const certDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wra-recovery-'));
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      path.join(certDir, 'key.pem'),
      '-out',
      path.join(certDir, 'cert.pem'),
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
    ],
    { stdio: 'ignore' },
  );
  let requests = 0,
    rejected = 0,
    unavailable = false;
  const streams = new Set();
  const streamServer = https.createServer(
    {
      key: fs.readFileSync(path.join(certDir, 'key.pem')),
      cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
    },
    (req, res) => {
      requests++;
      if (unavailable) {
        rejected++;
        res
          .writeHead(503, { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' })
          .end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      });
      res.write(tone);
      const interval = setInterval(() => res.write(tone), 5000);
      streams.add(res);
      res.on('close', () => {
        clearInterval(interval);
        streams.delete(res);
      });
    },
  );
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(root, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  await new Promise((resolve) => streamServer.listen(0, '127.0.0.1', resolve));
  const base = process.env.WRA_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const certificates = [path.join(certDir, 'cert.pem'), process.env.WRA_BROWSER_CA_CERT].filter(
    Boolean,
  );
  const trustedKeys = certificates.map((file) => {
    const publicKey = execFileSync('openssl', ['x509', '-pubkey', '-noout', '-in', file]);
    const spki = execFileSync('openssl', ['pkey', '-pubin', '-outform', 'DER'], {
      input: publicKey,
    });
    return createHash('sha256').update(spki).digest('base64');
  });
  // Trust only these explicit fixture/proxy certificate keys, keeping other TLS
  // checks enabled. A remote preview needs permission to reach local test media.
  const browser = await chromium.launch({
    args: [`--ignore-certificate-errors-spki-list=${trustedKeys.join(',')}`],
  });
  const context = await createAppContext(browser, {
    viewport: { width: 390, height: 844 },
    permissions: ['local-network-access'],
  });
  let page;
  const transportErrors = [];
  try {
    await context.addInitScript(
      ({ uuid, fixtureUrl }) => {
        localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language: 'en' }));
        if (!localStorage.getItem('wra:stations:v1'))
          localStorage.setItem(
            'wra:stations:v1',
            JSON.stringify({
              version: 1,
              stations: [
                {
                  directoryId: uuid,
                  name: 'Recovery fixture',
                  countryCode: 'GB',
                  languageCodes: ['en'],
                  genres: [],
                  url: fixtureUrl,
                },
              ],
            }),
          );
        const NativeAudio = window.Audio;
        window.__recoveryAudio = [];
        window.Audio = function (...args) {
          const audio = new NativeAudio(...args);
          window.__recoveryAudio.push(audio);
          return audio;
        };
        const now = Date.now;
        window.__clockOffset = 0;
        Date.now = () => now() + window.__clockOffset;
      },
      { uuid, fixtureUrl },
    );
    await context.route(fixtureUrl, (route) =>
      route.continue({ url: `https://127.0.0.1:${streamServer.address().port}/live.mp3` }),
    );
    page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') transportErrors.push(message.text());
    });
    page.on('requestfailed', (request) => {
      if (request.url() === fixtureUrl) transportErrors.push(request.failure()?.errorText);
    });
    await page.goto(base + '/?q=Recovery+fixture', { waitUntil: 'networkidle' });
    await waitForServiceWorker(page);
    await page.locator('article button[aria-pressed]').click();
    await page.locator(`[data-station-id="${id}"]`).click();
    const playing = async () => {
      await page.locator('[data-player-status="playing"]').first().waitFor({ timeout: 45000 });
      await page.waitForFunction(() => window.__recoveryAudio[0].currentTime > 0.2);
    };
    await playing();
    await page.locator('[data-sleep-timer]').first().click();
    await page.locator('[data-sleep-minutes="15"]').first().click();
    // The browser still reports online. Break only the media transport and reject
    // early reconnections, like a Wi-Fi -> cellular handover with no online event.
    assert.equal(await page.evaluate(() => navigator.onLine), true);
    unavailable = true;
    streams.forEach((res) => res.destroy());
    await until(() => rejected >= 2, 'bounded retry through unavailable network');
    unavailable = false;
    await playing();
    assert.equal(await page.evaluate(() => navigator.onLine), true);
    assert.ok(requests >= 4);
    assert.equal(await page.locator('[data-sleep-timer][aria-pressed="true"]').count(), 1);
    assert.equal(await page.locator('article button[aria-pressed="true"]').count(), 1);
    const history = await page.evaluate(() => localStorage.getItem('wra:recent:v1'));
    assert.ok(JSON.parse(history).stationIds.includes(id));
    // Controlled native pause/Play simulation, NOT a physical Android call test.
    await page.evaluate(() => window.__recoveryAudio[0].pause());
    await page.getByText('Paused by device. Press Play.', { exact: true }).waitFor();
    const pausedRequests = requests;
    await sleep(1800);
    assert.equal(requests, pausedRequests, 'Outside pause must not cause automatic reconnect');
    assert.equal(await page.locator('[data-sleep-timer][aria-pressed="true"]').count(), 1);
    await page.evaluate(() => {
      window.__recoveryAudio[0].play().catch(() => {});
    });
    await until(() => requests > pausedRequests, 'actual device Play reconnects live resource');
    await playing();
    assert.equal(await page.locator('[data-sleep-timer][aria-pressed="true"]').count(), 1);
    await page.evaluate(() => window.__recoveryAudio[0].pause());
    await page.getByText('Paused by device. Press Play.', { exact: true }).waitFor();
    const beforeExpiry = requests;
    // Wall-clock expiry check must run before a device Play reopens the stream.
    await page.evaluate(() => {
      window.__clockOffset += 16 * 60000;
      window.__recoveryAudio[0].play().catch(() => {});
    });
    await page.locator('[data-sleep-timer][aria-pressed="false"]').first().waitFor();
    assert.equal(await page.evaluate(() => window.__recoveryAudio[0].getAttribute('src')), null);
    await sleep(1800);
    assert.equal(requests, beforeExpiry);
    await page.locator(`[data-station-id="${id}"]`).click();
    await playing();
    unavailable = true;
    const beforeBreak = rejected;
    streams.forEach((res) => res.destroy());
    await until(() => rejected > beforeBreak, 'reconnection queued before manual pause');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const afterPause = requests;
    unavailable = false;
    await sleep(5000);
    assert.equal(requests, afterPause, 'Manual pause must cancel scheduled retries');
    assert.deepEqual(
      await page.evaluate(() => ({
        count: window.__recoveryAudio.length,
        paused: window.__recoveryAudio[0].paused,
        src: window.__recoveryAudio[0].getAttribute('src'),
      })),
      { count: 1, paused: true, src: null },
    );
    assert.equal(await page.evaluate(() => localStorage.getItem('wra:recent:v1')), history);
    assert.equal(await page.locator('article button[aria-pressed="true"]').count(), 1);
    assert.deepEqual(errors, []);
    const result = {
      passed: true,
      realNativeDecoding: true,
      onlineThroughout: true,
      transportRecovery: true,
      devicePauseSimulation: true,
      explicitPauseCancelsRetry: true,
      sleepDeadlinePreserved: true,
      expiredTimerBlocksDevicePlay: true,
      oneAudio: true,
      favoritesHistoryPreserved: true,
      physicalCallTest: 'pending',
      requests,
      rejected,
    };
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    console.log('RECOVERY_RESULT ' + JSON.stringify(result));
  } catch (error) {
    if (page) {
      await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
      console.error(
        await page
          .evaluate(() => ({
            status: document.querySelector('[data-player-status]')?.outerHTML,
            audio: window.__recoveryAudio?.map((a) => ({
              src: a.currentSrc,
              time: a.currentTime,
              paused: a.paused,
              ready: a.readyState,
              error: a.error?.code,
            })),
          }))
          .catch(() => null),
        { requests, rejected, transportErrors },
      );
    }
    throw error;
  } finally {
    await context.close();
    await browser.close();
    streams.forEach((res) => res.destroy());
    server.closeAllConnections();
    streamServer.closeAllConnections();
    await Promise.all([
      new Promise((r) => server.close(r)),
      new Promise((r) => streamServer.close(r)),
    ]);
    fs.rmSync(certDir, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
