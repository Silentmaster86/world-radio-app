# Selectable app designs

Open **Settings → App design** to choose a layout. **Classic** is the default;
existing installations keep their current appearance until a design is selected.
The choice is independent of **System / Light / Dark**, language and the
background-animation switch.

| Design  | Layout and visual behavior                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classic | The existing studio, compact mobile station list and familiar player.                                                                                                         |
| Orbit   | Desktop navigation rail, orbital scene, round artwork, station rows and a rounded player dock.                                                                                |
| Pulse   | Organic hero artwork, asymmetric station tiles, pill navigation and a sculpted player.                                                                                        |
| Analog  | Receiver cabinet, preset display, tuning scale, reels, mechanical station buttons and textured surfaces. The scale is decoration, not a broadcast frequency or live metadata. |
| Signal  | Hard borders, numbered station rows, editorial typography and a stepped signal animation.                                                                                     |

Layouts adapt to the available height as well as width. Short phone screens
prioritize station actions over decorative scenes; Pulse uses compact rows there.
Landscape phones use a compact search/dock and side navigation for the new
designs. Controls retain a minimum 44px touch target. Full-player artwork becomes
smaller when needed to keep playback controls reachable.

## Playback and motion

The design provider sits below the shared Audio provider. A change replaces
visual components and CSS, not the audio controller. It preserves the source,
playback position, volume, favorites, history and active Sleep Timer. No design
creates its own Audio element. Switching a paused player does not start it.

Decorative design animations respond to playback. The Settings animation switch,
`prefers-reduced-motion` and hidden-page state pause or remove the new motion.
The graphics use local CSS/SVG, with no third-party animation or image service.

## Persistence, backups and offline use

The validated `wra:design:v1` record stores one of
`classic/orbit/pulse/analog/signal`. Unknown values fall back to Classic. Newer
record versions are preserved; changes then apply for the session. Storage
failures also leave a usable session design and display an explanation.

Backups now optionally include `settings.design` and
`settings.backgroundMotion`. Importing settings remains opt-in. Old version-1
backups still work and do not replace the current design or animation preference
when those fields are absent. Import preloads the requested design and language
before writing the library; a failed download leaves the library and player as
they were.

Each new design and its CSS loads on demand. If loading fails, the previous
working layout stays active. All design assets are included in the activated
PWA shell, so styles can be switched offline after setup. A live radio stream
still requires internet.

## Implementation and checks

- `src/context/DesignContext.jsx`: validated preference, asynchronous selection,
  cancellation of stale downloads and slots for optional visual components.
- `src/designs/loader.js`: one deferred entry per new design.
- `src/designs/{orbit,pulse,analog,signal}.jsx` and matching CSS: palettes,
  distinct hero structures and route/player styling.
- `src/designs/shared.jsx`: real route links and shared provider actions.
- `src/designs/DesignPicker.jsx`: localized, keyboard-accessible settings previews.
- `src/context/ThemeContext.jsx`: base appearance merged with the active palette;
  System follows subsequent OS changes.
- `scripts/check-styles.cjs`: 150 home layouts and 200 other-route layouts across
  five designs, PL/EN, light/dark/system, portrait phones, landscape, tablet and
  desktop. It checks touch targets, overflow, the first station above the dock,
  player controls and accessibility, plus real audio continuity, timer/library
  preservation, persistence, offline switching, failed downloads and two-tab edits.

Browser checks use actual Chromium decoding of a deterministic audio fixture.
They do not establish real telephone audio focus, iOS behavior or Google Play
readiness. Physical-device checks remain part of release acceptance.
