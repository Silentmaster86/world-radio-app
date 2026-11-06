const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, 'pwa-worker.js'), 'utf8');
const origin = 'https://radio.test';
const files = {
  '/index.html': ['<html>shell</html>', 'text/html'],
  '/offline.html': ['<html>offline</html>', 'text/html'],
  '/static/main.js': ['app()', 'text/javascript'],
};
function setup({ invalid = false, unavailable = false } = {}) {
  const handlers = {},
    stores = new Map();
  const key = (request) =>
    new URL(typeof request === 'string' ? request : request.url, origin).href;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    open: async (name) => {
      if (unavailable) throw new Error('storage unavailable');
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        put: async (req, res) => store.set(key(req), res.clone()),
        match: async (req) => store.get(key(req))?.clone(),
        keys: async () => [...store.keys()].map((url) => new Request(url)),
      };
    },
  };
  const calls = [];
  const fetch = async (request) => {
    const url = key(request);
    calls.push(url);
    const [body, type] = files[new URL(url).pathname] || ['missing', 'text/plain'];
    if (invalid && url.endsWith('.js'))
      return new Response('<html>fallback</html>', { headers: { 'Content-Type': 'text/html' } });
    return new Response(body, { headers: { 'Content-Type': type } });
  };
  const config = {
    version: 'new',
    assets: Object.entries(files).map(([url, [, type]]) => ({ url, types: [type] })),
  };
  const self = {
    location: { origin },
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
  };
  vm.runInNewContext(source.replace('/*WRA_CONFIG*/ null', JSON.stringify(config)), {
    self,
    caches,
    fetch,
    URL,
    Response,
  });
  async function dispatch(name, extra = {}) {
    let done;
    handlers[name]({
      waitUntil: (promise) => {
        done = promise;
      },
      ...extra,
    });
    await done;
  }
  async function request(url, options = {}) {
    let response;
    handlers.fetch({
      request: {
        url: new URL(url, origin).href,
        method: 'GET',
        mode: 'cors',
        destination: '',
        headers: new Headers(),
        ...options,
      },
      respondWith: (value) => {
        response = value;
      },
    });
    return response ? await response : undefined;
  }
  return { stores, caches, calls, dispatch, request };
}
test('installation caches a complete release and offline navigation reuses its HTML', async () => {
  const s = setup();
  await s.dispatch('install');
  s.calls.length = 0;
  const response = await s.request('/now-playing?q=radio', { mode: 'navigate' });
  assert.equal(await response.text(), '<html>shell</html>');
  assert.deepEqual(s.calls, []);
  assert.equal((await s.caches.keys()).length, 1);
});
test('HTML masquerading as JavaScript fails installation without deleting an old release', async () => {
  const s = setup({ invalid: true });
  await s.caches.open('wra-shell-old');
  await assert.rejects(s.dispatch('install'), /Invalid offline asset/);
  assert.deepEqual(await s.caches.keys(), ['wra-shell-old']);
});
test('cache-storage failures reject offline setup without silently succeeding', async () => {
  const s = setup({ unavailable: true });
  await assert.rejects(s.dispatch('install'), /storage unavailable/);
});
test('radio, video, range, external, POST and unknown requests stay out of the cache handler', async () => {
  const s = setup();
  await s.dispatch('install');
  for (const [url, options] of [
    ['https://stream.example/live', {}],
    ['/static/main.js', { method: 'POST' }],
    ['/static/main.js', { destination: 'audio' }],
    ['/static/main.js', { destination: 'video' }],
    ['/static/main.js', { headers: new Headers({ Range: 'bytes=0-10' }) }],
    ['/api/private', {}],
  ])
    assert.equal(await s.request(url, options), undefined);
});
test('activation cleans only owned old releases and the known legacy cache', async () => {
  const s = setup();
  await s.dispatch('install');
  await s.caches.open('wra-shell-old');
  await s.caches.open('radio-cache-v1');
  await s.caches.open('unrelated-app-data');
  await s.dispatch('activate');
  assert.deepEqual((await s.caches.keys()).sort(), ['unrelated-app-data', 'wra-shell-new']);
});
test('query variations do not create runtime cache entries', async () => {
  const s = setup();
  await s.dispatch('install');
  const size = s.stores.get('wra-shell-new').size;
  for (const query of ['?q=a', '?section=favorites', '?q=other'])
    await s.request('/' + query, { mode: 'navigate' });
  assert.equal(s.stores.get('wra-shell-new').size, size);
});
test('status reports missing assets instead of promising offline readiness', async () => {
  const s = setup();
  await s.dispatch('install');
  let status;
  const port = {
    postMessage: (data) => {
      status = data;
    },
  };
  await s.dispatch('message', { data: { type: 'WRA_STATUS' }, ports: [port] });
  assert.equal(status.ready, true);
  s.stores.get('wra-shell-new').delete(origin + '/static/main.js');
  await s.dispatch('message', { data: { type: 'WRA_STATUS' }, ports: [port] });
  assert.equal(status.ready, false);
});
