// Prepare a release candidate; this script never creates keys or uploads to Play.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { normalizeFingerprint, run, executable } = require('./android-preview.cjs');
const root = path.resolve(__dirname, '..'),
  android = path.join(root, 'android');
const bundletoolSHA256 = 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29';
const signingNames = [
  'WORLD_RADIO_KEYSTORE',
  'WORLD_RADIO_KEY_ALIAS',
  'WORLD_RADIO_STORE_PASSWORD',
  'WORLD_RADIO_KEY_PASSWORD',
];
function config() {
  return validateConfig({
    ...JSON.parse(fs.readFileSync(path.join(android, 'twa-manifest.json'))),
    ...JSON.parse(fs.readFileSync(path.join(android, 'play-config.json'))),
  });
}
function validateConfig(c) {
  if (
    c.packageId !== 'io.github.silentmaster86.worldradioapp' ||
    c.host !== 'worldradioapp.netlify.app' ||
    c.startUrl !== '/' ||
    c.name !== 'World Radio App' ||
    c.launcherName !== 'World Radio App' ||
    c.fallbackType !== 'customtabs' ||
    c.enableNotifications !== false ||
    c.minSdkVersion !== 24 ||
    !Number.isSafeInteger(c.appVersionCode) ||
    c.appVersionCode < 1 ||
    !/^\d+\.\d+\.\d+$/.test(c.appVersionName)
  )
    throw Error('Invalid Play identity, version or web origin.');
  return c;
}
function validateSigning(env, signed) {
  if (!signed) return null;
  if (signingNames.some((name) => !env[name]))
    throw Error(
      'Signed build needs all four WORLD_RADIO signing variables. No key is generated automatically.',
    );
  if (!path.isAbsolute(env.WORLD_RADIO_KEYSTORE) || !fs.existsSync(env.WORLD_RADIO_KEYSTORE))
    throw Error('WORLD_RADIO_KEYSTORE must be an existing absolute path.');
  if (
    /preview\.keystore$|debug\.keystore$/i.test(env.WORLD_RADIO_KEYSTORE) ||
    /^(preview|androiddebugkey)$/i.test(env.WORLD_RADIO_KEY_ALIAS)
  )
    throw Error('Preview/debug signing cannot be used for a Play upload.');
  return env.WORLD_RADIO_KEYSTORE;
}
function assetLinks(fingerprints) {
  if (!fingerprints.length)
    throw Error('Supply the Play APP SIGNING certificate SHA-256 fingerprint.');
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: config().packageId,
        sha256_cert_fingerprints: [...new Set(fingerprints.map(normalizeFingerprint))],
      },
    },
  ];
}
function validateManifest(xml, c) {
  if (
    !xml.includes(`package="${c.packageId}"`) ||
    !xml.includes(`android:versionCode="${c.appVersionCode}"`) ||
    !xml.includes(`android:versionName="${c.appVersionName}"`) ||
    !xml.includes('android:minSdkVersion="24"') ||
    !xml.includes('android:targetSdkVersion="36"') ||
    /android:(debuggable|testOnly)="true"/.test(xml) ||
    !xml.includes('android:name="io.github.silentmaster86.worldradioapp.LauncherActivity"')
  )
    throw Error(
      'Bundle manifest does not match the non-debug Play release identity/SDK/version/launcher.',
    );
  const permissions = [...xml.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"/g)].map(
    (m) => m[1],
  );
  const allowed = new Set([
    `${c.packageId}.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`,
    'android.permission.INTERNET',
  ]);
  if (permissions.some((p) => !allowed.has(p)))
    throw Error('Unexpected release permission: ' + permissions.join(', '));
  return permissions;
}
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function build(signed) {
  const c = config(),
    javaHome = process.env.JAVA_HOME,
    sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!javaHome || !fs.existsSync(executable(javaHome, 'javac')) || !sdk)
    throw Error('Set JAVA_HOME to JDK 21 and ANDROID_HOME to SDK 36 / Build-Tools 36.0.0.');
  const env = {
    ...process.env,
    ANDROID_USER_HOME: process.env.ANDROID_USER_HOME || path.join(android, '.local/android-user'),
  };
  const key = validateSigning(env, signed);
  if (!signed) for (const name of signingNames) delete env[name];
  const bundletool = env.WORLD_RADIO_BUNDLETOOL_JAR;
  if (!bundletool || !fs.existsSync(bundletool) || sha256(bundletool) !== bundletoolSHA256)
    throw Error(
      'Set WORLD_RADIO_BUNDLETOOL_JAR to the checksum-verified bundletool-all-1.18.3.jar. See android/PLAY.md.',
    );
  fs.mkdirSync(env.ANDROID_USER_HOME, { recursive: true });
  const keytool = executable(javaHome, 'keytool');
  const locale = ['-J-Duser.language=en', '-J-Duser.country=US'];
  let expectedCertificate;
  if (signed) {
    const info = run(
      keytool,
      [
        ...locale,
        '-list',
        '-v',
        '-keystore',
        key,
        '-alias',
        env.WORLD_RADIO_KEY_ALIAS,
        '-storepass:env',
        'WORLD_RADIO_STORE_PASSWORD',
      ],
      { env },
    );
    if (/CN=(?:Android Debug|World Radio Preview)\b/i.test(info))
      throw Error('A preview/debug certificate cannot sign a Play upload.');
    expectedCertificate = normalizeFingerprint(info.match(/SHA256:\s*([A-Fa-f0-9:]+)/)?.[1] || '');
  }
  const tasks = [
    '--no-daemon',
    '--console=plain',
    '-PworldRadioTarget=play',
    `-PworldRadioSigned=${signed}`,
    ':app:assembleRelease',
    ':app:lintRelease',
    ':app:bundleRelease',
  ];
  if (process.platform === 'win32')
    run('cmd.exe', ['/d', '/s', '/c', 'gradlew.bat ' + tasks.join(' ')], { env, stdio: 'inherit' });
  else run(path.join(android, 'gradlew'), tasks, { env, stdio: 'inherit' });
  const output = path.join(android, 'artifacts/play', signed ? 'signed' : 'unsigned');
  fs.mkdirSync(output, { recursive: true });
  const bundle = path.join(
    output,
    signed ? 'WorldRadioApp-upload.aab' : 'WorldRadioApp-unsigned.aab',
  );
  fs.copyFileSync(path.join(android, 'app/build/outputs/bundle/release/app-release.aab'), bundle);
  const java = executable(javaHome, 'java');
  run(java, ['-jar', bundletool, 'validate', `--bundle=${bundle}`], { env });
  const manifest = run(
    java,
    ['-jar', bundletool, 'dump', 'manifest', `--bundle=${bundle}`, '--module=base'],
    { env },
  );
  const permissions = validateManifest(manifest, c);
  const apk = path.join(
    android,
    'app/build/outputs/apk/release',
    signed ? 'app-release.apk' : 'app-release-unsigned.apk',
  );
  const aapt = path.join(
    sdk,
    'build-tools/36.0.0',
    'aapt' + (process.platform === 'win32' ? '.exe' : ''),
  );
  const badging = run(aapt, ['dump', 'badging', apk], { env });
  const resources = run(aapt, ['dump', '--values', 'resources', apk], { env });
  if (
    !badging.includes(`package: name='${c.packageId}'`) ||
    !badging.includes("application-label:'World Radio App'") ||
    badging.includes('application-debuggable') ||
    !resources.includes('https://worldradioapp.netlify.app/')
  )
    throw Error('Compiled release APK has an unexpected identity, label, debug flag or origin.');
  const entries = run(executable(javaHome, 'jar'), ['tf', bundle], { env });
  const hasSignature = /^META-INF\/[^/]+\.(RSA|DSA|EC)$/im.test(entries);
  if (hasSignature !== signed) throw Error('Unexpected bundle signing state.');
  let uploadCertificateSHA256 = null;
  if (signed) {
    const verification = run(executable(javaHome, 'jarsigner'), [...locale, '-verify', bundle], {
      env,
    });
    if (!/jar verified\./i.test(verification)) throw Error('Bundle JAR signature did not verify.');
    const cert = run(keytool, [...locale, '-printcert', '-jarfile', bundle], { env });
    uploadCertificateSHA256 = normalizeFingerprint(
      cert.match(/SHA256:\s*([A-Fa-f0-9:]+)/)?.[1] || '',
    );
    if (uploadCertificateSHA256 !== expectedCertificate)
      throw Error('Bundle signature does not match the configured upload certificate.');
  }
  const info = {
    appId: c.packageId,
    version: c.appVersionName,
    versionCode: c.appVersionCode,
    targetSdk: 36,
    minSdk: 24,
    debuggable: false,
    signed,
    uploadCertificateSHA256,
    file: path.basename(bundle),
    bytes: fs.statSync(bundle).size,
    sha256: sha256(bundle),
    permissions,
    playUploadValidated: false,
    domainVerified: false,
    physicalDeviceTested: false,
    next: signed
      ? 'Validate in Play internal testing. Configure domain with the Play APP SIGNING certificate, not just this upload certificate.'
      : 'Unsigned preflight only. Supply the owner-controlled upload key for a signed build.',
  };
  fs.writeFileSync(path.join(output, 'build-info.json'), JSON.stringify(info, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'SHA256SUMS'), `${info.sha256}  ${info.file}\n`);
  console.log('ANDROID_PLAY_RESULT ' + JSON.stringify(info));
}
function main(args) {
  if (args[0] === 'build' && (args.length === 1 || (args.length === 2 && args[1] === '--signed')))
    return build(args[1] === '--signed');
  if (args[0] === 'assetlinks')
    return console.log(JSON.stringify(assetLinks(args.slice(1)), null, 2));
  throw Error(
    'Use: android-play.cjs build [--signed] | assetlinks APP_SIGNING_SHA256 [SECOND_SHA256]',
  );
}
if (require.main === module)
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
module.exports = {
  config,
  validateConfig,
  validateSigning,
  validateManifest,
  assetLinks,
  bundletoolSHA256,
};
