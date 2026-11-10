import Hls from 'hls.js';
import { attachHls } from './hlsPlayback';

jest.mock('hls.js', () => {
  const Engine = jest.fn();
  Engine.isSupported = jest.fn(() => true);
  Engine.Events = { MEDIA_ATTACHED: 'attached', MANIFEST_PARSED: 'parsed', ERROR: 'error' };
  Engine.ErrorTypes = { MEDIA_ERROR: 'media' };
  return { __esModule: true, default: Engine };
});
let handlers, engine, audio, ready, error;
beforeEach(() => {
  handlers = {};
  audio = { src: 'blob:current-hls' };
  ready = jest.fn();
  error = jest.fn();
  engine = {
    on: jest.fn((event, callback) => (handlers[event] = callback)),
    attachMedia: jest.fn(),
    loadSource: jest.fn(),
    stopLoad: jest.fn(),
    destroy: jest.fn(),
  };
  Hls.mockImplementation(() => engine);
  Hls.isSupported.mockReturnValue(true);
});
test('attaches one media source, starts once and ignores callbacks after cleanup', () => {
  const source = attachHls(audio, 'https://radio.example/live.m3u8', { ready, error });
  expect(engine.attachMedia).not.toHaveBeenCalled();
  source.start();
  expect(engine.attachMedia).toHaveBeenCalledWith(audio);
  handlers.attached();
  expect(engine.loadSource).toHaveBeenCalledWith('https://radio.example/live.m3u8');
  expect(source.matches('blob:current-hls')).toBe(true);
  expect(source.matches('blob:old-hls')).toBe(false);
  handlers.parsed();
  handlers.parsed();
  expect(ready).toHaveBeenCalledTimes(1);
  handlers.error(null, { fatal: false });
  expect(error).not.toHaveBeenCalled();
  source.pause();
  expect(engine.stopLoad).toHaveBeenCalledTimes(1);
  source.destroy();
  source.destroy();
  handlers.attached();
  handlers.parsed();
  handlers.error(null, { fatal: true });
  expect(engine.destroy).toHaveBeenCalledTimes(1);
  expect(engine.loadSource).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
});
test('reports unsupported browsers and distinguishes fatal decode/network failures', () => {
  Hls.isSupported.mockReturnValue(false);
  expect(() => attachHls(audio, 'https://radio.example/live', { ready, error })).toThrow(
    expect.objectContaining({ name: 'NotSupportedError' }),
  );
  Hls.isSupported.mockReturnValue(true);
  attachHls(audio, 'https://radio.example/live', { ready, error });
  handlers.error(null, { fatal: true, type: 'media' });
  expect(error).toHaveBeenLastCalledWith({ code: 3 });
  handlers.error(null, { fatal: true, type: 'network' });
  expect(error).toHaveBeenLastCalledWith(expect.any(Error));
});
test('rejects insecure child resources instead of fetching mixed content', () => {
  attachHls(audio, 'https://radio.example/live', { ready, error });
  const config = Hls.mock.calls.at(-1)[0];
  expect(() => config.xhrSetup({}, 'https://radio.example/segment.aac')).not.toThrow();
  expect(() => config.xhrSetup({}, 'http://radio.example/segment.aac')).toThrow('HTTPS');
});
