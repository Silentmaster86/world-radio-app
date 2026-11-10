import Hls from 'hls.js';

// Loaded only after a user requests HLS on a browser without native HLS.
export function attachHls(audio, url, { ready, error }) {
  if (!Hls.isSupported()) throw new DOMException('HLS is not supported', 'NotSupportedError');
  const engine = new Hls({
    maxBufferLength: 20,
    maxMaxBufferLength: 30,
    backBufferLength: 10,
    xhrSetup(_xhr, resource) {
      if (new URL(resource).protocol !== 'https:') throw new Error('HLS requires HTTPS');
    },
  });
  let source = '';
  let destroyed = false;
  let started = false;
  engine.on(Hls.Events.MEDIA_ATTACHED, () => {
    if (destroyed) return;
    source = audio.src;
    engine.loadSource(url);
  });
  engine.on(Hls.Events.MANIFEST_PARSED, () => {
    if (!destroyed && !started) {
      started = true;
      ready();
    }
  });
  engine.on(Hls.Events.ERROR, (_event, data) => {
    if (!destroyed && data.fatal)
      error(
        data.type === Hls.ErrorTypes.MEDIA_ERROR ? { code: 3 } : new Error('HLS network failure'),
      );
  });
  return {
    start: () => engine.attachMedia(audio),
    matches: (current) => !!source && current === source,
    pause: () => engine.stopLoad(),
    destroy() {
      if (!destroyed) {
        destroyed = true;
        engine.destroy();
      }
    },
  };
}
