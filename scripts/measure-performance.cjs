/* Compare production builds under identical Lighthouse settings, without preview toolbar noise. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const output = path.resolve('test-results/performance');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serve(build) {
  const root = path.resolve(build);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(`${root}${path.sep}`) && file !== root) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}
const metricIds = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index', 'interactive', 'total-byte-weight', 'bootup-time', 'mainthread-work-breakdown'];
async function main() {
  const { default: lighthouse } = await import(pathToFileURL(require.resolve('lighthouse')).href);
  const { launch } = await import(pathToFileURL(require.resolve('chrome-launcher')).href);
  const { default: desktopConfig } = await import(pathToFileURL(require.resolve('lighthouse/core/config/desktop-config.js')).href);
  const runs = Number(process.env.PERFORMANCE_RUNS || 1);
  const targets = [
    { name: 'baseline', build: process.env.WRA_BASE_BUILD },
    { name: 'candidate', build: process.env.WRA_CANDIDATE_BUILD || 'build' },
  ];
  const servers = [];
  let chrome;
  const summaries = [];
  try {
    for (const target of targets) {
      if (!target.build) continue;
      servers.push({ name: target.name, ...await serve(target.build) });
    }
    chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] });
    for (const profile of ['mobile', 'desktop']) {
      for (let run = 1; run <= (profile === 'mobile' ? runs : 1); run += 1) {
        for (const target of servers) {
          const result = await lighthouse(target.url, { port: chrome.port, output: ['html', 'json'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], logLevel: 'error', maxWaitForLoad: 35000 }, profile === 'desktop' ? desktopConfig : undefined);
          if (result.lhr.runtimeError) throw new Error(JSON.stringify(result.lhr.runtimeError));
          const label = `${target.name}-${profile}-${run}`;
          fs.writeFileSync(path.join(output, `${label}.html`), result.report[0]);
          fs.writeFileSync(path.join(output, `${label}.json`), result.report[1]);
          const lhr = result.lhr;
          const summary = {
            label, version: lhr.lighthouseVersion, profile,
            scores: Object.fromEntries(Object.entries(lhr.categories).map(([name, value]) => [name, value.score])),
            metrics: Object.fromEntries(metricIds.map((id) => [id, { value: lhr.audits[id]?.numericValue, display: lhr.audits[id]?.displayValue }])),
            findings: Object.values(lhr.audits).filter((audit) => audit.score !== null && audit.score < 1).map(({ id, title, score, displayValue, details }) => ({ id, title, score, displayValue, details })),
          };
          fs.writeFileSync(path.join(output, `${label}-summary.json`), JSON.stringify(summary, null, 2));
          summaries.push(summary);
          console.log('PERFORMANCE_RESULT ' + JSON.stringify(summary));
        }
      }
    }
  } finally {
    fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summaries, null, 2));
    await chrome?.kill();
    await Promise.all(servers.map(({ server }) => new Promise((resolve) => server.close(resolve))));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
