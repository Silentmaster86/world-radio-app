# Radio studio visual design

The application now uses a shared studio-inspired visual language: deep navy and
iris in dark mode, pale neutral surfaces and deeper violet in light mode. Both
retain explicit contrast for text, focus and actionable controls. Station logos
are unchanged; deterministic ID-derived hues decorate artwork/fallback initials
without changing station identity, data or broadcaster metadata.

## Responsive surfaces

- Header: compact gradient brand mark, consistent 44px navigation/settings
  controls and a scrollable settings sheet. Language, appearance, library and
  backup remain accessible. Opening animation translates the sheet without
  shrinking touch targets.
- Home: an editorial heading and original CSS globe illustration on desktop,
  larger artwork cards, and a compact two-row desktop search/filter layout.
  Phones keep the small header, collapsed refinements and horizontal station
  rows. The desktop hero is hidden on phones rather than pushing stations below
  the persistent player.
- Player: consistent rounded mini player, artwork, control styling and real
  connection/playback feedback. Desktop floating placement, phone safe areas,
  measured player height and page padding keep content reachable. Car mode
  retains its short-landscape arrangement and large controls.
- Discover, library, recipient and backup views share colors, surfaces, borders,
  spacing and control treatment. Existing route/dialog semantics and keyboard
  focus management remain in place.

## Motion and state

Native CSS handles hover/press feedback, favorite heart response, control icon
changes, sheet entrance, artwork halo and a decorative playback activity signal.
The desktop globe orbit breathes only during Playing. The connecting/buffering
mini-player glow follows those actual controller states. No visual code creates
or replaces Audio, changes sources, accesses Web Audio or schedules frame loops.
The bars are a playback-state illustration, not measured frequency/amplitude or
current-song metadata.

Persistent playback animation stops on pause/idle. `prefers-reduced-motion:
reduce` disables transitions and animation, including the playback signal/halo;
selection, accessible status text and controls remain usable. Motion uses small
transform/opacity effects, with no continuously animated full-page blur, remote
fonts or added animation dependency.

## Delivery and verification

Header, station card and mini-player styling moves from initial JavaScript to the
cacheable `src/styles/visual.css` asset. Theme variables are supplied by the
existing theme provider. The build manifest/service worker include CSS and
validate its MIME type, so this design also works offline. Browser static servers
serve the new CSS asset as `text/css`. The existing initial JS budget stays in
place and counts all initial chunks.

`node scripts/check-design.cjs` covers 24 combinations of PL/EN, light/dark,
320/390/desktop and normal/reduced motion. It decodes an original MP3 fixture
through real Audio, verifies active feedback, no idle animation loops, reduced
motion, artwork sizing, and a single uninterrupted audio instance while changing
language/theme and switching player views. Pause must unload the stream and stop
persistent motion. Screenshots are retained for both the library and car player.

The unchanged UX assertions also check first-station visibility, touch targets,
contrast/accessibility, keyboard access, large text and landscape layouts.
Discovery, HLS, backup, management/sharing and PWA checks continue against the
build and exact-head Netlify preview. Physical-device appearance/sharing and
publisher stream availability remain separate from controlled browser fixtures.
