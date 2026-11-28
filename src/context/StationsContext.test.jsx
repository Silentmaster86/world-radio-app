import { act } from 'react';
import { StationsProvider, useStations } from './StationsContext';
import { AudioProvider, useAudio } from './AudioContext';
import { render } from '../test/render';
import { FakeAudio } from '../test/FakeAudio';
import { ADDED_KEY } from '../lib/addedStations';
const row = {
  stationuuid: '12345678-1234-1234-1234-123456789abc',
  name: 'World Jazz',
  url: 'https://radio.example/live',
};
function Probe() {
  const { addStation, removeStation, stations, storageIssue } = useStations();
  const audio = useAudio();
  return (
    <>
      <button data-remove onClick={() => removeStation('rb-' + row.stationuuid)}>
        Remove
      </button>
      <button data-remove-curated onClick={() => removeStation('capital-dance')}>
        Remove curated
      </button>
      <button data-add onClick={() => addStation(row)}>
        Add
      </button>
      <button data-play onClick={() => audio.selectStation('capital-dance')}>
        Play
      </button>
      <button data-timer onClick={() => audio.setSleepTimer(30)}>
        Timer
      </button>
      <p
        data-current={audio.currentStation.id}
        data-state={audio.status}
        data-deadline={audio.sleepTimerDeadline}
        data-issue={storageIssue}
      >
        {stations.length}
      </p>
    </>
  );
}
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, 'Audio').mockImplementation(() => new FakeAudio());
});
afterEach(() => jest.restoreAllMocks());
const mount = () =>
  render(
    <StationsProvider>
      <AudioProvider>
        <Probe />
      </AudioProvider>
    </StationsProvider>,
  );
test('adding during playback keeps the audio instance, active stream and sleep timer', async () => {
  const page = mount();
  await act(async () => page.container.querySelector('[data-play]').click());
  page.click('[data-timer]');
  const deadline = page.container.querySelector('p').dataset.deadline;
  const audio = window.Audio.mock.results[0].value;
  const pauses = audio.pause.mock.calls.length;
  const source = audio.src;
  page.click('[data-add]');
  page.click('[data-add]');
  expect(window.Audio).toHaveBeenCalledTimes(1);
  expect(audio.pause).toHaveBeenCalledTimes(pauses);
  expect(audio.src).toBe(source);
  expect(page.container.querySelector('p').dataset.state).toBe('playing');
  expect(page.container.querySelector('p').dataset.deadline).toBe(deadline);
  expect(JSON.parse(localStorage.getItem(ADDED_KEY)).stations).toHaveLength(1);
});
test('future station storage is preserved while session additions remain usable', () => {
  const raw = '{"version":8,"entries":["keep"]}';
  localStorage.setItem(ADDED_KEY, raw);
  const page = mount();
  const count = Number(page.container.querySelector('p').textContent);
  page.click('[data-add]');
  expect(localStorage.getItem(ADDED_KEY)).toBe(raw);
  expect(Number(page.container.querySelector('p').textContent)).toBe(count + 1);
  expect(page.container.querySelector('p').dataset.issue).toBe('true');
});

test('curated stations and future-schema storage cannot be deleted', () => {
  const raw = '{"version":8,"keep":true}';
  localStorage.setItem(ADDED_KEY, raw);
  const page = mount(),
    count = Number(page.container.querySelector('p').textContent);
  page.click('[data-add]');
  page.click('[data-remove]');
  page.click('[data-remove-curated]');
  expect(Number(page.container.querySelector('p').textContent)).toBe(count + 1);
  expect(localStorage.getItem(ADDED_KEY)).toBe(raw);
});

test('two tabs add without overwriting one another and external deletion does not resurrect', () => {
  const first = mount();
  const otherRow = {
    ...row,
    stationuuid: '23456789-1234-1234-1234-123456789abc',
    name: 'Second station',
    url: 'https://radio.example/second',
  };
  function Second() {
    const api = useStations();
    return (
      <button data-second onClick={() => api.addStation(otherRow)}>
        Add second
      </button>
    );
  }
  const second = render(
    <StationsProvider>
      <Second />
    </StationsProvider>,
  );
  first.click('[data-add]');
  second.click('[data-second]');
  expect(JSON.parse(localStorage.getItem(ADDED_KEY)).stations.map((s) => s.name)).toEqual([
    'World Jazz',
    'Second station',
  ]);
  first.click('[data-remove]');
  second.click('[data-second]');
  expect(JSON.parse(localStorage.getItem(ADDED_KEY)).stations.map((s) => s.name)).toEqual([
    'Second station',
  ]);
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: ADDED_KEY })));
  expect(first.container.querySelector('p').textContent).toBe('13');
});

test('unavailable storage is reported before adding and external deletion stops selected playback', async () => {
  localStorage.setItem(
    ADDED_KEY,
    JSON.stringify({
      version: 1,
      stations: [{ directoryId: row.stationuuid, name: row.name, url: row.url }],
    }),
  );
  const page = mount();
  function Selection() {
    const a = useAudio();
    return (
      <button data-selected-play onClick={() => a.selectStation('rb-' + row.stationuuid)}>
        Play
      </button>
    );
  }
  page.unmount();
  const playing = render(
    <StationsProvider>
      <AudioProvider>
        <Probe />
        <Selection />
      </AudioProvider>
    </StationsProvider>,
  );
  await act(async () => playing.container.querySelector('[data-selected-play]').click());
  localStorage.setItem(ADDED_KEY, JSON.stringify({ version: 1, stations: [] }));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: ADDED_KEY })));
  expect(playing.container.querySelector('[data-state]').dataset.state).toBe('idle');
  expect(window.Audio.mock.results.at(-1).value.src).toBe('');
  playing.unmount();
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(mount().container.querySelector('[data-issue]').dataset.issue).toBe('true');
});
