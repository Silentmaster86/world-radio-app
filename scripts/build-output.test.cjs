const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { writeBuildManifest } = require('./write-build-manifest.cjs');
const { initialJavaScript } = require('./build-assets.cjs');

test('manifest includes imported chunks and cacheable assets; budget excludes deferred JS', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wra-build-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.vite'));
  fs.mkdirSync(path.join(root, 'static/js'), { recursive: true });
  fs.mkdirSync(path.join(root, 'static/media'));
  const source = {
    'index.html': { isEntry: true, file: 'static/js/main.123.js', imports: ['vendor'], dynamicImports: ['deferred'] },
    vendor: { file: 'static/js/vendor.123.js', imports: ['shared'] },
    shared: { file: 'static/js/shared.123.js' },
    deferred: { file: 'static/js/deferred.123.js' },
  };
  fs.writeFileSync(path.join(root, '.vite/manifest.json'), JSON.stringify(source));
  for (const chunk of Object.values(source)) fs.writeFileSync(path.join(root, chunk.file), chunk.file);
  fs.writeFileSync(path.join(root, 'static/media/logo.png'), 'logo');
  const manifest = writeBuildManifest(root);
  assert.equal(manifest.files['main.js'], '/static/js/main.123.js');
  assert.equal(manifest.files['static/media/logo.png'], '/static/media/logo.png');
  assert.deepEqual(manifest.entrypoints, ['static/js/main.123.js', 'static/js/vendor.123.js', 'static/js/shared.123.js']);
  assert.equal(initialJavaScript(root).gzipBytes, manifest.entrypoints.reduce((bytes, file) => bytes + gzipSync(Buffer.from(file)).length, 0));
});

test('production manifest lists existing assets and HTML loads the entry', () => {
  const manifest = JSON.parse(fs.readFileSync('build/asset-manifest.json'));
  const html = fs.readFileSync('build/index.html', 'utf8');
  for (const file of Object.values(manifest.files)) assert.ok(fs.existsSync(path.join('build', file)), file);
  assert.ok(html.includes(manifest.files['main.js']));
  assert.ok(!html.includes('/src/main.jsx'));
  assert.ok(initialJavaScript('build').gzipBytes > 0);
});
