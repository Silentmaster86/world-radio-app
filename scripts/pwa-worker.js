/* global self, caches, fetch, Response, URL */
const CONFIG = /*WRA_CONFIG*/ null;
const CACHE_PREFIX = 'wra-shell-';
const CACHE_NAME = `${CACHE_PREFIX}${CONFIG.version}`;
const assets = new Map(CONFIG.assets.map((asset) => [new URL(asset.url, self.location.origin).pathname, asset]));
const owned = (name) => name.startsWith(CACHE_PREFIX) || name === 'radio-cache-v1';

async function installShell() {
  const existed = (await caches.keys()).includes(CACHE_NAME);
  try {
    const responses = await Promise.all(CONFIG.assets.map(async (asset) => {
      const response = await fetch(new URL(asset.url, self.location.origin).href, { cache: asset.url.startsWith('/static/') ? 'default' : 'no-cache' });
      const type = (response.headers.get('content-type') || '').split(';')[0].trim();
      if (!response.ok || response.type === 'opaque' || !asset.types.includes(type)) throw new Error(`Invalid offline asset: ${asset.url}`);
      return response;
    }));
    const cache = await caches.open(CACHE_NAME);
    const writes = await Promise.allSettled(CONFIG.assets.map((asset, index) => cache.put(asset.url, responses[index])));
    const failed = writes.find((result) => result.status === 'rejected');
    if (failed) throw failed.reason;
  } catch (error) {
    if (!existed) await caches.delete(CACHE_NAME);
    throw error;
  }
}
self.addEventListener('install', (event) => {
  // Native waiting is deliberate: no skipWaiting, claim, or forced page reload.
  event.waitUntil(installShell());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => owned(name) && name !== CACHE_NAME).map((name) => caches.delete(name)))));
});
async function saved(path) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(path);
}
async function offlinePage() {
  return await saved('/offline.html') || new Response('<!doctype html><html lang="en"><title>World Radio App — offline</title><h1>You are offline</h1><p>Reconnect to open the app and listen to live radio.</p></html>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range') || ['audio', 'video'].includes(request.destination)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      if (['/', '/now-playing'].includes(url.pathname)) {
        // Keep HTML and hashed assets from one installed release together.
        const shell = await saved('/index.html');
        if (shell) return shell;
      }
      try { return await fetch(request); } catch { return offlinePage(); }
    })());
  } else if (assets.has(url.pathname)) {
    event.respondWith((async () => await saved(url.pathname) || fetch(request))());
  }
});
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'WRA_STATUS' || !event.ports?.[0]) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const entries = await cache.keys();
    const paths = new Set(entries.map((entry) => new URL(entry.url).pathname));
    event.ports[0].postMessage({ type: 'WRA_STATUS', version: CONFIG.version, ready: CONFIG.assets.every((asset) => paths.has(asset.url)) });
  })());
});
