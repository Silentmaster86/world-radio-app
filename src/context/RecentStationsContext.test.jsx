import { act, StrictMode } from 'react';
import { useAudio } from './AudioContext';
import { RecentStationsProvider, useRecentStations } from './RecentStationsContext';
import { RECENT_KEY } from '../lib/recentStorage';
import { render } from '../test/render';

jest.mock('./AudioContext', () => ({ useAudio: jest.fn() }));

function Probe() {
  const history = useRecentStations();
  return (
    <>
      <p data-ids>{history.recentIds.join(',')}</p>
      <p data-message>{history.historyMessage}</p>
      <button onClick={history.clearHistory}>Clear</button>
    </>
  );
}
const view = () => (
  <RecentStationsProvider>
    <Probe />
  </RecentStationsProvider>
);
function update(page, snapshot) {
  useAudio.mockReturnValue(snapshot);
  page.rerender(view());
}
const playing = (id) => ({ status: 'playing', wantsToPlay: true, playingStationId: id });

beforeEach(() => {
  localStorage.clear();
  useAudio.mockReturnValue({ status: 'idle', wantsToPlay: false, playingStationId: null });
});
afterEach(() => jest.restoreAllMocks());

test('selection, connecting and failed starts do not enter history', () => {
  const page = render(view());
  update(page, {
    status: 'connecting',
    wantsToPlay: true,
    selectedStationId: 'heart-uk',
    playingStationId: null,
  });
  update(page, {
    status: 'error',
    wantsToPlay: false,
    selectedStationId: 'heart-uk',
    playingStationId: null,
  });
  expect(page.container.querySelector('[data-ids]').textContent).toBe('');
  expect(localStorage.getItem(RECENT_KEY)).toBeNull();
});

test('confirmed playback records the playing ID, deduplicates and orders by recency', () => {
  const page = render(view());
  update(page, { ...playing('capital-dance'), selectedStationId: 'heart-uk' });
  update(page, playing('heart-uk'));
  update(page, playing('capital-dance'));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('capital-dance,heart-uk');
  expect(JSON.parse(localStorage.getItem(RECENT_KEY)).stationIds).toEqual([
    'capital-dance',
    'heart-uk',
  ]);
});

test('clearing while playing stays empty through buffering; a new play session can add the station again', () => {
  const page = render(view());
  update(page, playing('heart-uk'));
  page.click('button');
  update(page, { ...playing('heart-uk'), status: 'buffering' });
  update(page, playing('heart-uk'));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('');
  update(page, { status: 'paused', wantsToPlay: false, playingStationId: null });
  update(page, playing('heart-uk'));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('heart-uk');
});

test('storage failures retain usable in-memory history and explain session-only behavior', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Quota');
  });
  const page = render(view());
  update(page, playing('heart-uk'));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('heart-uk');
  expect(page.container.querySelector('[data-message]').textContent).toContain('session only');
});

test('recording and clearing never overwrite a future schema', () => {
  const raw = '{"version":8,"entries":["preserve-me"]}';
  localStorage.setItem(RECENT_KEY, raw);
  const page = render(view());
  update(page, playing('heart-uk'));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('heart-uk');
  page.click('button');
  expect(localStorage.getItem(RECENT_KEY)).toBe(raw);
  expect(page.container.querySelector('[data-message]').textContent).toContain('newer format');
});

test('other-window storage changes and clearing synchronize without creating playback', () => {
  const page = render(view());
  localStorage.setItem(RECENT_KEY, '{"version":1,"stationIds":["prl"]}');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: RECENT_KEY })));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('prl');
  localStorage.removeItem(RECENT_KEY);
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
  expect(page.container.querySelector('[data-ids]').textContent).toBe('');
});

test('StrictMode does not duplicate a playback write', () => {
  useAudio.mockReturnValue(playing('heart-uk'));
  const write = jest.spyOn(Storage.prototype, 'setItem');
  render(<StrictMode>{view()}</StrictMode>);
  expect(write).toHaveBeenCalledTimes(1);
});
