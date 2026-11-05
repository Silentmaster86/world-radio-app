# Foundation changes

## Development

Use the Node version in `.nvmrc`, install with `npm ci`, and run `npm start`.
`npm run check` runs the regression tests followed by a production build. The
GitHub Actions workflow uses the same command on pull requests and main.
The tests use the existing React and CRA/Jest dependencies; no additional test
framework installation is required.

CRA's Jest 27 does not resolve the locked React Router 7 package exports correctly.
The Jest-only module mappings in `package.json` select the real CommonJS entry
points, so application integration tests run the actual router. Remove/revisit
these mappings when migrating the test runner or updating the router package.

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

## Separate follow-up work

This stage does not claim to resolve the existing audio lifecycle/race issues,
full playback status synchronization, keyboard selection of station cards,
landscape car layout, persistent mini player, PWA offline/update behavior or
toolchain migration. Those are the next planned stages. The service worker is
still disabled until its cache/update strategy is repaired.
