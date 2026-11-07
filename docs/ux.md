# Browsing and appearance

This stage follows the foundation (#1) and playback (#2) drafts. Review and merge
in that order, followed by this UX stage. It targets `main` for Netlify previews;
none of the draft branches changes production until merged.

## Behavior and files

- `src/hooks/useStationFilters.js` intersects collection, country, genre, language
  and normalized keyword search over station names, genres and descriptions.
  `section=favorites` or `section=recent`, `country`, `genre`, `language`, `q` and
  accumulated `page` are URL parameters. Editing replaces the current history
  entry, so typing does not create a Back entry per character. Invalid option
  values fall back safely. Reset removes app filters and preserves unrelated
  parameters. Collection counts use known catalog IDs; favorite IDs outside the
  catalog remain preserved in storage. Recent station IDs follow the same rule;
  their bounded recency order and playback confirmation are described in
  [recent-stations.md](recent-stations.md).
- The catalog reveals matching stations in groups of 12, preserves the expanded
  list through reload and car-mode return, and resets paging when filters change.
  Keyboard focus moves to the first new station. See [catalog.md](catalog.md).
- `StationControls` provides visible labels and native selects. `EmptyState`
  distinguishes empty favorites/recent collections from refinements with no matches.
  Clearing refinements keeps the selected collection; browsing all resets it.
- `src/components/Layout/SoundBar.jsx` mounts outside the routed page. It shares
  the existing audio provider. Its measured height reserves space below the list
  and sets scroll padding, including wrapped errors and safe-area insets. There
  is one visible transport: the dock on the catalog, the full player in car mode.
  Mobile keeps Play/Pause and the car-mode button available; volume and station
  stepping remain available in the full player.
- `src/context/BrowsingContext.jsx` keeps the last list search, scroll and focused
  control for in-app return and browser Back. Query/filter values survive reload
  through the URL. Scroll/focus are session navigation state, not stored user
  preferences. Direct car-mode entry returns to the unfiltered catalog.
- `src/pages/NowPlaying.jsx` uses a two-column layout on short landscape screens.
  Large logo margins and forced card height are removed. Normal-state transport
  controls fit 844×390 and 568×320; expanded errors and enlarged text may scroll.
  Content is never clipped with fixed-height overflow rules. The heading receives
  focus on entry, and return restores the originating control.
- `src/context/ThemeContext.jsx` supports system/light/dark. It stores the user's
  explicit choice as `wra:theme:v1` with `{version:1,mode}`. System mode tracks OS
  changes; explicit modes detach the subscription. Invalid settings fall back,
  blocked storage leaves working session controls, and future schemas remain
  untouched. The document color scheme and theme-color follow the resolved theme.
- `themeTokens`, `darkTheme`, `lightTheme` share spacing, typography and component
  tokens. Text/accent colors support both backgrounds. Cards use restrained
  borders and readable metadata. System fonts avoid an undeclared font download.
  Cards have no movement; global reduced-motion rules disable CSS animation and
  routes render directly without an animation runtime.

## Logos

PNG originals remain in `src/assets/logos/`. Runtime imports use generated 96,
192 and 384 px WebP variants in `optimized/`; `StationLogo` selects an appropriate
source using `srcset`/`sizes`, gives images dimensions, and lazy-loads cards.
The dock and full player load their current logo eagerly. Media Session receives
real MIME types and dimensions from the same manifest.

Regenerate after editing source logos:

```sh
python -m pip install Pillow==12.3.0
python scripts/optimize-logos.py
```

Commit the source edit, regenerated WebPs and `src/data/stationLogos.js` together.
Normal application builds do not need Python or Pillow. Nine source PNGs total
2,604,132 bytes; the nine 192 px variants total 27,230 bytes (98.95% smaller).
All three sets together total 101,020 bytes. Actual transferred bytes depend on
viewport, device pixel ratio, caching and which cards become visible.

## Verification

`npm run check` runs the deterministic tests and production build. New tests
cover combined URL filters, refresh/reset, empty-state actions, route continuity,
scroll/focus restoration, dynamic dock measurement, appearance persistence,
OS changes, blocked storage and future preference schemas.

The `ux-browser` GitHub Actions job provisions isolated, pinned Playwright and axe
packages outside the application dependency tree. It runs `scripts/check-ux.cjs`
against the production build using Chromium. It checks:

- Both themes at catalog widths 320, 390, 481 and 1440 px.
- Standard-density light and high-density dark rendering, with decoded visible logos.
- Horizontal overflow, visible transport targets, dock/content overlap, and car
  controls at 844×390 and 568×320.
- WCAG A/AA rules in axe, including text contrast; screenshots and geometry are
  uploaded as the `ux-browser-results` workflow artifact.
- Keyboard favorite actions, combined URL filters, reload, real scrolling and
  browser Back, return focus, empty-state actions, appearance persistence and
  text reflow at 200% font size.
- No media request or autoplay at startup. It does not fake a successful real
  stream and does not use stream availability as a layout-test dependency.

Browser checks run on the GitHub-hosted runner and can also run locally where
Chromium and its required system libraries are available.
Automated Chromium/axe results do not replace physical-device and visual review.

On the Netlify preview, also open `/now-playing` directly and refresh it; verify
that the host returns the application rather than a 404. Check notch/safe areas,
keyboard focus, both themes, landscape orientation and zoom in Safari/iOS and
Android. Listen to real streams and test physical volume/media keys separately.
The browser script accepts `WRA_BASE_URL` to run the same checks against a preview
when its URL and network access are available. For PRs the CI job waits for the
Netlify status on the exact head commit, verifies HTTP/HTML/script responses on
`/` and `/now-playing`, then repeats the browser checks on that preview. Build
and preview reports use separate directories in the workflow artifact. The
built-in server alone does not establish that Netlify's route fallback works.

Preview browser fixtures block Netlify's injected `/.netlify/scripts/cdp` loader.
Its collaboration drawer can cover mobile controls; it is host review UI rather
than part of the application. Application documents, assets and service workers
are still fetched from the real preview. This exclusion changes only the test
browser, not the deployed app or collaboration settings.
