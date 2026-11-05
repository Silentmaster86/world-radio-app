# Installing and using World Radio App offline

In Chrome/Edge, the Install app control uses the browser's native prompt when
available. Otherwise it opens keyboard-accessible instructions. iPhone/iPad users
get Safari Share → Add to Home Screen; Mac Safari users get File → Add to Dock.
Browser menus and installation availability vary. Installed/standalone windows
hide the install action. Accepting a prompt alone is not treated as completion;
`appinstalled` or standalone display mode confirms it.

The manifest has a stable root ID, scope and start URL, 192/512 px icons, a
separate opaque maskable icon and unrestricted orientation for car mode. Existing
brand artwork remains the source. Regenerate the maskable PNG with
`python scripts/generate-pwa-icons.py` (Pillow 12.3.0); normal builds need only Node.

## Offline behavior

After one successful online setup, the catalog, logos, favorites and player view
can open without a connection, including direct `/now-playing` navigation.
Favorites and preferences still use the existing validated localStorage formats.
Live radio always needs an internet connection. No stream is downloaded for
later listening, and reopening or reconnecting does not create playback intent.

`npm run build` generates `build/service-worker.js` after CRA builds the app.
The generator hashes the worker source and release assets to produce a stable
release cache name. It includes hashed assets, the HTML shell, manifest, offline
fallback and required icons. Generated build files remain ignored by Git.

The worker:

- Validates response status and MIME type before completing installation. A SPA
  fallback returned as JavaScript cannot become a successful offline install.
- Uses only an explicit build-time asset list. POST, external URLs, media and
  range requests bypass it; arbitrary URLs/query strings do not grow the cache.
- Reuses HTTP-cached hashed assets and revalidates unversioned shell files.
- Serves an installed release's HTML and assets together for the two app routes.
  Other navigation uses the network with an informational offline fallback.
- Cleans only old `wra-shell-*` caches and the known `radio-cache-v1` legacy cache
  on activation. Unrelated caches and localStorage are never cleared.
- Reports offline readiness through a MessageChannel after checking its cache.
  Failed installation/storage does not disable online listening.

Browser storage can be blocked or evicted. The app does not promise permanent
local storage or offline access before setup finishes.

## Updates during playback

There is deliberately no `skipWaiting`, `clients.claim` or automatic reload.
A prepared release waits for the native worker lifecycle. The notice asks users
to finish listening, close app windows and reopen. All controlled windows must
close before activation; an idle tab cannot replace the release under another
controlled tab that is playing. Existing uncontrolled windows are not reloaded.

“Later” dismisses that release notice across player/catalog navigation. A later
release can announce itself again. Cache-first shell navigation keeps a waiting
release from mixing new HTML with old scripts. User settings survive activation,
and the next launch starts paused. A new release does not erase favorites.

`PwaProvider` owns lifecycle listeners and install prompts. It registers after
load when the browser is idle, checks on reconnection, and removes listeners on
unmount without unregistering the installed worker. No notification permission
is requested. Development builds do not register a worker.

## Verification and local development

`npm run check` runs the React tests, worker tests, production build and initial
JavaScript budget. `npm run test:pwa` runs the worker tests directly with Node's
built-in test harness.

The browser CI checks actual installation of the worker, offline favorites and
direct routes, focus/Escape in the install dialog, no autoplay, and preferences.
A local test server simulates another release with two open tabs and a controlled
audio fixture: the new worker waits while one tab is playing, activates after
all controlled tabs close, removes only old owned caches, and preserves data.
The current Netlify preview repeats offline/manifest/header checks. Reports and
screenshots are uploaded as `pwa-browser-results`.

Use a separate origin when testing a production build locally, for example:

```sh
npm run build
npm run serve -- --listen 5000
```

Keep development on port 3000. If an older production worker controls a reused
development origin, unregister that worker in DevTools → Application → Service
Workers and reload; clearing favorites/localStorage is unnecessary.

Physical Add to Home Screen/Add to Dock behavior, OS splash/icon masking, iOS
storage eviction and real media/volume controls still need device review. The
browser fixture verifies update continuity rather than stream/codec availability.
