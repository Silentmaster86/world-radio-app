# Development and checks

Use Node 24 (see `.nvmrc`) and `npm ci`. Vite runs the application; Jest runs the
existing React and library tests independently of the bundler.

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm start`            | Development server at http://localhost:5173 with React Fast Refresh |
| `npm test`             | Run the Jest suite once                                             |
| `npm run test:watch`   | Rerun relevant Jest tests while editing                             |
| `npm run lint`         | Check JavaScript, JSX and React hooks                               |
| `npm run format`       | Format the repository with Prettier                                 |
| `npm run format:check` | Check formatting without changing files                             |
| `npm run build`        | Build to `build/`, write asset metadata, generate the PWA worker    |
| `npm run serve`        | Preview the production build at http://localhost:4173               |
| `npm run check`        | Run formatting, lint, all unit tests, build and bundle checks       |

Use ESLint and Prettier editor integrations with the repository configurations.
The `.editorconfig` sets UTF-8, LF and two-space indentation. Generated logo
metadata is excluded from Prettier; regenerate it with the existing logo script.
Keep JSX in `.jsx` files; plain JavaScript remains `.js`. Tests use Jest globals,
the existing React `act` helper, and a small file mock for imported images.

## Build and deployment contract

The root `index.html` references `src/main.jsx`. Vite copies `public/` unchanged.
Production output stays in `build/`, so the Netlify publish directory and SPA
redirects do not change. Hashed scripts and images remain under `/static/` for
the existing immutable cache headers. Images stay external rather than becoming
inline JavaScript strings. Source maps are emitted for performance diagnostics.

`scripts/write-build-manifest.cjs` converts Vite's `.vite/manifest.json` into the
project's `asset-manifest.json`. The PWA generator reads this file to precache
generated assets with revision hashes. Both the 100 KiB gzip budget and
Lighthouse comparison sum **all initial JavaScript chunks**, while deferred
chunks are excluded from that startup total. Build-output regression tests check
the manifest contract and the generated HTML entry.

`process.env.NODE_ENV` in the PWA manager is a compile-time constant replaced by
Vite, and remains `test` in Jest. Do not expose `process.env` wholesale to the
browser. Future public configuration must use Vite's explicit `VITE_` variables.

Development and production preview use separate ports so a production service
worker cannot take control of the development server. The dev server does not
register a worker. Test offline behavior using `npm run build` and
`npm run serve`, as described in [pwa.md](pwa.md).

## Pull requests

Run `npm run check` before pushing. The existing CI additionally tests Chromium
layouts, accessibility and PWA behavior on the build and Netlify preview, then
compares baseline/candidate Lighthouse reports. Keep browser tools isolated from
the application dependencies. Review their artifacts alongside the checks.
Target `main` for Netlify previews; do not merge a failing deployment.
