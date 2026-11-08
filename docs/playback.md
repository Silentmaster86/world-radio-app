# Shared playback

`src/lib/audioPlayer.js` owns one audio element and all playback operations.
`AudioProvider` creates it in an effect above the routes, subscribes to its state,
and disposes it together with system/network listeners. React rerenders do not
create new elements. StrictMode's development setup/cleanup cycle releases the
first instance before creating the next one.

## State and actions

- `selectedStationId` is the latest user choice; it changes before network work.
- `playingStationId` identifies the confirmed source. Only `status === 'playing'`
  means the browser has playable data and is actually playing.
- `wantsToPlay` tracks intent through connecting/buffering. Pause clears it, so
  retries and online events cannot resume a user-paused station.
- Status values are `idle`, `connecting`, `playing`, `buffering`, `paused`, `error`.
- Every start has a generation. Replaced requests and their late results cannot
  overwrite a later selection. Re-selecting the current active station does not
  restart its stream.
- Ordinary app pause, sleep-timer expiry and disposal release the live source
  and pending work. A pause initiated by Android/system media controls retains
  an already confirmed, paused audio resource so the system may keep a resumable
  notification. This is a platform-dependent experiment, not a promise of a
  persistent lock-screen card. Paused live media may retain network resources
  until resumed, switched, or closed. Resume reconnects to the live stream;
  it does not promise time-shifted listening at the paused position.

## Recovery

The connection/buffering deadline is 15 seconds. Recoverable failures use at most
three automatic retries with delays of 1, 2 and 4 seconds during a requested
playback session. Stations may optionally provide a small set of broadcaster-sourced
`fallbackUrls`. After a recoverable failure, the next configured endpoint is tried
using the **same** audio element and the existing total retry budget. The status
indicates backup playback without exposing a server URL. A manual play/retry or
a different selection starts again from the primary endpoint and resets the budget.
Autoplay and codec errors remain terminal, and Pause, sleep timer expiry,
station changes and disposal cancel queued fallback attempts. A 200 response
alone does not establish identity or device playback support.
Blocked autoplay, unsupported formats and decoding failures need user action.
Offline waits preserve intent; explicit pause and disposal cancel that wait.
Stalled events with enough buffered data do not incorrectly stop playback.

`PlayerStatus` explains these states and provides a manual retry. Transport
controls offer cancellation during connection, and station cards distinguish
selection from playback. Station selection and favorites are separate native
buttons with accessible names and focus.

## System controls and preferences

`src/lib/mediaSession.js` sends the same player actions to Media Session. It
updates first-play metadata and confirmed playback state, tolerates unsupported
actions and removes handlers on cleanup. Artwork sizes are omitted when unknown;
MIME type follows the actual file extension.

`wra:player:v1` stores `{ version: 1, stationId, volume, muted }`. Startup restores
settings without setting a stream URL or calling play. Invalid data and blocked
storage keep the player usable. A newer stored schema is preserved. On devices
that ignore volume writes, the UI directs the user to device volume controls.

## Verification

The foundation and playback stages are merged. Current PRs target `main` for
Netlify previews; see [tooling.md](tooling.md) for the delivery checks.

Run `npm run check`. Regression tests use a controllable audio element for controlled
event ordering, deferred play promises, retry timers, offline/online, cancellation,
Media Session, preferences, StrictMode and full-app integration. No live station
or extra dependency is needed for these deterministic checks.

On the Netlify preview, also check actual playback, switching/pause while a source
is connecting, offline/online recovery, volume/mute, direct car-view navigation,
station selection with Tab/Enter/Space, and media keys on a physical device.
Unit/DOM checks do not certify native codecs, lock-screen integration or iOS
volume behavior.

The persistent mini player, combined filters, themes, car layout, PWA updates and
Vite migration are implemented. The [sleep timer](sleep-timer.md) pauses this same
controller. See [roadmap.md](roadmap.md) for remaining product work.
