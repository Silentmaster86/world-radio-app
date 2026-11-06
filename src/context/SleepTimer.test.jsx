import { act } from 'react';
import { AudioProvider, useAudio } from './AudioContext';
import { render } from '../test/render';
import { FakeAudio } from '../test/FakeAudio';

function Probe() {
  const player = useAudio();
  return (
    <>
      <span data-status>{player.status}</span>
      <span data-deadline>{String(player.sleepTimerDeadline)}</span>
      <button id="play" onClick={player.play}>
        Play
      </button>
      <button id="pause" onClick={player.pause}>
        Pause
      </button>
      <button id="toggle" onClick={player.togglePlay}>
        Toggle
      </button>
      <button id="timer" onClick={() => player.setSleepTimer(15)}>
        Timer
      </button>
      <button id="cancel" onClick={player.cancelSleepTimer}>
        Cancel
      </button>
      <button id="station" onClick={() => player.selectStation('heart-uk')}>
        Station
      </button>
    </>
  );
}
const mount = () =>
  render(
    <AudioProvider>
      <Probe />
    </AudioProvider>,
  );
const clickAsync = async (page, selector) =>
  act(async () => page.container.querySelector(selector).click());

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  localStorage.clear();
  jest.spyOn(window, 'Audio').mockImplementation(() => new FakeAudio());
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('setting a timer does not autoplay and expiry pauses the shared player after station changes', async () => {
  const page = mount();
  const audio = window.Audio.mock.results[0].value;
  page.click('#timer');
  expect(audio.play).not.toHaveBeenCalled();
  expect(audio.src).toBe('');
  const deadline = page.container.querySelector('[data-deadline]').textContent;
  await clickAsync(page, '#play');
  await clickAsync(page, '#station');
  expect(page.container.querySelector('[data-deadline]').textContent).toBe(deadline);
  act(() => jest.advanceTimersByTime(15 * 60_000));
  expect(page.container.querySelector('[data-status]').textContent).toBe('paused');
  expect(audio.src).toBe('');
  expect(page.container.querySelector('[data-deadline]').textContent).toBe('null');
  expect(window.Audio).toHaveBeenCalledTimes(1);
});

test('manual pause cancels the timer; cancellation alone leaves playback running', async () => {
  const page = mount();
  await clickAsync(page, '#play');
  page.click('#timer');
  page.click('#cancel');
  expect(page.container.querySelector('[data-status]').textContent).toBe('playing');
  page.click('#timer');
  page.click('#toggle');
  expect(page.container.querySelector('[data-deadline]').textContent).toBe('null');
  await clickAsync(page, '#play');
  act(() => jest.advanceTimersByTime(20 * 60_000));
  expect(page.container.querySelector('[data-status]').textContent).toBe('playing');
});

test('returning to a suspended page enforces an overdue deadline', async () => {
  const page = mount();
  await clickAsync(page, '#play');
  page.click('#timer');
  act(() => {
    jest.setSystemTime(Date.now() + 16 * 60_000);
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(page.container.querySelector('[data-status]').textContent).toBe('paused');
});

test('system media pause cancels the shared timer', async () => {
  const previous = Object.getOwnPropertyDescriptor(navigator, 'mediaSession');
  const handlers = {};
  Object.defineProperty(navigator, 'mediaSession', {
    configurable: true,
    value: {
      setActionHandler: (name, handler) => {
        handlers[name] = handler;
      },
    },
  });
  let page;
  try {
    page = mount();
    await clickAsync(page, '#play');
    page.click('#timer');
    act(() => handlers.pause());
    expect(page.container.querySelector('[data-status]').textContent).toBe('paused');
    expect(page.container.querySelector('[data-deadline]').textContent).toBe('null');
  } finally {
    page?.unmount();
    if (previous) Object.defineProperty(navigator, 'mediaSession', previous);
    else delete navigator.mediaSession;
  }
});

test('expiry while offline prevents reconnection from restarting playback', async () => {
  const page = mount();
  await clickAsync(page, '#play');
  const audio = window.Audio.mock.results[0].value;
  page.click('#timer');
  act(() => window.dispatchEvent(new Event('offline')));
  act(() => jest.advanceTimersByTime(15 * 60_000));
  const plays = audio.play.mock.calls.length;
  act(() => window.dispatchEvent(new Event('online')));
  expect(audio.play).toHaveBeenCalledTimes(plays);
  expect(page.container.querySelector('[data-deadline]').textContent).toBe('null');
});

test('the timer is session-only and disposal cannot pause a later player', async () => {
  let page = mount();
  await clickAsync(page, '#play');
  page.click('#timer');
  page.unmount();
  page = mount();
  const audio = window.Audio.mock.results[1].value;
  expect(page.container.querySelector('[data-deadline]').textContent).toBe('null');
  expect(audio.play).not.toHaveBeenCalled();
  await clickAsync(page, '#play');
  act(() => jest.advanceTimersByTime(20 * 60_000));
  expect(page.container.querySelector('[data-status]').textContent).toBe('playing');
});
