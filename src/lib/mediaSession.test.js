import { bindMediaSession } from './mediaSession';
import { createAudioPlayer } from './audioPlayer';
import { FakeAudio } from '../test/FakeAudio';

const stations = [
  { id: 'first', name: 'First station', url: 'https://radio.example/first', logo: '/first.png' },
  { id: 'second', name: 'Second station', url: 'https://radio.example/second', logo: '/second.webp' },
];
let player;
let unbind;
function setup(unsupported) {
  const audio = new FakeAudio();
  player = createAudioPlayer({ stations, createAudio: () => audio });
  const handlers = {};
  const session = { setActionHandler: jest.fn((name, action) => {
    if (name === unsupported) throw new Error('Unsupported');
    handlers[name] = action;
  }) };
  const Metadata = jest.fn(function (values) { Object.assign(this, values); });
  unbind = bindMediaSession(player, { session, Metadata });
  return { audio, session, handlers, Metadata };
}
afterEach(() => { unbind?.(); player?.dispose(); });

test('initial metadata and playback state follow actual first play and pause', async () => {
  const { session, handlers, Metadata } = setup();
  expect(session.playbackState).toBe('none');
  expect(Metadata).not.toHaveBeenCalled();
  handlers.play();
  await Promise.resolve();
  expect(session.playbackState).toBe('playing');
  expect(session.metadata.title).toBe('First station');
  expect(session.metadata.artwork).toEqual([{ src: '/first.png', type: 'image/png' }]);
  expect(session.metadata.artwork[0].sizes).toBeUndefined();
  handlers.pause();
  expect(session.playbackState).toBe('paused');
});

test('system station controls use the shared catalog and update artwork type', () => {
  const { session, handlers } = setup();
  handlers.nexttrack();
  expect(player.getSnapshot().selectedStationId).toBe('second');
  expect(session.metadata.artwork).toEqual([{ src: '/second.webp', type: 'image/webp' }]);
  handlers.previoustrack();
  expect(session.metadata.title).toBe('First station');
});

test('a rejected system Play never changes the session to playing', async () => {
  const { session, handlers, audio } = setup();
  audio.play.mockRejectedValueOnce(new DOMException('Blocked', 'NotAllowedError'));
  await handlers.play();
  expect(player.getSnapshot().status).toBe('error');
  expect(session.playbackState).toBe('paused');
});

test('one unsupported action does not block other handlers and cleanup detaches them', () => {
  const { handlers, session } = setup('nexttrack');
  expect(handlers.play).toEqual(expect.any(Function));
  expect(handlers.previoustrack).toEqual(expect.any(Function));
  expect(handlers.nexttrack).toBeUndefined();
  unbind();
  expect(handlers.play).toBeNull();
  expect(handlers.previoustrack).toBeNull();
  expect(session.playbackState).toBe('none');
});

test('missing system APIs leave the audio controller usable', async () => {
  const audio = new FakeAudio();
  player = createAudioPlayer({ stations, createAudio: () => audio });
  unbind = bindMediaSession(player, { session: null, Metadata: null });
  expect(await player.play()).toBe(true);
});

test('missing metadata support does not prevent system actions', () => {
  const { session, handlers } = setup();
  unbind();
  unbind = bindMediaSession(player, { session, Metadata: null });
  handlers.play();
  expect(session.playbackState).toBe('playing');
});
