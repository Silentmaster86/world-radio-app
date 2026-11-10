# Polish and English user interface

World Radio App has an English (`en`) and a Polish (`pl`) interface.
English is the default language for new users. The language selector is in
the home page header, beside Appearance.

## Behavior

- The selected language is stored separately in `wra:language:v1` as
  `{ "version": 1, "language": "pl" }` or `en`. Invalid values fall back
  to English. Future-version records are preserved without overwriting them.
- Switching languages changes visible labels, player and PWA messages,
  accessibility names, country and genre labels, and the browser document's
  `<html lang>` value. The selected station, playback session, volume,
  sleep timer, favorites and recent history do **not** reset.
- Search matches both the original English metadata and translated Polish
  descriptions/genres. Station IDs, stream URLs, persisted station records,
  filter query parameters and URL routes remain language-independent.
- Station names are official broadcaster names and are not translated.
  Broadcaster descriptions in the car view use translated curated copy.
- Missing translations fall back to English. System-controlled dialogs,
  native media notification text, the web app manifest and the standalone
  emergency error page may still use device/browser languages or English.
- This feature does not translate the broadcasters' live audio or song metadata,
  and it does not require a translation API or new runtime dependency.

## Source and tests

Dictionary keys live in `src/i18n/en.js` and `src/i18n/pl.js`.
`src/context/LanguageContext.jsx` owns the preference and translation
helper. To add a new UI message, add a matching key in both dictionaries.

`LanguageContext.test.jsx` covers default, storage and future-schema
handling and `App.test.jsx` confirms that language switching does not
recreate the shared audio player or lose favorites. Filter tests cover
translated Polish search. Run `npm run check` before merging.

This change does not alter the PWA cache/storage version or the station catalog.
