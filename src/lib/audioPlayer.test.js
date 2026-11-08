import { createAudioPlayer, getStationStreamUrls } from './audioPlayer';
import { FakeAudio, deferred } from '../test/FakeAudio';

const stations = ['first', 'second', 'third'].map((id) => ({
  id,
  name: id,
  url: `https://radio.example/${id}`,
}));
let players;
function setup(options = {}) {
  const audio = options.audio || new FakeAudio();
  const createAudio = jest.fn(() => audio);
  const player = createAudioPlayer({
    stations,
    createAudio,
    connectionTimeoutMs: 100,
    retryDelays: [10, 20, 30],
    ...options,
  });
  players.push(player);
  return { audio, player, createAudio };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  jest.useFakeTimers();
  players = [];
});
afterEach(() => {
  players.forEach((player) => player.dispose());
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});

test('constructs one source-free audio element and does not preload a station', () => {
  const { audio, player, createAudio } = setup();
  expect(createAudio).toHaveBeenCalledTimes(1);
  expect(audio.src).toBe('');
  expect(audio.preload).toBe('none');
  expect(audio.play).not.toHaveBeenCalled();
  expect(player.getSnapshot()).toMatchObject({
    status: 'idle',
    wantsToPlay: false,
    selectedStationId: 'first',
    playingStationId: null,
  });
});

test('confirms playback from the real audio state and releases the stream on pause', async () => {
  const { audio, player } = setup();
  expect(await player.play()).toBe(true);
  expect(player.getSnapshot()).toMatchObject({ status: 'playing', playingStationId: 'first' });
  player.pause();
  expect(player.getSnapshot()).toMatchObject({
    status: 'paused',
    wantsToPlay: false,
    playingStationId: null,
  });
  expect(audio.src).toBe('');
  expect(await player.play()).toBe(true);
  expect(audio.play).toHaveBeenCalledTimes(2);
});

test('retained-source pause keeps one paused media resource for system resume', async () => {
  const { audio, player } = setup();
  await player.play();
  const loads = audio.load.mock.calls.length;
  player.pause({ retainSource: true });
  expect(player.getSnapshot()).toMatchObject({
    status: 'paused',
    wantsToPlay: false,
    playingStationId: null,
  });
  expect(audio.paused).toBe(true);
  expect(audio.src).toBe(stations[0].url);
  expect(audio.load).toHaveBeenCalledTimes(loads);
  await player.play();
  expect(player.getSnapshot().status).toBe('playing');
  expect(audio.play).toHaveBeenCalledTimes(2);
});

test('retained-source pause still releases an unconfirmed connection', async () => {
  const { audio, player } = setup();
  const pending = deferred();
  audio.play.mockImplementation(() => pending.promise);
  const outcome = player.play();
  player.pause({ retainSource: true });
  expect(await outcome).toBe(false);
  expect(audio.src).toBe('');
  pending.resolve();
  await flush();
  expect(player.getSnapshot().wantsToPlay).toBe(false);
});

test('accepts only unique secure backup URLs while preserving the primary URL', () => {
  const source = {
    url: 'https://radio.example/main',
    fallbackUrls: [
      'https://radio.example/backup',
      'https://radio.example/backup',
      'http://radio.example/insecure',
      'https://user:pass@radio.example/private',
      'not a URL',
    ],
  };
  expect(getStationStreamUrls(source)).toEqual([
    'https://radio.example/main',
    'https://radio.example/backup',
  ]);
});

test('switches to a backup URL after a recoverable failure without changing station', async () => {
  const audio = new FakeAudio();
  audio.play.mockRejectedValueOnce(new Error('Network unavailable'));
  const backupStation = {
    ...stations[0],
    fallbackUrls: ['https://radio.example/first-backup'],
  };
  const { player, createAudio } = setup({ audio, stations: [backupStation] });
  expect(await player.play()).toBe(false);
  expect(player.getSnapshot()).toMatchObject({
    status: 'connecting',
    selectedStationId: 'first',
    streamSourceIndex: 1,
    retryAttempt: 1,
    wantsToPlay: true,
  });
  jest.advanceTimersByTime(10);
  await flush();
  expect(player.getSnapshot()).toMatchObject({
    status: 'playing',
    playingStationId: 'first',
    streamSourceIndex: 1,
  });
  expect(audio.src).toBe('https://radio.example/first-backup');
  expect(createAudio).toHaveBeenCalledTimes(1);
});

test('does not switch on unrecoverable codec or autoplay errors', async () => {
  const audio = new FakeAudio();
  audio.play.mockRejectedValueOnce(new DOMException('Unsupported', 'NotSupportedError'));
  const { player } = setup({
    audio,
    stations: [{ ...stations[0], fallbackUrls: ['https://radio.example/backup'] }],
  });
  expect(await player.play()).toBe(false);
  jest.runAllTimers();
  expect(player.getSnapshot()).toMatchObject({
    status: 'error',
    streamSourceIndex: 0,
  });
  expect(audio.play).toHaveBeenCalledTimes(1);
});

test('pause during failover backoff cancels the backup and later retries', async () => {
  const audio = new FakeAudio();
  audio.play.mockRejectedValueOnce(new Error('Network unavailable'));
  const { player } = setup({
    audio,
    stations: [{ ...stations[0], fallbackUrls: ['https://radio.example/backup'] }],
  });
  expect(await player.play()).toBe(false);
  player.pause();
  jest.runAllTimers();
  expect(audio.play).toHaveBeenCalledTimes(1);
  expect(audio.src).toBe('');
  expect(player.getSnapshot()).toMatchObject({
    wantsToPlay: false,
    streamSourceIndex: 0,
  });
});

test('changing station while a backup is pending never starts the old backup', async () => {
  const audio = new FakeAudio();
  audio.play.mockRejectedValueOnce(new Error('Network unavailable'));
  const { player } = setup({
    audio,
    stations: [{ ...stations[0], fallbackUrls: ['https://radio.example/backup'] }, stations[1]],
  });
  expect(await player.play()).toBe(false);
  await player.selectStation('second');
  jest.runAllTimers();
  expect(player.getSnapshot()).toMatchObject({
    selectedStationId: 'second',
    playingStationId: 'second',
    streamSourceIndex: 0,
  });
  expect(audio.src).toBe(stations[1].url);
  expect(audio.play).toHaveBeenCalledTimes(2);
});

test('rapid next actions use the latest selection before play promises settle', async () => {
  const { audio, player, createAudio } = setup();
  const pending = [deferred(), deferred(), deferred()];
  pending.forEach((request) =>
    audio.play.mockImplementationOnce(() => {
      audio.paused = false;
      return request.promise;
    }),
  );
  const first = player.play();
  const second = player.nextStation();
  const third = player.nextStation();
  expect(player.getSnapshot().selectedStationId).toBe('third');
  expect(await first).toBe(false);
  expect(await second).toBe(false);
  audio.emit('playing', { paused: false, readyState: 4, currentSrc: stations[2].url });
  expect(await third).toBe(true);
  pending[0].reject(new Error('Late error'));
  pending[1].resolve();
  await flush();
  expect(player.getSnapshot()).toMatchObject({
    status: 'playing',
    selectedStationId: 'third',
    playingStationId: 'third',
    error: null,
  });
  expect(createAudio).toHaveBeenCalledTimes(1);
});

test('pause cancels a pending start and ignores its late success', async () => {
  const { audio, player } = setup();
  const pending = deferred();
  audio.play.mockImplementation(() => {
    audio.paused = false;
    return pending.promise;
  });
  const outcome = player.play();
  player.pause();
  expect(await outcome).toBe(false);
  pending.resolve();
  audio.emit('playing', { paused: false, readyState: 4 });
  await flush();
  expect(player.getSnapshot()).toMatchObject({ status: 'paused', wantsToPlay: false });
  expect(audio.src).toBe('');
});

test('does not label a resolved play promise as playing without playable data', async () => {
  const { audio, player } = setup({ retryDelays: [] });
  audio.play.mockImplementation(() => {
    audio.paused = false;
    return Promise.resolve();
  });
  const outcome = player.play();
  await flush();
  expect(player.getSnapshot().status).toBe('connecting');
  jest.advanceTimersByTime(100);
  expect(await outcome).toBe(false);
  expect(player.getSnapshot()).toMatchObject({
    status: 'error',
    error: { code: 'timeout' },
    wantsToPlay: false,
  });
});

test('limits connection attempts and leaves a useful terminal error', async () => {
  const { audio, player } = setup();
  audio.play.mockImplementation(() => {
    audio.paused = false;
    return new Promise(() => {});
  });
  const outcome = player.play();
  jest.runAllTimers();
  expect(await outcome).toBe(false);
  expect(audio.play).toHaveBeenCalledTimes(4);
  expect(player.getSnapshot()).toMatchObject({
    status: 'error',
    wantsToPlay: false,
    retryAttempt: 3,
  });
});

test.each(['NotAllowedError', 'NotSupportedError'])(
  'requires manual action for %s',
  async (name) => {
    const { audio, player } = setup();
    audio.play.mockRejectedValue(new DOMException('Rejected', name));
    expect(await player.play()).toBe(false);
    jest.runAllTimers();
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(player.getSnapshot()).toMatchObject({ status: 'error', wantsToPlay: false });
  },
);

test('manual retry starts a fresh attempt after a failure', async () => {
  const { audio, player } = setup();
  audio.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  expect(await player.play()).toBe(false);
  expect(await player.retry()).toBe(true);
  expect(player.getSnapshot()).toMatchObject({ status: 'playing', error: null, retryAttempt: 0 });
});

test('recognizes buffering and recovery without treating buffered stalled as failure', async () => {
  const { audio, player } = setup();
  await player.play();
  audio.emit('stalled');
  expect(player.getSnapshot().status).toBe('playing');
  audio.emit('waiting', { readyState: 2 });
  expect(player.getSnapshot().status).toBe('buffering');
  jest.advanceTimersByTime(90);
  audio.emit('playing', { readyState: 4 });
  jest.advanceTimersByTime(20);
  expect(player.getSnapshot().status).toBe('playing');
  expect(audio.play).toHaveBeenCalledTimes(1);
});

test('an ended stream reconnects within the same bounded retry budget', async () => {
  const { audio, player } = setup();
  await player.play();
  audio.emit('ended', { ended: true, paused: true });
  expect(player.getSnapshot()).toMatchObject({
    status: 'connecting',
    playingStationId: null,
    retryAttempt: 1,
  });
  jest.advanceTimersByTime(10);
  expect(audio.play).toHaveBeenCalledTimes(2);
  expect(player.getSnapshot().status).toBe('playing');
});

test('pause during backoff cancels reconnect and going online does not resume it', async () => {
  const { audio, player } = setup();
  await player.play();
  audio.emit('error', { error: { code: 2 } });
  player.pause();
  player.setOnline(false);
  player.setOnline(true);
  jest.runAllTimers();
  expect(audio.play).toHaveBeenCalledTimes(1);
  expect(player.getSnapshot().wantsToPlay).toBe(false);
});

test('offline start waits without opening a stream and resumes only while requested', async () => {
  const { audio, player } = setup({ initialOnline: false });
  expect(await player.play()).toBe(false);
  expect(audio.src).toBe('');
  expect(audio.play).not.toHaveBeenCalled();
  expect(player.getSnapshot()).toMatchObject({ status: 'buffering', wantsToPlay: true });
  player.setOnline(true);
  expect(player.getSnapshot().status).toBe('playing');
});

test('an external pause cancels the playback intention', async () => {
  const { audio, player } = setup();
  await player.play();
  audio.emit('pause', { paused: true });
  expect(player.getSnapshot()).toMatchObject({ status: 'paused', wantsToPlay: false });
});

test('ignores queued pause/playing/error events from a previous resource', async () => {
  const { audio, player } = setup();
  audio.play.mockImplementation(() => new Promise(() => {}));
  player.play();
  player.nextStation();
  audio.emit('pause', { paused: true });
  expect(player.getSnapshot().wantsToPlay).toBe(true);
  audio.emit('playing', { paused: false, readyState: 4, currentSrc: stations[0].url });
  expect(player.getSnapshot().status).toBe('connecting');
  audio.emit('error', { error: { code: 2 } });
  expect(player.getSnapshot().retryAttempt).toBe(0);
});

test('selecting a playing station again does not restart its stream', async () => {
  const { audio, player } = setup();
  await player.play();
  await player.selectStation('first');
  expect(audio.play).toHaveBeenCalledTimes(1);
});

test('station changes never publish a playing state for an unconfirmed station', async () => {
  const { audio, player } = setup();
  await player.play();
  const snapshots = [];
  player.subscribe((snapshot) => snapshots.push(snapshot));
  audio.play.mockImplementationOnce(() => new Promise(() => {}));
  player.nextStation();
  expect(
    snapshots.every(
      (snapshot) =>
        snapshot.status !== 'playing' || snapshot.playingStationId === snapshot.selectedStationId,
    ),
  ).toBe(true);
});

test('unknown stations and an empty catalog are safe', async () => {
  const { audio, player } = setup({ stations: [] });
  expect(await player.play()).toBe(false);
  expect(await player.nextStation()).toBe(false);
  expect(await player.selectStation('missing')).toBe(false);
  expect(audio.src).toBe('');
});

test('clamps volume, ignores NaN and synchronizes mute', () => {
  const { audio, player } = setup();
  player.setVolume(5);
  expect(audio.volume).toBe(1);
  player.setVolume(-1);
  player.setVolume(NaN);
  expect(audio.volume).toBe(0);
  player.toggleMute();
  expect(player.getSnapshot().muted).toBe(true);
});

test('detects platforms that do not allow programmatic volume', () => {
  const audio = new FakeAudio();
  Object.defineProperty(audio, 'volume', { configurable: true, get: () => 1, set: () => {} });
  const { player } = setup({ audio });
  expect(player.getSnapshot().canChangeVolume).toBe(false);
});

test('dispose settles pending work, cancels timers and detaches event handlers', async () => {
  const { audio, player } = setup();
  audio.play.mockImplementation(() => new Promise(() => {}));
  const changed = jest.fn();
  player.subscribe(changed);
  const outcome = player.play();
  player.dispose();
  changed.mockClear();
  audio.emit('playing', { paused: false, readyState: 4 });
  audio.emit('volumechange');
  jest.runAllTimers();
  expect(await outcome).toBe(false);
  expect(changed).not.toHaveBeenCalled();
  expect(audio.src).toBe('');
});
