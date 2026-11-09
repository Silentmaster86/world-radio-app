import { stationLogos } from './stationLogos';

export const stations = [
  {
    id: 'capital-dance',
    name: 'Capital Dance',
    countryCode: 'GB',
    languageCodes: ['en'],
    genres: ['Dance'],
    ...stationLogos['capital_dance'],
    url: 'https://media-ice.musicradio.com/CapitalDance',
    color: '#4c4949',

    description: 'Capital Dance • Dance Anthems • Club Classics • Non-stop Dance Music',
  },
  {
    id: 'capital-fm',
    name: 'Capital FM',
    countryCode: 'GB',
    languageCodes: ['en'],
    genres: ['Dance'],
    ...stationLogos['capital'],
    url: 'https://media-ice.musicradio.com/CapitalMP3',
    color: '#ada8a8',

    description: "Capital FM • Today's Biggest Hits • UK Top Charts",
  },
  {
    id: 'heart-uk',
    name: 'Heart UK',
    countryCode: 'GB',
    languageCodes: ['en'],
    genres: ['Pop'],
    ...stationLogos['heart_uk'],
    url: 'https://media-ice.musicradio.com/HeartUK',
    color: '#8e4f52',

    description: 'Heart UK • Feel Good Music • Pop • Chart Hits',
  },
  {
    id: 'radio-x-90s',
    name: 'RADIOx 90s',
    countryCode: 'GB',
    languageCodes: ['en'],
    genres: ['Pop'],
    ...stationLogos['radio_X'],
    url: 'https://media-ice.musicradio.com/RadioX90s',
    color: '#E50914',

    description: 'RADIOx 90s • Best Of The 90s • Britpop • Rock Classics',
  },
  {
    id: 'pr-chicago',
    name: 'PR Chicago',
    countryCode: 'US',
    languageCodes: ['pl'],
    genres: ['News'],
    ...stationLogos['pr_chicago'],
    // Current official player: https://polskieradio.com/ (see docs/station-sources.md).
    url: 'https://usa13.fastcast4u.com/proxy/andkog01?mp=/1',
    color: '#E50914',

    description: 'Polish Radio Chicago • News • Community • Polish News',
  },
  {
    id: 'prl',
    name: 'PRL',
    countryCode: 'GB',
    languageCodes: ['pl'],
    genres: ['News'],
    ...stationLogos['polish_radio_london'],
    url: 'https://stream.rcs.revma.com/prfmwmwy768uv',
    color: '#E50914',

    description: 'Polish Radio London • News • Culture • Community',
  },
  {
    id: 'radio-bielsko',
    name: 'Radio Bielsko',
    countryCode: 'PL',
    languageCodes: ['pl'],
    genres: ['News'],
    ...stationLogos['radio_bielsko'],
    url: 'https://stream.rcs.revma.com/062uq3z3kwzuv',
    color: '#E50914',

    description: 'Radio Bielsko • Local News • Weather • Regional Information',
  },
  {
    id: 'radio-eska',
    name: 'Radio Eska',
    countryCode: 'PL',
    languageCodes: ['pl'],
    genres: ['Dance'],
    ...stationLogos['radio_eska'],
    url: 'https://ic1.smcdn.pl/2330-1.mp3',
    color: '#E50914',

    description: 'Radio Eska • Dance • Top 40 • Polish Hits',
  },
  {
    id: 'rmf-maxx',
    name: 'RMF MAXX',
    countryCode: 'PL',
    languageCodes: ['pl'],
    genres: ['Dance'],
    ...stationLogos['rmf_maxx'],
    url: 'https://rs201-krk.rmfstream.pl/rmf_maxxx',
    color: '#E50914',

    description: 'RMF MAXX • Dance • Electronic • Party Music',
  },
  // Publisher-sourced Deutschlandradio streams: see docs/station-sources.md.
  {
    id: 'deutschlandfunk',
    name: 'Deutschlandfunk',
    countryCode: 'DE',
    languageCodes: ['de'],
    genres: ['News', 'Talk'],
    url: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3?aggregator=web',
    // Official 96 kb/s AAC alternative; see docs/station-sources.md.
    fallbackUrls: ['https://st01.sslstream.dlf.de/dlf/01/mid/aac/stream.aac?aggregator=web'],
    homepage: 'https://www.deutschlandfunk.de/',
    sourceUrl: 'https://www.deutschlandradio.de/streamingdienste-100.html',
    description: 'German public radio: news, current affairs and discussion.',
  },
  {
    id: 'deutschlandfunk-kultur',
    name: 'Deutschlandfunk Kultur',
    countryCode: 'DE',
    languageCodes: ['de'],
    genres: ['Culture', 'Classical'],
    url: 'https://st02.sslstream.dlf.de/dlf/02/128/mp3/stream.mp3?aggregator=web',
    // Official 96 kb/s AAC alternative; see docs/station-sources.md.
    fallbackUrls: ['https://st02.sslstream.dlf.de/dlf/02/mid/aac/stream.aac?aggregator=web'],
    homepage: 'https://www.deutschlandfunkkultur.de/',
    sourceUrl: 'https://www.deutschlandradio.de/streamingdienste-100.html',
    description: 'German public radio with arts, culture and music.',
  },
  {
    id: 'deutschlandfunk-nova',
    name: 'Deutschlandfunk Nova',
    countryCode: 'DE',
    languageCodes: ['de'],
    genres: ['Alternative', 'Talk'],
    url: 'https://st03.sslstream.dlf.de/dlf/03/128/mp3/stream.mp3?aggregator=web',
    // Official 96 kb/s AAC alternative; see docs/station-sources.md.
    fallbackUrls: ['https://st03.sslstream.dlf.de/dlf/03/mid/aac/stream.aac?aggregator=web'],
    homepage: 'https://www.deutschlandfunknova.de/',
    sourceUrl: 'https://www.deutschlandradio.de/streamingdienste-100.html',
    description: 'German public radio with knowledge, conversation and alternative music.',
  },
];
