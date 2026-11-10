const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve('build');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'asset-manifest.json')));
const source = fs.readFileSync(path.join(__dirname, 'pwa-worker.js'), 'utf8');
const extra = [
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/favicon-96x96.png',
  '/icons/favicon.ico',
  '/icons/apple-touch-icon.png',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png',
  '/icons/maskable-512.png',
];
const urls = [
  ...new Set([
    ...Object.values(manifest.files).filter(
      (url) =>
        url.startsWith('/static/') &&
        !/\.(map|txt)$/.test(url) &&
        !(manifest.optionalFiles || []).includes(url),
    ),
    ...extra,
  ]),
].sort();
const types = {
  '.js': ['text/javascript', 'application/javascript'],
  '.css': ['text/css'],
  '.html': ['text/html'],
  '.json': ['application/json', 'application/manifest+json'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml'],
  '.ico': ['image/x-icon', 'image/vnd.microsoft.icon'],
};
const assets = urls.map((url) => {
  const file = path.join(root, url);
  if (!fs.existsSync(file) || !types[path.extname(file)])
    throw new Error(`Invalid precache path: ${url}`);
  return {
    url,
    revision: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    types: types[path.extname(file)],
  };
});
const version = createHash('sha256').update(source).update(JSON.stringify(assets)).digest('hex');
const config = { version, assets };
fs.writeFileSync(
  path.join(root, 'service-worker.js'),
  source.replace('/*WRA_CONFIG*/ null', JSON.stringify(config)),
);
console.log(`Offline shell built: ${assets.length} assets, version ${version.slice(0, 12)}.`);
