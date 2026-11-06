import { StrictMode, act } from 'react';
import { AudioProvider, useAudio } from './AudioContext';
import { FakeAudio } from '../test/FakeAudio';
import { render } from '../test/render';
import { PLAYER_KEY } from '../lib/playerPreferences';

function Harness({ label = 'player' }) {
  const player = useAudio();
  return (
    <>
      <output>
        {JSON.stringify({
          status: player.status,
          id: player.currentStation?.id,
          volume: player.volume,
          muted: player.muted,
          preferenceMessage: player.preferenceMessage,
        })}
      </output>
      <button id="play" onClick={player.togglePlay}>
        {label}
      </button>
      <button id="next" onClick={player.nextStation}>
        Next
      </button>
      <button id="volume" onClick={() => player.changeVolume(0.35)}>
        Volume
      </button>
      <button id="mute" onClick={player.toggleMute}>
        Mute
      </button>
    </>
  );
}
let audios;
beforeEach(() => {
  localStorage.clear();
  audios = [];
  jest.spyOn(window, 'Audio').mockImplementation(() => {
    const audio = new FakeAudio();
    audios.push(audio);
    return audio;
  });
});
afterEach(() => jest.restoreAllMocks());

test('rerenders share one audio instance and teardown releases it', async () => {
  const page = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  expect(audios).toHaveLength(1);
  expect(audios[0].src).toBe('');
  await act(async () => page.container.querySelector('#play').click());
  page.rerender(
    <AudioProvider>
      <Harness label="updated" />
    </AudioProvider>,
  );
  expect(audios).toHaveLength(1);
  expect(page.container.querySelector('output').textContent).toContain('playing');
  page.unmount();
  expect(audios[0].src).toBe('');
});

test('StrictMode cleans up its first controller before creating the next', async () => {
  const page = render(
    <StrictMode>
      <AudioProvider>
        <Harness />
      </AudioProvider>
    </StrictMode>,
  );
  expect(audios).toHaveLength(2);
  expect(audios.every((audio) => !audio.src && !audio.play.mock.calls.length)).toBe(true);
  await act(async () => page.container.querySelector('#play').click());
  expect(audios[0].src).toBe('');
  expect(audios[1].play).toHaveBeenCalledTimes(1);
  page.unmount();
  expect(audios.every((audio) => !audio.src)).toBe(true);
});

test('online events cannot start audio without a playback request', () => {
  render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  act(() => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
  expect(audios[0].play).not.toHaveBeenCalled();
});

test('a rejected start is exposed as an error rather than a playing state', async () => {
  const page = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  audios[0].play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  await act(async () => page.container.querySelector('#play').click());
  expect(JSON.parse(page.container.querySelector('output').textContent).status).toBe('error');
});

test('restores saved settings with no autoplay or stream preload', () => {
  localStorage.setItem(
    PLAYER_KEY,
    '{"version":1,"stationId":"heart-uk","volume":0.35,"muted":true}',
  );
  const page = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  expect(JSON.parse(page.container.querySelector('output').textContent)).toMatchObject({
    id: 'heart-uk',
    volume: 0.35,
    muted: true,
    status: 'idle',
  });
  expect(audios[0].src).toBe('');
  expect(audios[0].play).not.toHaveBeenCalled();
});

test('persists selection and settings, then restores them without starting audio', async () => {
  const page = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  await act(async () => page.container.querySelector('#next').click());
  page.click('#volume');
  page.click('#mute');
  expect(JSON.parse(localStorage.getItem(PLAYER_KEY))).toEqual({
    version: 1,
    stationId: 'capital-fm',
    volume: 0.35,
    muted: true,
  });
  page.unmount();
  const restored = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  expect(JSON.parse(restored.container.querySelector('output').textContent)).toMatchObject({
    id: 'capital-fm',
    volume: 0.35,
    muted: true,
    status: 'idle',
  });
  expect(audios[1].play).not.toHaveBeenCalled();
});

test('keeps settings usable in memory if saving fails', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Full');
  });
  const page = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  page.click('#volume');
  expect(JSON.parse(page.container.querySelector('output').textContent)).toMatchObject({
    volume: 0.35,
    preferenceMessage: expect.stringContaining('session'),
  });
});

test('does not overwrite future preference schemas when the user changes volume', () => {
  const raw = '{"version":2,"stationId":"heart-uk","volume":0.2}';
  localStorage.setItem(PLAYER_KEY, raw);
  const page = render(
    <AudioProvider>
      <Harness />
    </AudioProvider>,
  );
  page.click('#volume');
  expect(localStorage.getItem(PLAYER_KEY)).toBe(raw);
});
