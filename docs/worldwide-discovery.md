# Worldwide discovery

Release review: PR #24 combines the Polish/English interface, responsive fix
and worldwide discovery. The feature branch is integrated into the existing PR;
no additional PR is needed.

`/discover` searches Radio Browser by station name and an optional country
chosen from a translated list. The server also maps the common UK alias to GB. The mobile toolbar and catalog footer link to it. Results are
requested explicitly, 25 at a time, with cancellation, errors, deduplication and
bounded paging. English/Polish and both themes are supported.

The Netlify function `netlify/functions/radio-directory.mjs` discovers mirrors
using DNS SRV, rotates their order and tries up to three with bounded HTTP
requests. When DNS discovery fails it uses multiple bootstrap hosts. Requests
identify the app. Only Radio Browser hosts are contacted; this is not a stream
proxy. Searches have a short HTTP cache lifetime. Successful playback of added
stations reports their public UUID to Radio Browser as requested by its API;
reporting failures never affect playback. There are no accounts or listening
recordings.

Sources: [API usage](https://api.radio-browser.info/) and
[server API](https://de1.api.radio-browser.info/). The community directory is
not a broadcaster identity verification service. Its availability flags cannot
guarantee regional/device playback.

Only HTTPS URLs without credentials, HLS flags or playlist extensions can be
added. Unsupported entries remain visible with an explanation and a disabled
add action, rather than silently disappearing. Empty searches explain how to
try a shorter name or all countries. Remote artwork is not loaded. At most 100 added station records are
stored under `wra:stations:v1`. Records are validated again on startup; malformed
entries are discarded and newer schemas are left untouched. Storage errors keep
working session additions with an explanatory message. Additions are saved
locally before the user chooses to play; adding never autoplays.

`StationsProvider` owns a stable catalog array used by the existing controller,
and a reactive snapshot for views. Adding stations does not recreate Audio,
reset a timer or interrupt playback. Favorites/history retain IDs; added station
records make those IDs usable after reload. The bundled catalog remains the
fallback when the directory is down. Added records remain available offline;
new remote searches require connectivity. No search-result cache or cross-device
sync is promised. Other open tabs see added records on their next reload.

Verification: `npm run check`, `scripts/check-discovery.cjs`, existing UX/PWA
scripts. The new browser checks use controlled directory responses; live source
reachability is separate. A manual call of the real server handler returned HTTP
200 and Polish jazz results during implementation. Native playback/identity is
not established by a directory result. Netlify deployment is needed to expose
the server function; plain `vite preview` serves the UI, not serverless functions.

Review the combined release at PR #24's exact-head Netlify preview, including
direct `/discover` navigation and the deployed directory function. Production
merge/deployment waits for user acceptance of the preview. Browser simulations
do not replace real iPhone/Android playback and background checks.
