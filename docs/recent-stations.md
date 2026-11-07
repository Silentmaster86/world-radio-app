# Recent stations

The **Recent** collection lists up to 20 distinct stations, newest first. A
station enters the list after the shared player confirms that it is playing.
Selecting a station, waiting for a connection, failed playback and restoring the
last selected station at startup do not create entries. Replaying a station moves
its existing entry to the front.

Search, country, genre and language filters intersect the recent collection
without changing its order. The collection is addressable as `?section=recent`
and remains available after reload, in car-mode return navigation and offline
once the app shell is ready. Live listening still requires a connection.

**Clear history** affects only this list. Playback, favorites, appearance and
player preferences keep working. Keyboard focus returns to the Recent control.
Clearing while a station is playing stays cleared through buffering; a new
station or an explicit new playback session can create another entry.

The list stores station IDs on this browser/device as `wra:recent:v1`:

```json
{ "version": 1, "stationIds": ["heart-uk", "capital-dance"] }
```

It contains no recordings, listening durations, timestamps or stream URLs.
Entries absent from today's catalog stay within the bounded saved list in case
those stations return; only available catalog entries appear in the UI. Storage
events synchronize changes from other app windows. Blocked/quota-limited storage
leaves a session-only list and a notice in Recent. A newer saved schema is
preserved, with changes limited to the current session.

`RecentStationsProvider` observes confirmed audio state above the routes; it
does not create or control an audio element. Reading storage has no write effect.
Tests cover playback confirmation, ordering/limits, invalid/newer data, storage
failure and synchronization, clearing during playback/buffering, route/reload
continuity, filters, keyboard focus and PWA offline/update preservation.
