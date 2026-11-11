export function stationLink(station, origin = window.location.origin) {
  if (!/^[a-z0-9-]{1,128}$/.test(station?.id || '')) throw new Error('invalid');
  return new URL('/station/' + encodeURIComponent(station.id), origin).href;
}
export async function shareStation(station, nav = navigator, origin) {
  const url = stationLink(station, origin);
  if (nav.share) {
    try {
      await nav.share({ title: station.name, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    if (nav.clipboard?.writeText) {
      await nav.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    /* Offer a selectable link below. */
  }
  return 'manual';
}
