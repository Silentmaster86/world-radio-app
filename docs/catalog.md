# Curated catalog and search

The app ships 18 stations as reviewed source data in `src/data/stations.js`.
The original nine IDs and stream URLs are preserved. Six SomaFM channels and
three Deutschlandradio programmes add ambient, lounge, jazz, indie, house,
classical, culture and talk options, Germany and a German language filter.
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
diacritics including Polish `ł`. Examples: `jazz somafm`, `late-night house`.
Country, genre, language, Favorites and Recent continue to intersect the search.
Descriptions describe programming, not the current song.

The first 12 matching stations appear initially. **Show more stations** reveals
the next 12 in the same order and moves focus to the first newly revealed
station. Filtering/search runs over the entire catalog before pagination, so a
matching station never needs to be revealed first. Counts distinguish shown
results, total matches and collection size.

`?page=2` restores the first 24 matches, including after reload, browser Back or
return from car mode. It is an accumulated list, not a replacement page. Valid
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

SomaFM's [metadata API page](https://somafm.com/linktous/api.html) says the API is
no longer available to third parties. This app does not consume that API. The
curated channels use public listening pages and downloadable playlists explicitly
provided for external media players.

To add a curated station, keep a stable ID, separate country/language/genre data,
record the publisher source and verify its HTTPS stream with a bounded request.
Review that evidence separately from deterministic tests. Re-run `npm run check`
and browser/PWA checks, including offline filtering, keyboard paging and return
navigation. New IDs work with the existing shared player, favorites and history.
