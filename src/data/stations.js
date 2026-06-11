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
		name: 'Capital Dance',
		country: 'UK',
		genre: 'Dance',
		logo: capitalDance,
		url: 'https://media-ice.musicradio.com/CapitalDance',
		color: '#4c4949',

		ticker:
			'LIVE • Capital Dance • Dance Anthems • Club Classics • Non-stop Dance Music',
	},
	{
		name: 'Capital FM',
		country: 'UK',
		genre: 'Dance',
		logo: capitalFM,
		url: 'https://media-ice.musicradio.com/CapitalMP3',
		color: '#ada8a8',

		ticker: "LIVE • Capital FM • Today's Biggest Hits • UK Top Charts",
	},
	{
		name: 'Heart UK',
		country: 'UK',
		genre: 'Pop',
		logo: heartUK,
		url: 'https://media-ice.musicradio.com/HeartUK',
		color: '#8e4f52',

		ticker: 'LIVE • Heart UK • Feel Good Music • Pop • Chart Hits',
	},
	{
		name: 'RADIOx 90s',
		country: 'UK',
		genre: 'Pop',
		logo: radioX,
		url: 'https://media-ice.musicradio.com/RadioX90s',
		color: '#E50914',

		ticker: 'LIVE • RADIOx 90s • Best Of The 90s • Britpop • Rock Classics',
	},
	{
		name: 'PR Chicago',
		country: 'UK',
		genre: 'News',
		logo: prChicago,
		url: 'https://s1.reliastream.com/proxy/polskieradio?mp=/stream',
		color: '#E50914',

		ticker: 'LIVE • Polish Radio Chicago • News • Community • Polish News',
	},
	{
		name: 'PRL',
		country: 'UK',
		genre: 'News',
		logo: prl,
		url: 'https://stream.rcs.revma.com/prfmwmwy768uv',
		color: '#E50914',

		ticker: 'LIVE • Polish Radio London • News • Culture • Community',
	},
	{
		name: 'Radio Bielsko',
		country: 'PL',
		genre: 'News',
		logo: radioBielsko,
		url: 'https://stream.rcs.revma.com/062uq3z3kwzuv',
		color: '#E50914',

		ticker:
			'LIVE • Radio Bielsko • Local News • Weather • Regional Information',
	},
	{
		name: 'Radio Eska',
		country: 'PL',
		genre: 'Dance',
		logo: radioEska,
		url: 'https://ic1.smcdn.pl/2330-1.mp3',
		color: '#E50914',

		ticker: 'LIVE • Radio Eska • Dance • Top 40 • Polish Hits',
	},
	{
		name: 'RMF MAXX',
		country: 'PL',
		genre: 'Dance',
		logo: rmfMaxx,
		url: 'https://rs201-krk.rmfstream.pl/rmf_maxxx',
		color: '#E50914',

		ticker: 'LIVE • RMF MAXX • Dance • Electronic • Party Music',
	},
];
