// Stable artwork color only; this never changes station identity or playback.
export function stationHue(id = '') {
  return [...id].reduce((hue, character) => (hue * 31 + character.charCodeAt(0)) % 360, 0);
}
