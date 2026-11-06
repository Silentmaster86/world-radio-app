# Foundation changes

## Development

Use the Node version in `.nvmrc`, install with `npm ci`, and run `npm start`.
`npm run check` runs lint, formatting, regression tests, the production build and
bundle checks. GitHub Actions uses the same command on pull requests and main.
Vite builds the application and standalone Jest runs the React tests; see
[tooling.md](tooling.md) for commands and editor setup.

The Jest-only module mappings in `jest.config.cjs` select React Router's real
CommonJS entry points, so application integration tests run the actual router.
These explicit paths match the locked router version; revisit them when updating
that package. Vite resolves the normal browser exports in production.

Netlify runs `npm run build` and publishes `build/`. Generated build output is
ignored and is no longer a second source of truth in Git. `public/_redirects`
is copied into the published build and provides SPA history routing. Scripts and
the manifest use root-relative addresses, including on `/now-playing/`.

## Favorites migration

- Stations have stable IDs, separate country/language fields and genre arrays.
- New favorites live under `wra:favorites:v1` as
  `{ "version": 1, "stationIds": ["capital-dance", "heart-uk"] }`.
- A legacy `favorites` array is resolved by known station names. Old URLs and
  logo hashes are not used to identify the current station.
- Migration runs after mounting. The legacy key is removed only after a
  successful new write, and only if all entries could be matched.
- Unmatched legacy entries remain in the old key as a backup. Unknown IDs in a
  current record are also retained for stations that may return to the catalog.
- Storage failures leave favorites usable in memory and display a notice. A
  record from a newer schema is preserved without downgrading it.
- An unexpected render failure displays a recovery screen without deleting data.

## Review on the Netlify deploy preview

1. Open and reload `/`, `/now-playing`, and `/now-playing/`; check that scripts,
   logos and `/manifest.json` load.
2. Before loading the app, seed a legacy favorites array in localStorage. Confirm
   the same stations appear under Favorites and remain after a reload.
3. Repeat with invalid JSON, `null`, an object instead of an array, and blocked
   storage; the catalog must remain usable.
4. Check the US filter includes PR Chicago and GB excludes it.
5. Select a favorite and verify the current catalog URL is used; test switching
   between the home screen and car view.

## Subsequent stages

Playback, persistent/car controls, filtering, themes, mobile layouts, PWA
offline/safe updates and the Vite migration have been completed. The production
service worker is generated and enabled with the strategy in [pwa.md](pwa.md).
See [roadmap.md](roadmap.md) for the current backlog.
