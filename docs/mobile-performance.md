# Mobile loading and layout

A desktop Lighthouse result does not describe the mobile experience. The mobile
profile simulates a slower CPU and network, so inspect FCP, LCP, blocking time and
layout shift alongside the overall score.

## Changes

- The previous route wrapper always rendered at opacity 1 and did not produce a
  visible transition. Rendering routes directly removes Framer Motion and its
  transitive runtime from the initial bundle. Playback/provider ownership and
  navigation behavior are unchanged.
- On screens up to 640 px, the header is compact and country/genre/language live
  behind a native `Filters` button with `aria-expanded` and `aria-controls`.
  The count exposes active refinements even while collapsed. Search, collections
  and reset remain visible. Desktop keeps the full row of filters.
- The disclosure state lives with browsing state so returning from car mode
  keeps the panel's layout. URL filters and storage formats are unchanged.
- The station grid uses the same 640 px breakpoint as row-style cards, avoiding
  narrow two-column rows between 481 and 640 px.
- Station titles are level-two headings after the page heading. Play actions
  derive their accessible names from their content, including a hidden Play
  prefix, instead of replacing visible information with an incomplete label.
- `public/robots.txt` serves actual crawler directives rather than the SPA
  fallback HTML. This fixes the invalid-robots audit without changing indexing
  policy for existing public routes.

## Verification

`npm run check` runs unit tests, the production build and a 100 KiB gzip budget
for the initial main JavaScript file. `npm run check:bundle` checks an existing
build. A new large dependency must fit that budget or be deferred deliberately.

The `performance` PR job checks out both the pinned base commit and the candidate,
builds them independently with their lockfiles, and compares the production
builds on one runner. `scripts/measure-performance.cjs` uses:

- Lighthouse 13.6.0 and Playwright 1.62.1's Chromium, provisioned outside the app.
- A fresh browser/profile for each sample and alternating baseline/candidate order.
- Three mobile samples per build, summarized using medians, and one desktop
  sample per build. Lighthouse's standard mobile and desktop configurations apply.
- Gzip responses for text assets and immutable caching for hashed static files.
  Images retain their original format. Both builds receive identical delivery
  settings. No Netlify preview toolbar is included in loading measurements.
- HTML/JSON reports, detailed audit findings, initial JavaScript sizes and
  `comparison.json`, uploaded in the `performance-reports` workflow artifact.

Scores are diagnostic rather than a fixed CI score threshold because runner
load and browser timing vary. The gzip budget is deterministic. These laboratory
results compare the code under controlled delivery; they are not measurements
of the user's phone, Netlify CDN latency or real radio-stream availability.
The job also saves one separate mobile report for the current production URL.
That online result is reported separately from the controlled build comparison.

The existing Chromium/axe job also runs against the built app and the current
Netlify preview. Mobile widths include 320, 390, 481, 510 and 640 px. It checks
that the first station's play target is usable before scrolling, verifies the
collapsed/expanded filter behavior and return state, and captures initial-screen
screenshots in both themes. Desktop, car mode, zoom and playback-start guards
remain covered.

On a real device, check keyboard behavior, iOS safe areas, streaming and volume
controls. Save the mobile Lighthouse JSON when comparing with local DevTools;
keep the same URL, device/throttling profile and cold-cache conditions.
