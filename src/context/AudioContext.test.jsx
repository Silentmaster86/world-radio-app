import { StrictMode, act } from 'react';
import { AudioProvider, useAudio } from './AudioContext';
import { FakeAudio } from '../test/FakeAudio';
import { render } from '../test/render';

function Harness({ label = 'player' }) {
  const player = useAudio();
  return <>
    <output>{JSON.stringify({ status: player.status, id: player.currentStation?.id, volume: player.volume, muted: player.muted })}</output>
    <button id="play" onClick={player.togglePlay}>{label}</button>
    <button id="next" onClick={player.nextStation}>Next</button>
  </>;
}
let audios;
beforeEach(() => {
  localStorage.clear();
  audios = [];
  jest.spyOn(window, 'Audio').mockImplementation(() => {
    const audio = new FakeAudio(); audios.push(audio); return audio;
  });
});
afterEach(() => jest.restoreAllMocks());

test('rerenders share one audio instance and teardown releases it', async () => {
  const page = render(<AudioProvider><Harness /></AudioProvider>);
  expect(audios).toHaveLength(1);
  expect(audios[0].src).toBe('');
  await act(async () => page.container.querySelector('#play').click());
  page.rerender(<AudioProvider><Harness label="updated" /></AudioProvider>);
  expect(audios).toHaveLength(1);
  expect(page.container.querySelector('output').textContent).toContain('playing');
  page.unmount();
  expect(audios[0].src).toBe('');
});

test('StrictMode cleans up its first controller before creating the next', async () => {
  const page = render(<StrictMode><AudioProvider><Harness /></AudioProvider></StrictMode>);
  expect(audios).toHaveLength(2);
  expect(audios.every((audio) => !audio.src && !audio.play.mock.calls.length)).toBe(true);
  await act(async () => page.container.querySelector('#play').click());
  expect(audios[0].src).toBe('');
  expect(audios[1].play).toHaveBeenCalledTimes(1);
  page.unmount();
  expect(audios.every((audio) => !audio.src)).toBe(true);
});

test('online events cannot start audio without a playback request', () => {
  render(<AudioProvider><Harness /></AudioProvider>);
  act(() => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
  });
  expect(audios[0].play).not.toHaveBeenCalled();
});

test('a rejected start is exposed as an error rather than a playing state', async () => {
  const page = render(<AudioProvider><Harness /></AudioProvider>);
  audios[0].play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  await act(async () => page.container.querySelector('#play').click());
  expect(JSON.parse(page.container.querySelector('output').textContent).status).toBe('error');
});
