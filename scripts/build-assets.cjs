const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');

// Shared by the budget check and Lighthouse; include every initial JS chunk.
function initialJavaScript(build) {
  const manifest = JSON.parse(fs.readFileSync(path.join(build, 'asset-manifest.json')));
  const entries = [...new Set(manifest.entrypoints.filter((file) => file.endsWith('.js')))];
  if (!entries.length) throw new Error('Build manifest has no initial JavaScript.');
  return entries.reduce(
    (total, file) => {
      const contents = fs.readFileSync(path.join(build, file));
      return {
        bytes: total.bytes + contents.length,
        gzipBytes: total.gzipBytes + gzipSync(contents).length,
      };
    },
    { bytes: 0, gzipBytes: 0 },
  );
}

module.exports = { initialJavaScript };
