# Curated catalog and search

The app currently ships 12 stations as reviewed source data in `src/data/stations.js`.
The original nine IDs and stream URLs are preserved. Three Deutschlandradio
programmes add Germany, culture and talk options, and a German language filter.
Six previously included SomaFM channels are temporarily removed after reported
connection failures on Android and pending review of third-party use terms.
PR Chicago remains in the US catalog.
Publisher pages, playlists and reachability results are recorded in
[station-sources.md](station-sources.md).

The bundled catalog is the offline catalog: startup, building, search and
filtering need no directory service. This release adds no runtime API calls,
tracking, new packages, remote artwork requests or extra audio elements.
Stations without bundled artwork use decorative local SVG monograms; these
are placeholders, not broadcaster logos. Media Session omits missing artwork.

## Finding and revealing stations

Search requires every word to match somewhere in a station's name, genres or
static description, in any order. It ignores case, repeated whitespace and
diacritics including Polish `ł`. Examples: `german culture`, `PR Chicago`.
Country, genre, language, Favorites and Recent continue to intersect the search.
Descriptions describe programming, not the current song.

The first 12 matching stations appear initially. With the current 12-station
catalog there is no **Show more stations** button. The existing feature is kept
for future larger catalogs: it reveals the next 12 in the same order and moves
focus to the first newly revealed station. Filtering/search runs over the entire
catalog before pagination, so a matching station never needs to be revealed first. Counts distinguish shown
results, total matches and collection size.

`?page=2` will restore the first 24 matches once the catalog again contains
more than 12 stations. For the current 12-station catalog, it safely falls back
to page one. Pagination is an accumulated list, not a replacement page. Valid
pages are positive whole numbers bounded by the catalog's total page count;
invalid values display the first page. Editing a search/filter/collection resets
to the first page. Unrelated URL parameters remain intact. Playback, favorites
and history use the complete catalog regardless of visible cards.

## Directory evaluation and next stage

[Radio Browser](https://api.radio-browser.info/) is a candidate for worldwide
discovery. Its documentation calls for discovering and randomizing mirrors,
retrying another mirror on failure, stable `stationuuid` identities (not numeric
IDs), standardized country codes, an identifying agent and click reports.
One permanently hardcoded API server would conflict with its documented design.

This release keeps a reviewed catalog rather than adding that runtime dependency.
A directory integration remains separate work: choose a discovery/proxy design,
normalize/validate results and stream protocols, deduplicate against curated IDs,
persist added stations for favorites/history/reload, bound cached data and define
stale/offline fallback. A search result or directory health flag alone does not
verify a broadcaster's identity or establish native playback.

SomaFM sources are no longer part of the active catalog. Earlier link checks
and reasons for temporarily removing the channels are recorded in
[station-sources.md](station-sources.md). Their IDs have not been explicitly
deleted from saved favorites or listening history; absent catalog entries are
simply not displayed until reintroduced.

To add a curated station, keep a stable ID, separate country/language/genre data,
record the publisher source and verify its HTTPS stream with a bounded request.
Review that evidence separately from deterministic tests. Re-run `npm run check`
and browser/PWA checks, including offline filtering, keyboard paging and return
navigation. New IDs work with the existing shared player, favorites and history.
