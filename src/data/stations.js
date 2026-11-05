import capitalDance from '../assets/logos/capital_dance.png';
import capitalFM from '../assets/logos/capital.png';
import heartUK from '../assets/logos/heart_uk.png';
import radioX from '../assets/logos/radio_X.png';
import prChicago from '../assets/logos/pr_chicago.png';
import prl from '../assets/logos/polish_radio_london.png';
import radioBielsko from '../assets/logos/radio_bielsko.png';
import radioEska from '../assets/logos/radio_eska.png';
import rmfMaxx from '../assets/logos/rmf_maxx.png';

export const stations = [
	{
		id: 'capital-dance',
		name: 'Capital Dance',
		countryCode: 'GB',
		languageCodes: ['en'],
		genres: ['Dance'],
		logo: capitalDance,
		url: 'https://media-ice.musicradio.com/CapitalDance',
		color: '#4c4949',

		description:
			'Capital Dance • Dance Anthems • Club Classics • Non-stop Dance Music',
	},
	{
		id: 'capital-fm',
		name: 'Capital FM',
		countryCode: 'GB',
		languageCodes: ['en'],
		genres: ['Dance'],
		logo: capitalFM,
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
		logo: heartUK,
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
		logo: radioX,
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
		logo: prChicago,
		url: 'https://s1.reliastream.com/proxy/polskieradio?mp=/stream',
		color: '#E50914',

		description: 'Polish Radio Chicago • News • Community • Polish News',
	},
	{
		id: 'prl',
		name: 'PRL',
		countryCode: 'GB',
		languageCodes: ['pl'],
		genres: ['News'],
		logo: prl,
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
		logo: radioBielsko,
		url: 'https://stream.rcs.revma.com/062uq3z3kwzuv',
		color: '#E50914',

		description:
			'Radio Bielsko • Local News • Weather • Regional Information',
	},
	{
		id: 'radio-eska',
		name: 'Radio Eska',
		countryCode: 'PL',
		languageCodes: ['pl'],
		genres: ['Dance'],
		logo: radioEska,
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
		logo: rmfMaxx,
		url: 'https://rs201-krk.rmfstream.pl/rmf_maxxx',
		color: '#E50914',

		description: 'RMF MAXX • Dance • Electronic • Party Music',
	},
];
