const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const { normalizeFingerprint, validateConfig, assetLinks } = require('./android-preview.cjs');
const config = JSON.parse(fs.readFileSync('android/twa-manifest.json'));
test('normalizes a real-length SHA-256 fingerprint without changing its bytes', () => {
  const hex = 'ab'.repeat(32);
  assert.equal(normalizeFingerprint(hex), 'AB:'.repeat(31) + 'AB');
  assert.equal(normalizeFingerprint('AB:'.repeat(31) + 'AB'), normalizeFingerprint(hex));
});
test('rejects placeholders, shortened fingerprints and injected content', () => {
  for (const value of [
    '',
    undefined,
    'AA:BB',
    'REPLACE_WITH_CERTIFICATE',
    'ab'.repeat(31) + 'zz',
    'ab'.repeat(32) + '\n<script>',
  ])
    assert.throws(() => normalizeFingerprint(value));
});
test('preview config cannot silently become a production identity or an external origin', () => {
  assert.equal(validateConfig(config), config);
  for (const patch of [
    { packageId: 'io.github.silentmaster86.worldradioapp' },
    { host: 'attacker.example' },
    { startUrl: '//attacker.example' },
    { fallbackType: 'webview' },
    { enableNotifications: true },
  ])
    assert.throws(() => validateConfig({ ...config, ...patch }));
});
test('asset links contain exactly the preview package, supplied certificate and URL delegation relation', () => {
  const links = assetLinks(config, '01'.repeat(32));
  assert.deepEqual(links, [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: config.packageId,
        sha256_cert_fingerprints: ['01:'.repeat(31) + '01'],
      },
    },
  ]);
});
