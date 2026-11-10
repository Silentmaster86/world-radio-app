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
  const { addStation, stations, storageIssue } = useStations();
  const audio = useAudio();
  return (
    <>
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
