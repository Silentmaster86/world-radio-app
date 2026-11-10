const fs = require('node:fs');
const path = require('node:path');

function writeBuildManifest(root) {
  const vite = JSON.parse(fs.readFileSync(path.join(root, '.vite/manifest.json')));
  const entry = vite['index.html'];
  if (!entry?.isEntry) throw new Error('Vite manifest is missing the HTML entry.');
  const entrypoints = new Set();
  const visited = new Set();
  function visit(key) {
    if (visited.has(key)) return;
    visited.add(key);
    const chunk = vite[key];
    if (!chunk) throw new Error(`Missing imported chunk: ${key}`);
    entrypoints.add(chunk.file);
    for (const css of chunk.css || []) entrypoints.add(css);
    for (const imported of chunk.imports || []) visit(imported);
  }
  visit('index.html');
  const files = { 'main.js': `/${entry.file}`, 'index.html': '/index.html' };
  function collect(directory) {
    for (const item of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      const relative = `${directory}/${item.name}`;
      if (item.isDirectory()) collect(relative);
      else files[relative] = `/${relative}`;
    }
  }
  collect('static');
  // HLS is downloaded on first HLS playback, not by startup/SW precaching.
  const optionalFiles = new Set();
  function optional(key) {
    const chunk = vite[key];
    if (!chunk || entrypoints.has(chunk.file) || optionalFiles.has('/' + chunk.file)) return;
    optionalFiles.add('/' + chunk.file);
    for (const child of chunk.imports || []) optional(child);
  }
  for (const key of Object.keys(vite)) if (key.endsWith('/hlsPlayback.js')) optional(key);
  const manifest = { files, entrypoints: [...entrypoints], optionalFiles: [...optionalFiles] };
  fs.writeFileSync(
    path.join(root, 'asset-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  return manifest;
}

if (require.main === module) writeBuildManifest(path.resolve('build'));
module.exports = { writeBuildManifest };
