# Sleep timer

Open **Sleep timer** in the mini player's status row, or the moon button in car
mode. Choose 15, 30, 45, 60, 90 or 120 minutes. The active button shows remaining
minutes/seconds. Open it again to choose a new duration or **Cancel timer**.

The timer pauses the shared player and releases its live source. It survives
station changes and navigation between the catalog and car mode. Setting a timer
does not start playback; cancelling the timer leaves current playback running.
Pausing playback, including through system media controls, cancels an active
timer. If the deadline passes while offline, a later reconnection cannot resume
playback. Reloading/closing the app clears the timer; it is never saved alongside
favorites or player preferences.

Browsers can suspend JavaScript in the background, especially on phones. A
suspended app may pause late. The controller checks the wall-clock deadline
again on focus, page-show and visibility changes. This feature cannot guarantee
an exact shutdown while the operating system has suspended the app.

`src/lib/sleepTimer.js` manages one deadline/timeout. `AudioProvider` owns its
lifecycle above the routes and pauses the existing audio controller. Only the
timer widget updates its countdown each second; the entire station list does
not rerender each second. The timer adds no runtime dependency or permission.

Regression checks cover replacement/cancellation, invalid durations, delayed
execution, disposal, no autoplay, station/route continuity, manual pause,
offline expiry and a fresh session. Chromium checks dialog labels, Escape/focus,
both themes, route continuity, cancellation and expiry with a controlled clock.
