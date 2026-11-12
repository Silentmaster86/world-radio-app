// Build a disposable Android test package. Production signing is a separate step.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'),
  android = path.join(root, 'android');
const local = path.join(android, '.local'),
  artifacts = path.join(android, 'artifacts');
const productionOrigin = 'https://worldradioapp.netlify.app';
function normalizeFingerprint(value) {
  const hex = String(value).replace(/:/g, '').toUpperCase();
  if (!/^[A-F0-9]{64}$/.test(hex))
    throw Error('Expected a SHA-256 certificate fingerprint (32 bytes).');
  return hex.match(/.{2}/g).join(':');
}
function validateConfig(config) {
  if (
    config.packageId !== 'io.github.silentmaster86.worldradioapp.preview' ||
    config.host !== 'worldradioapp.netlify.app' ||
    config.startUrl !== '/' ||
    config.fallbackType !== 'customtabs' ||
    config.minSdkVersion !== 24 ||
    config.enableNotifications !== false ||
    config.orientation !== 'any'
  )
    throw Error('Preview identity/origin/fallback changed. Review the Android configuration.');
  return config;
}
function assetLinks(config, fingerprint) {
  validateConfig(config);
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: config.packageId,
        sha256_cert_fingerprints: [normalizeFingerprint(fingerprint)],
      },
    },
  ];
}
function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: android,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw Error(
      `${path.basename(command)} failed (${result.status}).\n${result.stderr || result.stdout || ''}`,
    );
  return result.stdout || '';
}
function executable(javaHome, name) {
  return javaHome
    ? path.join(javaHome, 'bin', name + (process.platform === 'win32' ? '.exe' : ''))
    : name;
}
function build() {
  const config = validateConfig(
    JSON.parse(fs.readFileSync(path.join(android, 'twa-manifest.json'))),
  );
  const javaHome = process.env.JAVA_HOME,
    sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!javaHome || !fs.existsSync(executable(javaHome, 'javac')))
    throw Error('Set JAVA_HOME to a full JDK 21 (including javac).');
  if (!sdk)
    throw Error('Set ANDROID_HOME to an Android SDK with platform 36 and build-tools 36.0.0.');
  fs.mkdirSync(local, { recursive: true });
  fs.mkdirSync(artifacts, { recursive: true });
  const env = {
    ...process.env,
    ANDROID_USER_HOME: process.env.ANDROID_USER_HOME || path.join(local, 'android-user'),
  };
  fs.mkdirSync(env.ANDROID_USER_HOME, { recursive: true });
  const key = path.join(local, 'preview.keystore');
  if (!fs.existsSync(key))
    run(
      executable(javaHome, 'keytool'),
      [
        '-genkeypair',
        '-keystore',
        key,
        '-storepass',
        'android',
        '-keypass',
        'android',
        '-alias',
        'preview',
        '-keyalg',
        'RSA',
        '-keysize',
        '2048',
        '-sigalg',
        'SHA256withRSA',
        '-validity',
        '3650',
        '-dname',
        'CN=World Radio Preview, OU=Testing, O=World Radio App, C=GB',
      ],
      { env },
    );
  const tasks = [
    '--no-daemon',
    '--console=plain',
    ':app:assembleDebug',
    ':app:lintDebug',
    ':app:bundleRelease',
  ];
  if (process.platform === 'win32')
    run('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat ' + tasks.join(' ')], { env, stdio: 'inherit' });
  else run(path.join(android, 'gradlew'), tasks, { env, stdio: 'inherit' });
  const apk = path.join(artifacts, 'WorldRadioPreview.apk'),
    bundle = path.join(artifacts, 'WorldRadioPreview-unsigned.aab');
  fs.copyFileSync(path.join(android, 'app/build/outputs/apk/debug/app-debug.apk'), apk);
  fs.copyFileSync(path.join(android, 'app/build/outputs/bundle/release/app-release.aab'), bundle);
  const tools = path.join(sdk, 'build-tools/36.0.0');
  const aapt = path.join(tools, 'aapt' + (process.platform === 'win32' ? '.exe' : ''));
  const badging = run(aapt, ['dump', 'badging', apk], { env });
  const appId = badging.match(/^package: name='([^']+)'/m)?.[1];
  const target = Number(badging.match(/^targetSdkVersion:'(\d+)'/m)?.[1]);
  const minimum = Number(badging.match(/^sdkVersion:'(\d+)'/m)?.[1]);
  if (
    appId !== config.packageId ||
    target !== 36 ||
    minimum !== 24 ||
    !badging.includes('application-debuggable')
  )
    throw Error('Built APK does not match the expected test identity/SDK/debug flags.');
  const resources = run(aapt, ['dump', '--values', 'resources', apk], { env });
  if (!resources.includes(productionOrigin))
    throw Error('The built APK does not contain the expected web origin.');
  const permissions = [...badging.matchAll(/^uses-permission: name='([^']+)'/gm)].map((m) => m[1]);
  if (permissions.some((p) => /AD_ID|BILLING|LOCATION|RECORD_AUDIO|READ_CONTACTS/.test(p)))
    throw Error('Unexpected sensitive permission in test APK: ' + permissions.join(', '));
  const cert = run(
    executable(javaHome, 'java'),
    ['-jar', path.join(tools, 'lib/apksigner.jar'), 'verify', '--print-certs', apk],
    { env },
  );
  const fingerprint = normalizeFingerprint(
    cert.match(/certificate SHA-256 digest: ([a-fA-F0-9]+)/)?.[1] || '',
  );
  const files = [apk, bundle].map((file) => ({
    name: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  }));
  const info = {
    testOnly: true,
    appId,
    version: config.appVersionName,
    targetSdk: target,
    minSdk: minimum,
    origin: productionOrigin,
    certificateSHA256: fingerprint,
    permissions,
    files,
    domainVerification:
      'Pending: the website must list this package and certificate before browser UI can be hidden.',
    physicalDeviceTested: false,
  };
  fs.writeFileSync(path.join(artifacts, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');
  fs.writeFileSync(
    path.join(artifacts, 'assetlinks-preview.json'),
    JSON.stringify(assetLinks(config, fingerprint), null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(artifacts, 'SHA256SUMS'),
    files.map((f) => `${f.sha256}  ${f.name}`).join('\n') + '\n',
  );
  console.log('ANDROID_PREVIEW_RESULT ' + JSON.stringify(info));
}
function main(args) {
  if (args[0] === 'build') return build();
  if (args[0] === 'assetlinks' && args.length === 2) {
    const c = JSON.parse(fs.readFileSync(path.join(android, 'twa-manifest.json')));
    console.log(JSON.stringify(assetLinks(c, args[1]), null, 2));
    return;
  }
  throw Error('Use: node scripts/android-preview.cjs build | assetlinks SHA256_FINGERPRINT');
}
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
module.exports = { normalizeFingerprint, validateConfig, assetLinks };
