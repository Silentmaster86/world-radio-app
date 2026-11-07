# Real-device playback verification

Results below were reported on 7 November 2026 from a Samsung Android device;
the precise model and Android/One UI version were not confirmed. These are
manual observations, not automated tests or universal compatibility claims.

## Android

| Scenario | Result |
| --- | --- |
| Play a station for at least one minute | Pass |
| Switch station while playing | Pass |
| Keep audio playing after locking the phone | Pass |
| System media controls | Partial: media card with Capital FM, previous/pause/next is visible in Samsung quick settings while playing; card disappears immediately when Pause is tapped |
| Bluetooth headset media controls | Not tested |
| Switch Wi-Fi to cellular network | Pass |
| Return after several minutes in background | Pass |
| Sleep timer after 15 minutes with locked screen | Pass in one reported trial |
| Rotate phone and use search | Pass |

The reporter observed disappearing paused controls both in Chrome and the
installed PWA. The screenshots establish media controls in the expanded
**quick settings** panel, not their appearance on the lock screen itself.

## Follow-up on system pause

An experimental branch keeps the existing audio element's source attached
when the system Media Session pause action fires after confirmed playback.
Ordinary in-app pause, a pending connection, and timer expiry still unload
the source. The browser/OS can nevertheless remove a paused media card;
only retesting on a physical device can establish a change.

Compare the production app with the PR deploy preview for:

1. Does the expanded quick-settings media card remain after tapping Pause?
2. Is Play available, and does it resume a **live** radio stream correctly?
3. Does a paused live stream consume unexpected mobile data or battery?
4. Do Next/Previous and in-app Pause continue working?
5. Does timer expiry still fully release the source?
6. Does media playback continue properly after lock/unlock, reconnect and
   switching between Chrome and installed PWA?

Do not merge this experiment solely on the basis of unit tests. Document
the phone model, Android/One UI version, Chrome version, installed/PWA mode,
and any actual physical-device findings. iOS Safari remains untested.
