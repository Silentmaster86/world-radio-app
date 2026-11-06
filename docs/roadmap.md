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

## Current product feature

- Sleep timer: selectable duration, shared countdown, cancellation and automatic pause.
  See [sleep-timer.md](sleep-timer.md) for behavior and background-timing limits.

## Next work, in priority order

1. **Real-device playback review.** Check iOS Safari/Android native MP3/AAC,
   lock-screen controls, background playback, safe areas and installation. HTTP
   stream reachability and Chromium fixtures do not establish those behaviors.
   Verify PR Chicago's source identity: its configured stream responds with an
   `icy-name` of `AlienWare`; that header alone does not identify the program.
2. **Recent stations.** Add a bounded list of stations actually listened to.
   The last selected station already restores today; history would add a list.
3. **Expanded catalog.** Evaluate a station-directory source, search/pagination,
   caching/fallback and verification of station identities and stream formats.
4. **Interface and language refinement.** Apply findings from phone testing;
   consider Polish/English UI and direct station sharing.

These are product improvements and verification tasks, not a list of confirmed
application defects. Monitoring tool advisories and reconsidering Babel 8 remain
ongoing maintenance, as described in [tooling.md](tooling.md).
