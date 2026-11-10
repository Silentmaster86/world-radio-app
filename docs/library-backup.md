# Library backup

Open Settings → Library backup to download or import a local JSON file. The
feature needs no account, upload endpoint or external service. Both PL/EN
interfaces and light/dark themes are supported, including the offline app shell.

## Format and behavior

Version 1 identifies itself with `app: "world-radio-app"` and contains:

- `stations`: normalized added directory stations, with stable IDs and optional
  HLS format. Curated stations are supplied by the app, not copied into the file.
- `favoriteIds`: current and temporarily unavailable favorites.
- `recentIds`: at most 20 recent station IDs, in recency order.
- `settings`: interface language, appearance, volume and mute preference.
- `createdAt`: an informational ISO timestamp on export.

The file is validated before showing the preview; it must be no larger than
1 MiB, identify the correct app/version and contain valid settings, stable IDs
and supported HTTPS station URLs. Wrong types, insecure streams and malformed
records reject the whole file rather than importing a partial library. Data is
normalized to known fields; imported properties are not copied into app objects.

Selecting a file or cancelling its preview has no import effects. Confirming
**Import and combine** adds to the existing library. There is deliberately no
replace/delete mode in this stage. Existing station identity and endpoint win
on ID or URL collisions. References to another UUID for the same stream are
mapped to the existing station, including curated stations. Dormant favorite
IDs remain available if their stations return. Repeated imports do not duplicate
stations/favorites. The combined added catalog is limited to 100; overflow is
rejected rather than silently dropping stations. Existing recent history comes
first and the combined list retains the existing 20-station cap.

Importing language, theme and volume is a separate, initially unchecked option.
The selected station, actual audio source and Sleep Timer stay active. Neither
import nor reload starts playback automatically. Last-selected station and timer
deadlines are not copied from another device.

## Persistence and failure handling

The preview and confirmation combine in-memory data with the latest readable
saved library, so another tab's additions before confirmation are preserved.
The import checks the schemas of all keys it will write before any writes.
Future schemas stay untouched; a future appearance/language/player schema blocks
only an import that explicitly includes settings.

Persistence snapshots the affected raw storage values and writes the combined
records before updating React contexts. If a write fails, successful writes are
undone in reverse order, including removal of originally absent keys. Contexts
and playback are not updated after a failed persistence step. If storage becomes
unavailable during rollback too, a distinct message explains that some saved
data could not be restored and recommends downloading the live library before
reloading. localStorage has no multi-key transaction or cross-tab lock; this is
best-effort rollback, not an atomic database transaction. Unrelated storage keys
and unmatched legacy favorites are not removed by the import.

The stations provider extends its existing catalog array rather than replacing
it, preserving the shared audio controller and timer. Favorites/recent providers
adopt the saved merged values. Optional player settings update the current audio
instance. Backup UI, validation and feature translations load outside the initial
JS bundle; its chunk is included in the offline shell. A local error boundary
contains a failed feature/chunk load inside Settings so it does not unmount the
radio or stop playback.

## Verification

- Jest: format/size/schema validation, HLS round trip, URL/ID deduplication,
  dormant favorites, limits, latest saved data, settings opt-in, future schemas,
  storage rollback and failed rollback.
- Provider integration: cancel/preview, late file reads, export current state,
  repeated import, explicit settings changes and one uninterrupted audio source
  with an active Sleep Timer.
- `node scripts/check-backup.cjs`: real browser upload/download round trip,
  decoding an original fixture stream during import, optional settings, reload
  persistence and no autoplay. Covers 320/390/desktop, PL/EN, light/dark,
  accessibility, modal overflow/touch targets and offline import. A fresh browser
  context restores the downloaded file as a second-device scenario.
- Existing UX, discovery, HLS and PWA checks remain part of CI against both the
  built application and its exact-head Netlify preview.
