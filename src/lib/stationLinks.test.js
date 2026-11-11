import { shareStation, stationLink } from './stationLinks';
const station = { id: 'capital-dance', name: 'Capital Dance' };
test('links use a stable ID on the current app origin and do not include stream URLs or filters', () => {
  expect(stationLink(station, 'https://radio.example')).toBe(
    'https://radio.example/station/capital-dance',
  );
  for (const id of ['../secret', 'foo/bar', 'a?url=bad', '', undefined])
    expect(() => stationLink({ id })).toThrow('invalid');
});
test('native share success and cancellation do not copy a link unexpectedly', async () => {
  const nav = { share: jest.fn().mockResolvedValue(), clipboard: { writeText: jest.fn() } };
  expect(await shareStation(station, nav, 'https://radio.example')).toBe('shared');
  expect(nav.share).toHaveBeenCalledWith({
    title: station.name,
    url: 'https://radio.example/station/capital-dance',
  });
  nav.share.mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
  expect(await shareStation(station, nav)).toBe('cancelled');
  expect(nav.clipboard.writeText).not.toHaveBeenCalled();
});
test('clipboard fallback is offered after an unavailable native share, then manual copy on denial', async () => {
  const nav = {
    share: jest.fn().mockRejectedValue(Error('unsupported')),
    clipboard: { writeText: jest.fn().mockResolvedValue() },
  };
  expect(await shareStation(station, nav)).toBe('copied');
  nav.clipboard.writeText.mockRejectedValue(Error('denied'));
  expect(await shareStation(station, nav)).toBe('manual');
  expect(await shareStation(station, {})).toBe('manual');
});
