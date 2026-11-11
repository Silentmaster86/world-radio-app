# Current roadmap

This is the current work list. Earlier stage notes describe implementation
history; their original follow-up lists are no longer the current backlog.

## Completed foundation

- Stable station IDs and validated favorites/preferences with legacy migration.
- One event-driven audio controller, bounded retry/offline handling and Media Session.
- Persistent mini player, car view, combined URL filters and appearance settings.
- Responsive layouts, keyboard/contrast checks and optimized station logos.
- Installable PWA shell, offline catalog/favorites and updates that wait for open tabs.
- Vite, React/React DOM 19, standalone Jest, ESLint/Prettier and build/browser CI.
- Runtime advisory checks and grouped Dependabot updates. Babel 8 is deliberately held.

## Recent product features

- Sleep timer: selectable duration, shared countdown, cancellation and automatic pause.
  See [sleep-timer.md](sleep-timer.md) for behavior and background-timing limits.
- Recent stations: a bounded local list of confirmed playback, recency ordering,
  filtering and independent clearing. See [recent-stations.md](recent-stations.md).
- Curated catalog: currently 12 stations, including three Deutschlandradio
  programmes and PR Chicago. Six SomaFM channels were temporarily removed after
  Android connection failures, while preserving saved favorites/history IDs.
  Keyword search and progressive reveal remain in place for larger catalogs.
  See [catalog.md](catalog.md) for details and directory evaluation.

- Polish and English interface with persistent preference, translated station
  descriptions and bilingual catalog search. See [language.md](language.md).

## Current delivery plan

Worldwide Radio Browser discovery, saved added stations, PL/EN settings and the
compact mobile layout have shipped. The next stages are complete product
increments, each with a preview, regression checks and manual acceptance before
production. They are improvements, not a list of confirmed defects.

1. **HLS playback (shipped in PR #25).** Enable compatible HTTPS HLS stations,
   including verified BBC Radio 1 sources, using the shared player. Keep existing
   favorites, history and Sleep Timer. See [hls.md](hls.md).
2. **Personal data backup (shipped in PR #26).** Versioned JSON export/import of added stations,
   favorites, history and preferences. Validate files, preview and combine data
   with stable ID/URL deduplication; preserve the live player and Sleep Timer.
   Settings import is opt-in; no replacement mode or required account.
   See [library-backup.md](library-backup.md).
3. **Library management and sharing (shipped in PR #27).** Reorder favorites, remove
   added stations safely, and share direct links with a recipient preview/add flow.
   See [library-management.md](library-management.md).
4. **Visual redesign and richer animation (current branch).** A coherent visual direction for the
   library, discovery, player and settings; stronger artwork, typography and
   hierarchy. Add purposeful transitions, playback feedback and loading states.
   Keep compact phone layouts, 44px touch targets, light/dark contrast, keyboard
   access and reduced-motion support. Check actual mobile performance before
   adding persistent effects or large animation dependencies.
   See [visual-design.md](visual-design.md).
5. **Additional interface languages.** Start with roughly 10–15 major languages,
   choosing coverage and review capacity before adding more. Generate/review
   dictionaries, load them on demand and cache for offline UI; localize plurals,
   country names and formatting. Add RTL layout support for Arabic, not just
   translated text. This translates the interface, not live radio broadcasts.

   Candidate translation APIs: [Google Cloud Translation](https://cloud.google.com/translate/docs/languages)
   and [Azure Translator](https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support).
   Supported languages vary by service/model; neither means literally every world
   language. Prefer translation during development over a paid request on every
   page view. Keep credentials in tooling/server secrets and review cost/terms
   before enabling a service. No paid API is enabled by this roadmap.

Physical-device review remains a release task: iOS/Android audio, lock-screen
controls, background behavior, installation and safe areas cannot be established
by HTTP reachability or Chromium fixtures. Runtime advisories and Babel 8
compatibility remain ongoing maintenance; see [tooling.md](tooling.md).
