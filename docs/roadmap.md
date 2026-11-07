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
- Expanded curated catalog: 18 stations, nine publisher-sourced additions,
  keyword search and paged reveal with offline/return continuity. See
  [catalog.md](catalog.md) for behavior and the directory evaluation.

## Next work, in priority order

1. **Real-device playback review.** Check iOS Safari/Android native MP3/AAC,
   lock-screen controls, background playback, safe areas and installation. HTTP
   stream reachability and Chromium fixtures do not establish those behaviors.
   PR Chicago's publisher source has been verified and its current endpoint is
   documented in [station-sources.md](station-sources.md).
2. **Worldwide directory discovery.** Build on the Radio Browser evaluation in
   [catalog.md](catalog.md): mirror discovery, result normalization, persistent
   added stations, bounded caching/offline fallback and identity verification.
3. **Interface and language refinement.** Apply findings from phone testing;
   consider Polish/English UI and direct station sharing.

These are product improvements and verification tasks, not a list of confirmed
application defects. Monitoring tool advisories and reconsidering Babel 8 remain
ongoing maintenance, as described in [tooling.md](tooling.md).
