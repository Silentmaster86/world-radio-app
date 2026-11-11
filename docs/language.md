# Interface languages

World Radio App supports English (`en`), Polish (`pl`), German (`de`), Spanish
(`es`), French (`fr`), Portuguese (`pt`), Italian (`it`) and Ukrainian (`uk`).
This is the first additional-language batch. English remains the default; choose
a language by its native name under **Settings → Language**. Portuguese uses
Brazilian wording. There is no paid/runtime translation API.

## Loading and persistence

- The preference remains `wra:language:v1` with `{ "version": 1, "language": "de" }`.
  Existing English/Polish settings still work. Invalid values fall back to English;
  future-version records remain untouched. Blocked storage limits changes to the
  current session, with a visible notice.
- English and Polish remain immediately available. The six extra dictionaries
  load as separate Vite chunks. They are included in the versioned offline shell;
  after offline setup completes, all eight languages can be selected offline,
  including languages never previously opened. The initial JS budget stays at
  128,000 gzip bytes and counts all startup chunks.
- The current language and player remain mounted while a dictionary loads.
  The selector shows the pending choice and a status message. The latest choice
  wins if requests finish out of order; selecting an already loaded language
  cancels a pending choice. Failures keep the previous interface and saved
  preference, with a retry/reopen instruction. On startup, English is available
  while a saved extra language is loaded; it then updates without remounting.
- Successful selections update `<html lang>`, UI labels, accessibility names,
  curated descriptions, player/PWA/storage messages, backup and library/share
  screens. Cross-tab storage events use the same guarded loading path.
- The station, source, volume, Sleep Timer, favorites/history and URL/filter state
  do not reset on a language change. Station names, stream addresses and IDs stay
  as broadcaster data. Search matches original metadata and localized curated
  genres/descriptions. `Intl.DisplayNames` supplies other country/language names
  locally where available; English or caller fallbacks cover older browsers.
- Backup settings import accepts every supported language. If an imported language
  is not loaded, it is loaded before any import write. A failure imports nothing;
  the user can reconnect or import without settings. Cancel/new-file selection
  invalidates pending import work. Confirmation uses the latest library/player
  state after loading. Optional settings import still preserves the selected
  station, shared Audio and Sleep Timer.

## Text and platform limits

Each extra catalog covers all English interface, backup and library messages,
including error and accessibility text. Placeholder parity and missing/extra
keys are checked automatically. Count labels use number-neutral wording where
needed rather than applying English singular/plural rules to other languages.
No external translation provider has reviewed these authored translations;
native-speaker terminology review is welcome before broader distribution.

This translates the application interface, not live radio or song metadata.
The manifest name/description, emergency static error page, browser installation
menus, file picker and native share dialogs may use English or the browser/OS
language. External station names, genres and descriptions remain directory data;
only curated descriptive copy is translated. RTL languages and Asian-language
catalogs remain a later batch requiring their own typography/layout checks.

## Source and validation

- Registry, native names, loader/cache and fallback helper: `src/i18n/index.js`.
- Existing catalogs: `src/i18n/en.js`, `pl.js`; extra catalogs:
  `src/i18n/locales/{de,es,fr,pt,it,uk}.js`. Each extra file includes `backup.*`
  and `manage.*` keys as well as the shared interface messages.
- `LanguageContext.jsx` owns atomic selection/persistence. New keys must be added
  to both base catalogs and all six extra catalogs (including corresponding
  prefixed keys for backup/library). Keep placeholders exactly as in English.
- Unit tests cover completeness/parameters, races, load failures, cross-tab
  events, future schemas, cancellation and import preflight failures.
- `scripts/check-languages.cjs` covers eight languages × light/dark × 320/390/1440
  (48 cases), keyboard/contrast checks via axe, first-station visibility, touch
  targets, full-player controls, backup export and library labels, persistence,
  offline switching to every language, real MP3 decoding and one shared Audio
  with an active Sleep Timer. Blocked-chunk cases verify safe language/import
  failure. The separate `languages-browser` CI job runs it against the build and
  exact-head Netlify preview. Screenshots are retained in its CI artifact.
- Existing UX, motion, discovery, HLS, backup, library and PWA checks remain in CI.
  Run `npm run check` before delivery; physical-phone review remains manual.
