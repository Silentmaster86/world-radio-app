# Classic radio studio visual design

The existing design remains the default. See [selectable app designs](app-designs.md)
for Orbit, Pulse, Analog and Signal and the independent appearance setting.

The application now uses a shared studio-inspired visual language: midnight navy and
aqua in dark mode, porcelain/indigo with a soft mint horizon in light mode.
System appearance follows the OS and uses the corresponding complete palette. Both
retain explicit contrast for text, focus and actionable controls. Station logos
are unchanged; deterministic ID-derived hues decorate artwork/fallback initials
without changing station identity, data or broadcaster metadata.

## Atmosphere and color

Radial light pools and two gently moving local SVG wave layers span the page
behind content. Each theme has its own atmosphere, horizon and shadow values.
The waves ignore pointer input and use CSS transforms, with a persistent pause
choice in Settings. They stop in hidden tabs and under reduced-motion settings;
forced colors hides them. There is no remote background request or GIF. The
original static radio-field SVG remains a small decorative mask in desktop
artwork panels; mobile artwork stays compact. See [Studio experience](studio-experience.md).

Cards, the settings sheet and the mini player use opaque theme surfaces with
subtle tinted depth, rather than placing controls directly over patterned
backgrounds. Contrast, focus and touch sizes still take precedence over effects.
Changing the OS scheme in System mode updates all theme variables without
recreating Audio, clearing data or restarting a stream.

## Responsive surfaces

- Header: soft 3D radio mark, consistent 44px controls and a scrollable settings
  sheet. Appearance is in the header from 375px and in Settings at 320–374px.
  Language, motion pause, library, backup, privacy and Help remain accessible.
- Home: an editorial heading and original CSS globe illustration on desktop,
  larger artwork cards, and a compact two-row desktop search/filter layout.
  Phones keep the small header, collapsed refinements and horizontal station
  rows. The desktop hero is hidden on phones rather than pushing stations below
  the persistent player.
- Player: consistent rounded mini player, artwork, control styling and real
  connection/playback feedback. Desktop floating placement, phone safe areas,
  measured player height and page padding keep content reachable. Studio
  retains its short-landscape arrangement and large controls, with a record-like
  artwork ring and state-driven activity bars.
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

Persistent playback animation stops on pause/idle; the two optional background
waves continue until paused in Settings. `prefers-reduced-motion:
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

`node scripts/check-design.cjs` covers 36 combinations of PL/EN, light/dark/system,
320/390/desktop and normal/reduced motion. It decodes an original MP3 fixture
through real Audio, verifies active feedback, bounded background motion, reduced
motion, artwork sizing, and a single uninterrupted audio instance while changing
language/theme and switching player views. In System mode, OS light/dark changes
are also verified during uninterrupted playback. Pause must unload the stream and stop
persistent player motion. Screenshots are retained for the library and Studio.

The unchanged UX assertions also check first-station visibility, touch targets,
contrast/accessibility, keyboard access, large text and landscape layouts.
Discovery, HLS, backup, management/sharing and PWA checks continue against the
build and exact-head Netlify preview. Physical-device appearance/sharing and
publisher stream availability remain separate from controlled browser fixtures.
