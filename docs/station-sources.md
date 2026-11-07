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

## Catalog expansion: SomaFM and Deutschlandradio

Publisher sources checked on 7 November 2026. The six SomaFM channel pages have
an **Other Ways to Listen** section expressly offering open-protocol links for
external players. The selected 128 kbit/s MP3 streams come from their public SSL
PLS playlists; the app uses the audio URL, not a playlist as an audio source.

| Station                | Publisher page                                     | Public MP3 playlist/source                                                           |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Groove Salad           | [Channel](https://somafm.com/groovesalad/)         | [PLS](https://somafm.com/groovesalad.pls)                                            |
| Drone Zone             | [Channel](https://somafm.com/dronezone/)           | [PLS](https://somafm.com/dronezone.pls)                                              |
| Secret Agent           | [Channel](https://somafm.com/secretagent/)         | [PLS](https://somafm.com/secretagent.pls)                                            |
| Indie Pop Rocks!       | [Channel](https://somafm.com/indiepop/)            | [PLS](https://somafm.com/indiepop.pls)                                               |
| Sonic Universe         | [Channel](https://somafm.com/sonicuniverse/)       | [PLS](https://somafm.com/sonicuniverse.pls)                                          |
| Beat Blender           | [Channel](https://somafm.com/beatblender/)         | [PLS](https://somafm.com/beatblender.pls)                                            |
| Deutschlandfunk        | [Programme](https://www.deutschlandfunk.de/)       | [Broadcaster stream list](https://www.deutschlandradio.de/streamingdienste-100.html) |
| Deutschlandfunk Kultur | [Programme](https://www.deutschlandfunkkultur.de/) | [Broadcaster stream list](https://www.deutschlandradio.de/streamingdienste-100.html) |
| Deutschlandfunk Nova   | [Programme](https://www.deutschlandfunknova.de/)   | [Broadcaster stream list](https://www.deutschlandradio.de/streamingdienste-100.html) |

For all six SomaFM channels, bounded HTTPS GETs to the playlist's `ice2.somafm.com`
128 kbit/s MP3 entries returned HTTP 200, `audio/mpeg`, nonempty audio bytes and
`icy-name` values consistent with the channel names. The playlist's first mirror
(`ice6`) returned HTTP 503 from the review environment; the selected `ice2`
entries are another publisher-listed mirror. This is a point-in-time choice,
not an automatic multi-mirror failover implementation.

The three Deutschlandradio publisher URLs use `st01`, `st02` and `st03.sslstream.dlf.de`,
respectively. Bounded HTTPS GETs followed HTTPS redirects to `rndfnk.com`, returning
HTTP 200, `audio/mpeg`, MP3 frame prefixes and corresponding programme names.
Only the stable publisher redirect URLs are stored; temporary signed CDN URLs
are not copied into the catalog.

Each check read at most 2,048 audio bytes and then closed the response. These
results establish reachability and source agreement at review time. They do not
prove regional access, native device decoding or background playback. No live
stream is contacted by the deterministic regression suite.
