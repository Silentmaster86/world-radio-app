# Library management and station links

Settings → Manage library opens `/library`. The Home header and station cards
retain their compact mobile layout. The page offers favorite ordering, deletion
of added stations and sharing of any station from the current catalog.

## Favorite order

- Move Up/Down buttons support keyboard and touch without requiring drag gestures.
  Controls have at least 44px targets, boundaries are disabled and focus follows
  the moved row's heading. PL/EN and both themes are supported.
- Reuse the existing ordered `wra:favorites:v1` ID list. The Favorites view follows
  that order and continues to intersect country/language/genre/search filters.
- Temporarily absent IDs keep their slots. Current catalog order, Recent order
  and the audio queue are independent. No playback or timer reset occurs.
- Existing blocked-storage/future-schema behavior remains: session changes stay
  usable and their storage message is shown; future records are not overwritten.
  Backups preserve the reordered IDs without a schema change.

## Removing added stations

Only directory stations added by the user have a remove action. A named inline
confirmation explains the effect; Cancel returns focus to its trigger. Save the
remaining added catalog before mutating the shared catalog array. If persistence
fails or the stored schema is newer, removal fails without changing the library
or audio. Curated stations cannot be deleted by this operation.

The shared catalog array keeps its identity, so removing an unrelated station
leaves playback and Sleep Timer untouched. Removing the selected station calls
`forgetStation`: invalidate pending work, unload the active source/HLS engine,
stop the timer and select a remaining station in Idle. It never automatically
plays the next station. Player preferences follow that selection.

Favorites/history IDs for a removed station remain dormant and reappear if the
same UUID is added again. They are also retained in backups. Deletion removes
the added-station record, not the user's independent favorite/history records.

## Sharing and recipients

- Links use `/station/<stable-id>` on the current app origin. They contain no
  stream URL, filters, personal preferences or private library data.
- Prefer the platform share sheet. User cancellation does not silently copy a
  link. When native sharing is unavailable/fails, try the Clipboard API, then
  show a focused, selectable URL if clipboard permission is denied.
- Curated/already-saved station links resolve locally, including offline. Opening
  a link does not change the current selection or start/interrupt playback.
- For an unknown `rb-<UUID>`, fetch that exact identity through the existing
  Radio Browser function and show a preview. Explicit Add is required before
  manual Play. UUID/HTTPS/format validation is reused, including HLS. Matching an
  existing stream URL resolves to its existing station instead of duplicating it.
- Unknown curated IDs, missing/incompatible directory records and network errors
  have clear states; a failed network lookup has a Retry action. Pending lookups
  time out and are aborted/ignored when navigating away. An unknown directory
  station cannot be resolved offline until it has been added.
- The server accepts only validated UUID lookup paths on its discovered trusted
  mirrors, retains its bounded failover/timeouts/response limit, and returns only
  matching identities. It does not fetch a caller-supplied URL. The community
  directory still cannot guarantee broadcaster identity or regional availability.

## Delivery and verification

Library/recipient/discovery views load as deferred chunks. All initial chunks
remain counted by the existing JS budget; PWA precaches the view chunks while
still excluding the optional HLS engine. Route-local error handling keeps the
shared player mounted if a deferred view cannot load. The worker and Netlify
preview checks include `/library` and shared station paths.

Unit/provider tests cover ordering/persistence/dormant IDs, playback-safe removal,
failed writes, future schemas, late HLS callbacks, share cancellation/clipboard
fallback and exact UUID lookups. `scripts/check-library.cjs` exercises real audio
fixtures while ordering/removing, a fresh recipient's preview/add/reload flow,
clipboard/manual copy, no autoplay and new offline routes. It covers PL/EN,
light/dark and 320/390/desktop widths with accessibility checks. Publisher playback
and physical-phone sharing remain separate manual checks.
