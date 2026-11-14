# Studio, gentle motion and clear backup help

The backup panel now uses everyday labels: **Backup / Save backup / Add from
backup** (PL: **Kopia zapasowa / Zapisz kopię zapasową / Dodaj z kopii**).
Inline FAQ and the `/help` route explain the complete transfer: save a file on
the old device, send it to yourself, select it on the new device, review and
combine. They describe local browser storage, recovery limitations, backup
contents and the difference between an offline library and live radio audio.
All eight interface languages include these instructions. The existing backup
schema, merge behavior and optional settings import remain unchanged.

## Theme and motion

- From **375px**, a native system/light/dark select lives between Discover and
  Settings. On phones it uses a single 44px icon-sized target, rather than three
  buttons that crowd the header. At **320–374px** it remains in Settings.
- The background uses two local SVG wave layers animated only by CSS transform.
  Light mode uses subtle indigo/mint; dark uses aqua/indigo. There is no GIF,
  remote background, canvas, animation library, frame loop or audio analysis.
- A Settings checkbox stops the waves and persists the choice in the optional
  `backgroundMotion` field of the existing appearance record. Old version-1
  records default to enabled; future versions stay untouched. This preference
  remains local to each device when importing a backup.
- `prefers-reduced-motion` disables all decorative motion. A visibility listener
  pauses the wave layers in hidden tabs. Forced colors hides the background.
  Neither mechanism touches Audio, playback intent or the Sleep Timer.

The full `/now-playing` view is now **Studio**, with a record-like artwork ring,
colorful activity bars and stronger control styling. Motion follows the actual
Playing state; on pause the studio effects stop. The bars illustrate playback
state, not measured frequencies. Large controls, keyboard focus, return-to-list
state and short-landscape layout remain. Studio is not Android Auto.

## Icon and delivery

The new radio icon was generated with the image-generation tool from the previous
project icon: a quieter porcelain/lavender radio, aqua dial and subtle 3D depth.
PNG/ICO size renditions are used for favicons, PWA, the header, Android launcher,
splash and Play icon. The generated original is retained outside source; the
512px PNG is the deployment master. Broadcaster logos are unchanged. Android
launcher/splash changes require a newly installed native package; the web UI
ships with the normal Netlify/PWA update process.

Studio and Help are deferred routes. The service worker still precaches the app
chunks and serves `/help` offline; HLS remains an optional on-demand engine. The
initial-JavaScript budget remains **128,000 gzip bytes**.

## Checks

`scripts/check-studio.cjs` covers 20 PL/EN/light/dark layout combinations at
320, 374, 375, 390 and 1440px. It verifies first-station visibility above the
player, 44px theme control, native System behavior, exactly two idle background
animations, their pause control, reduced motion and accessibility. It also
transfers a downloaded backup between isolated browser contexts in both
languages while checking the receiver's uninterrupted real browser audio and
Sleep Timer, then opens Help offline with the restored favorites.

The existing 36-scenario design check now distinguishes the deliberately enabled
background waves from state-driven player effects. Idle/pause permits exactly
those two waves; reduced motion permits none. Browser helpers choose the visible
theme control and close/reopen Settings around header changes, rather than
interacting with hidden or inert controls. Existing UX geometry assertions for
station visibility, touch size and clipping are preserved.
