const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const {
  config,
  validateConfig,
  validateSigning,
  validateManifest,
  assetLinks,
} = require('./android-play.cjs');
test('Play identity stays separate from Preview; versions must be valid', () => {
  const c = config();
  for (const patch of [
    { packageId: c.packageId + '.preview' },
    { host: 'example.com' },
    { startUrl: '//example.com' },
    { name: 'World Radio Preview' },
    { appVersionCode: 0 },
    { appVersionCode: 1.5 },
    { appVersionName: '1-preview' },
    { enableNotifications: true },
  ])
    assert.throws(() => validateConfig({ ...c, ...patch }));
});
test('unsigned preparation requires no signing secrets; signed builds fail closed', () => {
  assert.equal(validateSigning({}, false), null);
  assert.throws(() => validateSigning({}, true), /four/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wra-signing-'));
  try {
    const key = path.join(dir, 'upload.jks');
    fs.writeFileSync(key, 'test fixture');
    const env = {
      WORLD_RADIO_KEYSTORE: key,
      WORLD_RADIO_KEY_ALIAS: 'upload',
      WORLD_RADIO_STORE_PASSWORD: 'fixture',
      WORLD_RADIO_KEY_PASSWORD: 'fixture',
    };
    assert.equal(validateSigning(env, true), key);
    for (const field of Object.keys(env))
      assert.throws(() => validateSigning({ ...env, [field]: '' }, true));
    assert.throws(
      () => validateSigning({ ...env, WORLD_RADIO_KEY_ALIAS: 'androiddebugkey' }, true),
      /debug/,
    );
    assert.throws(
      () => validateSigning({ ...env, WORLD_RADIO_KEYSTORE: 'relative.jks' }, true),
      /absolute/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('actual bundle manifest must be a non-debug release with exact SDK, launcher and permissions', () => {
  const c = config();
  const xml = `<manifest package="${c.packageId}" android:versionCode="${c.appVersionCode}" android:versionName="${c.appVersionName}"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="36"/><application android:debuggable="false"><activity android:name="io.github.silentmaster86.worldradioapp.LauncherActivity"/></application></manifest>`;
  assert.deepEqual(validateManifest(xml, c), []);
  for (const replacement of [
    ['debuggable="false"', 'debuggable="true"'],
    ['targetSdkVersion="36"', 'targetSdkVersion="35"'],
    [c.packageId + '"', c.packageId + '.preview"'],
    ['LauncherActivity', 'MissingActivity'],
    [
      '<application',
      '<uses-permission android:name="android.permission.RECORD_AUDIO"/><application',
    ],
  ])
    assert.throws(() => validateManifest(xml.replace(...replacement), c));
});
test('production asset links require complete public certificates and support rotation without preview delegation', () => {
  assert.throws(() => assetLinks([]));
  assert.throws(() => assetLinks(['AA:BB']));
  const target = assetLinks(['ab'.repeat(32), 'AB:'.repeat(31) + 'AB', 'cd'.repeat(32)])[0].target;
  assert.equal(target.package_name, config().packageId);
  assert.equal(target.sha256_cert_fingerprints.length, 2);
  assert.equal(target.namespace, 'android_app');
});
