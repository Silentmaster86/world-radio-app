# Working on World Radio App

## Scope and structure

- This repository currently uses React 18, Vite, styled-components,
  React Router and Context API. Use Node 24 (`.nvmrc`) and the locked dependencies.
- Application code lives in `src/`; public deployment files live in `public/`.
- Netlify builds the source into `build/`. Never edit or commit generated build
  output, dependency directories, credentials or test reports.
- Keep changes in small, working commits. Include all consumers when changing a
  station model or a context contract.

## Data and playback

- Preserve existing favorites and preferences when changing their storage format.
  Validate persisted data and handle storage failures without blocking playback.
- Identify stations with stable IDs. Country, language and genre are separate data.
- Keep playback shared across routes. Avoid adding a second audio element or a
  separate source of playback state in a view.
- Report actual audio events and failures in the UI. Do not describe static station
  copy as current song metadata.
- Treat external stream availability separately from deterministic regression tests.

## Verification and delivery

- Add meaningful regression tests for behavioral fixes and schema migrations.
- `npm run check` runs ESLint, Prettier, Jest, worker tests, a production build,
  build-output checks and the initial JavaScript budget. Run it before delivery.
- JSX belongs in `.jsx` files. Vite serves development on port 5173; preview the
  production build on 4173 so its service worker does not control development.
- Keep `build/asset-manifest.json` compatible with the PWA and performance scripts;
  count all initial JavaScript chunks when checking the bundle budget.
- Check direct routes on Netlify deploy previews; a local SPA fallback alone does
  not verify production routing.
- For this site's current Netlify setup, target `main` to obtain a PR preview.
  A dependent draft must clearly state its prerequisite PR and review/merge order.
  Working-branch targets require enabling branch deploys in Netlify first.
- Verify keyboard access, mobile layout and both themes for relevant UI changes.
- Document what passed and any remaining limitations in the pull request.
- Keep deployment, audio refactoring and optional feature work in separate stages.
