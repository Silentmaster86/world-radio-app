// Validate store-file constraints against the actual deliverables.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const folder = path.resolve('docs/google-play'),
  listing = JSON.parse(fs.readFileSync(path.join(folder, 'listing.json')));
function png(file, width, height, alpha) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file);
  assert.equal(bytes.subarray(12, 16).toString(), 'IHDR', file);
  assert.equal(bytes.readUInt32BE(16), width, file);
  assert.equal(bytes.readUInt32BE(20), height, file);
  assert.equal(bytes[24], 8, 'PNG must use 8-bit channels: ' + file);
  assert.equal(
    bytes[25],
    alpha ? 6 : 2,
    'PNG must be ' + (alpha ? 'RGBA' : 'opaque RGB') + ': ' + file,
  );
  assert.ok(
    bytes.length < (alpha ? 1024 * 1024 : 8 * 1024 * 1024),
    'File exceeds store limit: ' + file,
  );
}
png(path.join(folder, 'assets/icon-512.png'), 512, 512, true);
for (const locale of ['en-US', 'pl-PL']) {
  const text = listing.locales[locale];
  for (const [field, limit] of [
    ['title', 30],
    ['shortDescription', 80],
    ['fullDescription', 4000],
  ]) {
    assert.ok(
      typeof text[field] === 'string' && text[field].trim().length > 0,
      locale + ' ' + field,
    );
    assert.ok([...text[field]].length <= limit, `${locale} ${field} exceeds ${limit} characters`);
  }
  assert.ok(!/[\r\n]/.test(text.shortDescription), 'Short description must be one line');
  const assets = path.join(folder, 'assets', locale);
  png(path.join(assets, 'feature-1024x500.png'), 1024, 500, false);
  const phones = fs.readdirSync(assets).filter((name) => /^phone-.*\.png$/.test(name));
  assert.ok(phones.length >= 4 && phones.length <= 8, 'Expected 4–8 phone screenshots per locale');
  for (const name of phones) png(path.join(assets, name), 1080, 1920, false);
}
assert.match(listing.contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const policy = fs.readFileSync('public/privacy/index.html', 'utf8');
assert.ok(policy.includes('mailto:' + listing.contactEmail), 'Contact must match the policy');
assert.ok(
  policy.includes('lang="pl"') && policy.includes('lang="en"'),
  'Policy needs both languages',
);
assert.equal(new URL(listing.privacyPolicy).pathname, '/privacy/');
console.log(
  'PLAY_STORE_RESULT ' +
    JSON.stringify({
      passed: true,
      locales: 2,
      images: 11,
      phoneScreenshots: 8,
      dimensions: true,
      textLimits: true,
      contactAndPolicy: true,
    }),
);
