import { createPwaManager, isIOS } from './pwaManager';
function platform({ enabled = true, offline = false, failing = false } = {}) {
  const win = new EventTarget();
  win.document = { readyState: 'complete' };
  win.setTimeout = setTimeout; win.clearTimeout = clearTimeout;
  win.requestIdleCallback = (fn) => { fn(); return 1; };
  win.cancelIdleCallback = jest.fn();
  win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  win.MessageChannel = class {
    constructor() {
      this.port1 = { close: jest.fn(), onmessage: null };
      this.port2 = { close: jest.fn(), postMessage: (data) => this.port1.onmessage?.({ data }) };
    }
  };
  const active = Object.assign(new EventTarget(), { state: 'activated', postMessage: jest.fn((message, [port]) => port.postMessage({ type: 'WRA_STATUS', ready: true })) });
  const reg = Object.assign(new EventTarget(), { active, waiting: null, installing: null, update: jest.fn().mockResolvedValue(undefined) });
  const serviceWorker = Object.assign(new EventTarget(), { register: failing ? jest.fn().mockRejectedValue(new Error('blocked')) : jest.fn().mockResolvedValue(reg), getRegistration: jest.fn().mockResolvedValue(offline ? reg : undefined) });
  const nav = { serviceWorker, onLine: !offline, userAgent: 'Chrome' };
  const manager = createPwaManager({ win, nav, enabled });
  return { win, nav, reg, active, manager };
}
const flush = async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); };
let manager;
afterEach(() => manager?.dispose());
test('registers one root worker, verifies offline readiness and leaves activation to the browser', async () => {
  const p = platform(); manager = p.manager;
  manager.start(); manager.start(); await flush();
  expect(p.nav.serviceWorker.register).toHaveBeenCalledTimes(1);
  expect(p.nav.serviceWorker.register).toHaveBeenCalledWith('/service-worker.js', { scope: '/', updateViaCache: 'none' });
  expect(manager.getSnapshot().offlineReady).toBe(true);
  p.reg.waiting = Object.assign(new EventTarget(), { state: 'installed', postMessage: jest.fn() });
  p.reg.dispatchEvent(new Event('updatefound'));
  expect(manager.getSnapshot().updateAvailable).toBe(true);
  expect(p.reg.waiting.postMessage).not.toHaveBeenCalled();
});
test('an existing offline installation works without a network registration', async () => {
  const p = platform({ offline: true }); manager = p.manager; manager.start(); await flush();
  expect(manager.getSnapshot().offlineReady).toBe(true);
  expect(p.nav.serviceWorker.register).not.toHaveBeenCalled();
});
test('failed registration leaves online app controls usable and can be retried', async () => {
  const p = platform({ failing: true }); manager = p.manager; manager.start(); await flush();
  expect(manager.getSnapshot().status).toBe('error');
  p.nav.serviceWorker.register.mockResolvedValue(p.reg);
  await manager.check(); await flush();
  expect(manager.getSnapshot().offlineReady).toBe(true);
});
test('native install prompts are consumed once; only appinstalled confirms installation', async () => {
  const p = platform({ enabled: false }); manager = p.manager; manager.start();
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: jest.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome: 'accepted' }) });
  p.win.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(manager.getSnapshot().installAvailable).toBe(true);
  expect(await manager.install()).toBe(true);
  expect(await manager.install()).toBe(false);
  expect(event.prompt).toHaveBeenCalledTimes(1);
  expect(manager.getSnapshot().installed).toBe(false);
  p.win.dispatchEvent(new Event('appinstalled'));
  expect(manager.getSnapshot().installed).toBe(true);
});
test('disposal ignores late registration and removes install listeners', async () => {
  const p = platform(); manager = p.manager;
  const listener = jest.fn(); manager.subscribe(listener); manager.start(); manager.dispose(); listener.mockClear();
  await flush(); p.win.dispatchEvent(new Event('appinstalled'));
  expect(listener).not.toHaveBeenCalled();
});
test('iPad desktop identity is recognized for Safari installation help', () => {
  expect(isIOS({ platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
  expect(isIOS({ userAgent: 'iPhone' })).toBe(true);
  expect(isIOS({ platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
});

test('a failed worker installation reports unavailable offline access', async () => {
  const p = platform(); p.reg.active = null;
  const worker = Object.assign(new EventTarget(), { state: 'installing' }); p.reg.installing = worker;
  manager = p.manager; manager.start(); await flush();
  worker.state = 'redundant'; worker.dispatchEvent(new Event('statechange'));
  expect(manager.getSnapshot().status).toBe('error');
  expect(manager.getSnapshot().offlineReady).toBe(false);
});
