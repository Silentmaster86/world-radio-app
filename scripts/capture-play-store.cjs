// Render real app screens; run after npm run build with the CI browser tools.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const { chromium } = require('playwright');
const output = path.resolve('docs/google-play/assets');
const build = path.resolve('build');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};
async function settled(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
  });
}
async function main() {
  fs.mkdirSync(output, { recursive: true });
  fs.copyFileSync('android/store_icon.png', path.join(output, 'icon-512.png'));
  const server = http.createServer((request, response) => {
    const candidate = path.resolve(build, '.' + new URL(request.url, 'http://localhost').pathname);
    if (!candidate.startsWith(build + path.sep) && candidate !== build)
      return response.writeHead(403).end();
    let file = candidate;
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) file = path.join(build, 'index.html');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`,
    browser = await chromium.launch();
  const images = [];
  try {
    for (const [language, locale] of [
      ['en', 'en-US'],
      ['pl', 'pl-PL'],
    ]) {
      const folder = path.join(output, locale);
      fs.mkdirSync(folder, { recursive: true });
      const context = await browser.newContext({
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 3,
        reducedMotion: 'reduce',
        locale,
      });
      await context.addInitScript((language) => {
        localStorage.setItem('wra:language:v1', JSON.stringify({ version: 1, language }));
        if (!localStorage.getItem('wra:theme:v1'))
          localStorage.setItem('wra:theme:v1', JSON.stringify({ version: 1, mode: 'light' }));
      }, language);
      const page = await context.newPage();
      const capture = async (name) => {
        await settled(page);
        await page.screenshot({ path: path.join(folder, name) });
        images.push(`${locale}/${name}`);
      };
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('#language option').count(), 8);
      await capture('phone-01-library-light.png');
      await page.locator('.station-card').nth(0).locator('.station-favorite').click();
      await page.locator('.station-card').nth(2).locator('.station-favorite').click();
      await page.locator('#open-settings').click();
      await page.locator('#appearance').selectOption('dark');
      await page.locator('#close-settings').click();
      await page
        .getByRole('button', {
          name: language === 'pl' ? 'Ulubione (2)' : 'Favorites (2)',
          exact: true,
        })
        .click();
      await capture('phone-02-favorites-dark.png');
      await page.locator('#open-player').click();
      await page.locator('.now-playing-card').waitFor();
      await capture('phone-03-player-dark.png');
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#open-settings').click();
      await page.locator('#appearance').selectOption('light');
      await capture('phone-04-settings-light.png');
      await context.close();
      const feature = await browser.newPage({
        viewport: { width: 1024, height: 500 },
        deviceScaleFactor: 1,
      });
      const icon = fs.readFileSync(path.join(output, 'icon-512.png')).toString('base64');
      const tagline =
        language === 'pl' ? 'Twoje stacje. Twój rytm.' : 'Your stations. Your rhythm.';
      const sub =
        language === 'pl'
          ? 'Odkrywaj · Słuchaj · Zachowaj ulubione'
          : 'Discover · Listen · Keep your favorites';
      await feature.setContent(`<!doctype html><html lang="${language}"><meta charset="utf-8"><style>
        *{box-sizing:border-box}body{margin:0;width:1024px;height:500px;overflow:hidden;color:#f0f7ff;background:radial-gradient(ellipse at 92% 8%,#33447a 0,transparent 55%),radial-gradient(ellipse at 8% 110%,#1b655c 0,transparent 55%),#080f19;font-family:Arial,sans-serif}
        main{position:relative;width:100%;height:100%;padding:70px 62px}.brand{font-size:20px;letter-spacing:3px;color:#8dbecc;text-transform:uppercase}h1{font-size:57px;line-height:1.05;letter-spacing:-2px;margin:36px 0 15px;max-width:580px}h1 span{display:block;color:#76e6d5;margin-top:8px}p{font-size:21px;color:#c2cce0;max-width:570px;line-height:1.6}img{position:absolute;right:75px;top:125px;width:210px;height:210px;border-radius:42px;box-shadow:0 25px 80px #0006}.line{position:absolute;bottom:50px;left:62px;display:flex;gap:6px;align-items:center;height:30px}.line i{width:4px;border-radius:5px;background:#76e6d5;opacity:.6}
        </style><main><div class="brand">World Radio App</div><h1>${tagline.split('. ')[0]}.<span>${tagline.split('. ')[1]}</span></h1><p>${sub}</p><img src="data:image/png;base64,${icon}" alt=""><div class="line">${[9, 17, 25, 12, 30, 20, 13, 24, 30, 16, 9, 22, 13, 28, 18, 10, 22, 14].map((h) => `<i style="height:${h}px"></i>`).join('')}</div></main></html>`);
      await settled(feature);
      await feature.screenshot({ path: path.join(folder, 'feature-1024x500.png') });
      images.push(`${locale}/feature-1024x500.png`);
      await feature.close();
    }
    fs.writeFileSync(
      path.join(output, 'capture-info.json'),
      JSON.stringify(
        {
          source:
            'Actual production build rendered in desktop Chromium with mobile viewport, not an Android device capture',
          viewport: { width: 360, height: 640, deviceScaleFactor: 3 },
          audio: 'Paused; no fabricated playback state or stream fixtures',
          screenshots: images,
          gitBase: require('node:child_process')
            .execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
            .trim(),
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      JSON.stringify({
        passed: true,
        images: images.length + 1,
        source: 'actual app UI',
        androidDeviceCapture: false,
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
