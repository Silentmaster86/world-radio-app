# Mobile interruption recovery

## Controlled checks

`npm run check` covers frozen playback while online, delayed progress events,
five bounded retries, source changes, outside pause, explicit cancellation,
disposal and sleep deadlines. `scripts/check-recovery.cjs` plays real MP3 audio
with native Chromium decoding. It breaks a local TLS media transport, rejects
early reconnects, then restores it while the browser stays online. It verifies
recovery on one audio element, unchanged favorites/history, a retained sleep
deadline, native device pause/Play simulation, expiry blocking resume, and manual
pause cancelling recovery. The ephemeral localhost TLS certificate is created in
a temporary directory and removed after the run; no keys enter the repository.

The recovery CI job runs against both the build and the exact-commit Netlify
preview. Existing HLS, UX, languages, Studio and PWA jobs remain required.
No controlled check certifies Samsung calls, operating-system audio focus,
battery restrictions or background timer scheduling.

## Physical Samsung acceptance — pending

Record exact model, Android/One UI version, Chrome version, and whether launched
in Chrome, installed PWA or our TWA APK. Compare production and the PR preview.

1. Play for one minute, then leave Wi-Fi coverage with mobile data enabled.
   Record the displayed status and how long recovery takes. The watchdog allows
   up to 15 seconds without media-clock progress before a retry; reconnect delays
   grow to 15 seconds and the session budget is finite.
2. Repeat with the screen locked. Reopen the app if needed and record whether
   JavaScript suspension delayed recovery. Do not equate the online icon with a
   working connection to the broadcaster.
3. Answer an incoming call, finish it, then separately decline an incoming call.
   Record whether audio is muted, paused or stopped and the displayed status.
   It must not deliberately reconnect through a reported pause. If the browser
   supplies a Play request afterward, it may reconnect automatically; otherwise
   use Play once. The app cannot reliably determine when a phone call ends.
4. Manually pause while connecting and wait at least 30 seconds. No queued retry
   should restart audio. Check in-app and notification Pause/Play separately.
5. Set a 15-minute Sleep Timer. Interrupt playback, then resume before expiry;
   the original deadline must remain. If it expires while interrupted or offline,
   returning online/device Play must not reopen the stream automatically.
6. Check station switching, favorites/history, volume, Studio mode and background
   playback. A station change must cancel recovery for the previous station.

If a failure remains, report status text and whether tapping the same station or
Play restores it. Never send passwords, signing keys or private browsing data.
