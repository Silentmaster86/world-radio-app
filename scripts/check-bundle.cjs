const assert = require('node:assert/strict');
const { initialJavaScript } = require('./build-assets.cjs');
const bytes = initialJavaScript('build').gzipBytes;
const limit = 100 * 1024;
assert.ok(
  bytes <= limit,
  `Initial JavaScript is ${bytes} gzip bytes, above the ${limit}-byte budget. Review new dependencies or split deferred features.`,
);
console.log(`Initial JavaScript budget passed: ${bytes} / ${limit} gzip bytes.`);
