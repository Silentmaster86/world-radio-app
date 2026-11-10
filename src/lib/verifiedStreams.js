// Exact publisher-owned BBC media endpoints checked over HTTPS; never upgrade
// arbitrary insecure directory URLs. See docs/hls.md for evidence and limits.
const base =
  'as-hls-ww-live.akamaized.net/pool_01505109/live/ww/bbc_radio_one/bbc_radio_one.isml/bbc_radio_one-audio%3d';
const master =
  'http://a.files.bbci.co.uk/ms6/live/3441A116-B12E-4D2F-ACA8-C1984642FA4B/audio/simulcast/hls/nonuk/pc_hd_abr_v2/ak/bbc_radio_one.m3u8';
const verified = {
  'a740cc4c-9563-4fbe-a13f-e7f9e89b7441': [
    'http://' + base + '128000.norewind.m3u8',
    'https://' + base + '128000.norewind.m3u8',
  ],
  '3560176e-8f9a-4659-9279-6b65d15a0009': [
    'http://' + base + '320000.norewind.m3u8',
    'https://' + base + '320000.norewind.m3u8',
  ],
  'f30d2b8b-7206-48ae-a83d-d0145ae18468': [master, 'https://' + base + '128000.norewind.m3u8'],
};
export function verifiedStreamUrl(row) {
  const url = row.url_resolved || row.url;
  const match = verified[String(row.stationuuid || '').toLowerCase()];
  return match && url === match[0] ? match[1] : url;
}
