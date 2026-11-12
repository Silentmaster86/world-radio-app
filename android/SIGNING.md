# Domain verification and signing

A verified TWA needs both directions of the relationship:

1. The Android package declares `https://worldradioapp.netlify.app` in its native
   asset statements. This is already present in the wrapper.
2. The website serves `/.well-known/assetlinks.json` containing the Android
   package name and the **SHA-256 fingerprint of its signing certificate**.
   It must return JSON, not the SPA fallback HTML.

The current preview build exports the second direction as
`android/artifacts/assetlinks-preview.json`, but does not publish it. Each clean
CI build has a disposable signing identity. Publishing a different build's
fingerprint will not verify the APK being installed. Preview keys are not a
production signing strategy.

To generate JSON for review from a known certificate fingerprint:

```sh
npm run android:assetlinks -- AA:BB:...:FF
```

Use the complete 32-byte SHA-256 value from `build-info.json`; the abbreviated
example above is deliberately invalid. The command prints JSON and does not
write to `public/`. No placeholder or test certificate is deployed by this PR.

For a future Play release, choose the permanent package name and set up Play App
Signing. Use the **app signing certificate** reported by Play Console for packages
installed from Google Play; the upload certificate alone is not sufficient.
Add the agreed production statement to `public/.well-known/assetlinks.json`,
ensure Netlify serves it as `application/json`, deploy, then verify the package
installed through the intended distribution channel on a real Android device.
Any separate local signing certificate must be handled explicitly.

Keep keystores/passwords outside Git and documentation. Build artifacts contain
public fingerprints and hashes only. Do not send private keys in chat.

References:

- [Trusted Web Activity setup](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- [Signing keys and Digital Asset Links](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs)
- [Current Play target SDK requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
