# Real-device playback verification

These results were reported on 7 November 2026 from a Samsung Android device.
The exact model and Android/One UI version have not been confirmed. The observations
are manual, not automated or universal compatibility claims.

## Android results

- Play a station for at least one minute: **Pass**
- Switch station during playback: **Pass**
- Keep audio playing after locking the phone: **Pass**
- System media controls: **Partial**. The Capital FM media card, with
  Previous/Pause/Next buttons, appears in Samsung quick settings during playback.
  The card disappears immediately after tapping Pause.
- Bluetooth headset media controls: **Not tested**
- Switch Wi-Fi to cellular network: **Pass**
- Return after several minutes in the background: **Pass**
- Sleep timer after 15 minutes with the screen locked: **Pass** in one reported trial
- Rotate the phone and use search: **Pass**

The reporter saw the disappearing paused controls in Chrome and the installed PWA.
The screenshots establish a card in the expanded **quick settings** panel, not on
the lock screen itself.

## Follow-up on system pause

### PR #19 physical-device recheck — reported pass

On 7 November 2026, the same user retested the
[PR #19 preview](https://deploy-preview-19--worldradioapp.netlify.app/)
after the Android media-pause change and reported **"Tak. Działa"**
("Yes. It works") in response to the Pause/Play control test. This
supports that the previously disappearing media controls now work
in the preview on their device. The precise device/software versions
and extended battery/mobile-data effects remain unverified.

An experimental branch retains the existing audio source when a system media
pause action occurs after playback has been confirmed. Ordinary in-app pause,
an unconfirmed connection and sleep timer expiry still unload the source. The
browser or operating system may nevertheless remove the paused media card.
Further real-device checks of ordinary in-app Pause, timer expiry, Bluetooth,
and paused network/battery use are still useful before merging.

Compare the production app with the PR deploy preview:

1. Does the quick-settings card remain after tapping Pause?
2. Can Play resume a **live** stream?
3. Does a paused live stream consume unexpected mobile data or battery?
4. Do Next/Previous and in-app Pause continue to work?
5. Does sleep timer expiry still unload the source?
6. Does playback survive lock/unlock, reconnect and app switching?

Do not merge the experiment solely because unit tests pass. Capture the exact
phone model, Android/One UI version, Chrome version, Chrome/PWA mode and results.
iOS Safari remains untested.
