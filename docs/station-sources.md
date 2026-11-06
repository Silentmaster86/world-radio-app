# Station stream sources

## PR Chicago (`pr-chicago`)

Publisher sources checked on 6 November 2026:

- [Polskie Radio 1030 Chicago](https://polskieradio.com/): the current HTML player
  uses `https://usa13.fastcast4u.com/proxy/andkog01?mp=/1` in its audio source and
  `data-stream` attribute. The site's listening link also points to the
  [FastCast4u player for the same account](https://fastcast4u.com/player/andkog01/).
- [The broadcaster's older listening instructions](https://polskieradio.com/usa/2021/07/23/jak-nas-sluchac/),
  published in 2021, still list the earlier Reliastream proxy used by this app.

The catalog follows the publisher's current player. The station ID, display
name, country, language, favorites and preference formats remain unchanged.

The earlier proxy responded with an `icy-name` of `AlienWare`, which prompted
this review. That header alone does not prove that the audio program is wrong;
server-supplied metadata is not authoritative station identity. The URL change
is based on the publisher's current player rather than that header.

HTTP/audio responses establish reachability at the time of a check. Native
decoding, regional availability, background playback and physical media controls
still require browser/device review. Keep live network checks separate from the
deterministic player and storage regression tests.
