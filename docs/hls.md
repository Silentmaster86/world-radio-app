# HLS playback

HTTPS HLS directory results can be added alongside MP3/AAC stations. The existing
shared Audio element, station IDs, favorites, confirmed-playback history and
Sleep Timer remain the owners of playback and personal data.

## Playback and delivery

- Prefer the browser's native HLS support (notably Safari).
- Otherwise dynamically import the pinned `hls.js` engine on the first HLS Play.
  The optional engine chunk is excluded from initial JavaScript and PWA precaching.
  The offline shell remains available; live audio always needs a connection.
- Attach MediaSource to the existing Audio element. Report Playing only after
  actual playable audio events, not a successful playlist request.
- App Pause, timer expiration, source changes, retries and disposal destroy the
  engine. A system pause can retain the paused resource for media controls while
  stopping HLS loading. Late module/event callbacks cannot resume old attempts.
- Keep existing bounded retry/error handling. HTTPS playlists and their segments
  must be accessible to the browser; the MSE path requires publisher CORS headers.
  HTTP child playlists are rejected. DRM, authentication and regional restrictions
  are not bypassed. Native HLS remains subject to the browser's own transport rules.

Implementation: `src/lib/audioPlayer.js`, `src/lib/hlsPlayback.js`,
`src/lib/addedStations.js`. Library documentation:
<https://github.com/video-dev/hls.js>.

## Verified BBC Radio 1 directory exceptions

Radio Browser has legacy HTTP records for BBC Radio 1. `verifiedStreams.js`
substitutes HTTPS **only when both UUID and full original URL match** a verified
record. Other insecure directory records remain unavailable. No general HTTP
upgrade, proxy or arbitrary station-name matching is used.

The following publisher-owned media endpoints were checked on 2026-11-10:

- `https://as-hls-ww-live.akamaized.net/pool_01505109/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d128000.norewind.m3u8`
- The same endpoint with `320000` in place of `128000`.

Both returned HTTPS media playlists. A playlist and a current segment were also
requested with `Origin: https://worldradioapp.netlify.app` and returned HTTP 200
and `Access-Control-Allow-Origin: *`. Without Origin that header may be absent.
The legacy `a.files.bbci.co.uk` master, even when requested over HTTPS, contained
an HTTP child URL, so its exact known directory entry maps to the direct HTTPS
128 kbps media playlist instead. Future directory URL changes need revalidation.
These live checks are evidence at a point in time, not a guarantee of publisher
availability or playback in every region/device.

## Regression verification

- Controller tests cover native HLS, lazy loading, source changes, late callbacks,
  pause/disposal and fatal errors; adapter tests cover attachment and cleanup.
- Storage tests preserve HLS format, including extensionless URLs and exact BBC
  exceptions. Build tests keep the engine out of initial assets and precaching.
- `node scripts/check-hls.cjs` decodes an original synthetic MP3 fixture through
  the real production engine and Chromium Audio/MediaSource. It verifies lazy
  loading, a single audio element, pause cleanup, saved stations and no autoplay
  after reload. It does not mock audio events or play(). Run against the build or
  set `WRA_BASE_URL` for the exact-head Netlify preview.
- The fixtures in `scripts/fixtures/` are original 440 Hz sine waves generated
  with `ffmpeg -f lavfi -i 'sine=frequency=440:sample_rate=44100:duration=6'`.
  The MP3 fixture uses codec libmp3lame at 32 kbps with Xing/ID3 disabled;
  AAC in MPEG-TS uses `-c:a aac -b:a 32k -f mpegts`.
  They contain no publisher recording. Browser fixtures are separate from live
  publisher availability and physical iOS/Android background playback review.

The bundled CI Chromium lacks AAC/MP4 SourceBuffer support. For a browser build
with AAC support, run `WRA_HLS_CODEC=aac WRA_BROWSER_EXECUTABLE=/path/to/chromium
node scripts/check-hls.cjs`; the same check verifies real native HLS or MediaSource
playback according to browser capability. AAC support and native Safari/background
behavior must not be inferred from the deterministic MP3 HLS check alone.
