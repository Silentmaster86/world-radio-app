# Compact radio interface

PR #24's review build combines bilingual discovery with the compact interface.
Production deployment still waits for acceptance of the updated preview.

- A shared header provides Discover navigation and one Settings action. Language
  and System/Light/Dark appearance move into a labeled native dialog, with Escape,
  a visible Done action, keyboard cycling and focus restored to the opener.
- Home uses compact collection tabs, one search row with a Filter action, and
  expandable country/genre/language refinements. Reset appears when relevant.
  Settings and filters retain 44 px controls; decorative artwork can be smaller.
- Station cards become horizontal rows with 40 px mobile / 48 px desktop artwork,
  a decorative play affordance, readable metadata and an independent 44 px
  favorite action. Text can wrap and rows grow rather than clipping enlarged text.
  The desktop grid uses wider compact rows instead of tall centered artwork tiles.
- Discover uses a name/search row and a separate country selector row. Results
  precede the all-country retry and attribution. Unsupported stream explanations
  expand on demand; the disabled action has an accessible label.
- The mini player, car player, audio/controller lifecycle, favorites, history and
  timer behavior stay shared. Settings changes do not restart a playing stream.

Verification retains the first-station-versus-dock geometry assertion. Browser
checks open Settings explicitly to verify its two selectors, 44 px bounds,
keyboard containment, Escape/focus, appearance/language persistence and axe
accessibility. All EN/PL × light/dark × 320/390/1440 combinations are covered,
with additional existing widths, car layouts and enlarged text scenarios.
Discovery screenshots include supported and unsupported results. Both local
build and the exact-head Netlify preview repeat UX/discovery/PWA checks in CI.
Native iPhone/Android review remains necessary; browser emulation is not a
physical-device playback test.
