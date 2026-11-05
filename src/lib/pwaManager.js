export function isStandalone(win, nav) {
  try { return nav.standalone === true || win.matchMedia?.('(display-mode: standalone)').matches === true; } catch { return false; }
}
export function isIOS(nav) {
  return /iPad|iPhone|iPod/.test(nav.userAgent || '') || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
}
export function isMacSafari(nav) {
  return !isIOS(nav) && /Macintosh/.test(nav.userAgent || '') && /Safari/.test(nav.userAgent || '') && !/Chrome|Chromium|Edg|OPR|Firefox/.test(nav.userAgent || '');
}
export function createPwaManager({ win = window, nav = navigator, enabled = process.env.NODE_ENV === 'production' } = {}) {
  let serviceWorker;
  try { serviceWorker = nav.serviceWorker; } catch { /* Blocked browser storage must not block the app. */ }
  let state = { status: enabled && serviceWorker ? 'checking' : 'unsupported', offlineReady: false, updateAvailable: false, updateId: 0, installAvailable: false, installed: isStandalone(win, nav), ios: isIOS(nav), macSafari: isMacSafari(nav) };
  let disposed = false, started = false, scheduled = false, registration, promptEvent, idleId, timerId, lastWaiting, probing, cancelProbe;
  const listeners = new Set(), cleanups = [];
  const publish = (patch) => { if (!disposed) { state = { ...state, ...patch }; listeners.forEach((fn) => fn(state)); } };
  const listen = (target, name, handler) => {
    target?.addEventListener?.(name, handler);
    cleanups.push(() => target?.removeEventListener?.(name, handler));
  };
  function probe(worker) {
    if (!worker || worker.state !== 'activated' || worker === probing) return;
    if (!win.MessageChannel) { publish({ status: 'error', offlineReady: false }); return; }
    cancelProbe?.(); probing = worker;
    const channel = new win.MessageChannel();
    const finish = () => { win.clearTimeout(timeout); channel.port1.close(); channel.port2.close(); probing = null; };
    const timeout = win.setTimeout(() => { finish(); publish({ status: 'error', offlineReady: false }); }, 2000);
    cancelProbe = finish;
    channel.port1.onmessage = ({ data }) => {
      finish();
      if (registration?.active === worker && data?.type === 'WRA_STATUS') publish({ status: data.ready === true ? 'ready' : 'error', offlineReady: data.ready === true });
    };
    try { worker.postMessage({ type: 'WRA_STATUS' }, [channel.port2]); } catch { finish(); publish({ offlineReady: false }); }
  }
  const watched = new Set();
  function refresh() {
    if (disposed || !registration) return;
    const waiting = registration.waiting;
    if (waiting && waiting !== lastWaiting) { lastWaiting = waiting; publish({ updateId: state.updateId + 1 }); }
    publish({ status: 'ready', updateAvailable: Boolean(waiting) });
    for (const worker of [registration.installing, registration.waiting, registration.active]) {
      if (worker && !watched.has(worker)) {
        watched.add(worker);
        listen(worker, 'statechange', () => {
          if (worker.state === 'redundant' && !registration.active) publish({ status: 'error', offlineReady: false });
          else refresh();
        });
      }
    }
    if (!registration.active) publish({ offlineReady: false });
    else probe(registration.active);
  }
  async function setup() {
    if (disposed || !enabled || !serviceWorker) return;
    publish({ status: 'checking' });
    try {
      const existing = await serviceWorker.getRegistration?.('/');
      if (disposed) return;
      if (existing && registration !== existing) { registration = existing; listen(registration, 'updatefound', refresh); refresh(); }
      if (existing && nav.onLine === false) return;
      const result = await serviceWorker.register('/service-worker.js', { scope: '/', updateViaCache: 'none' });
      if (disposed) return;
      if (registration !== result) { registration = result; listen(registration, 'updatefound', refresh); }
      refresh();
    } catch { if (registration?.active) refresh(); else publish({ status: 'error', offlineReady: false }); }
  }
  function schedule() {
    if (disposed || scheduled) return;
    scheduled = true;
    if (win.requestIdleCallback) idleId = win.requestIdleCallback(setup, { timeout: 2000 });
    else timerId = win.setTimeout(setup, 0);
  }
  async function check() {
    if (!registration?.active) return setup();
    try { await registration.update(); refresh(); } catch { /* Keep the saved release usable while offline. */ }
  }
  return {
    getSnapshot: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    start() {
      if (started || disposed) return;
      started = true;
      listen(win, 'beforeinstallprompt', (event) => { event.preventDefault(); promptEvent = event; publish({ installAvailable: true }); });
      listen(win, 'appinstalled', () => { promptEvent = null; publish({ installed: true, installAvailable: false }); });
      try {
        const query = win.matchMedia?.('(display-mode: standalone)');
        const changed = () => publish({ installed: isStandalone(win, nav) });
        if (query?.addEventListener) listen(query, 'change', changed);
        else if (query?.addListener) { query.addListener(changed); cleanups.push(() => query.removeListener(changed)); }
      } catch { /* Optional display-mode API. */ }
      if (enabled && serviceWorker) {
        listen(serviceWorker, 'controllerchange', refresh);
        listen(win, 'online', check);
        if (win.document.readyState === 'complete') schedule();
        else listen(win, 'load', schedule);
      }
    },
    async install() {
      const event = promptEvent;
      if (!event || state.installed) return false;
      promptEvent = null; publish({ installAvailable: false });
      try { await event.prompt(); await event.userChoice; return true; } catch { return false; }
    },
    check,
    dispose() {
      disposed = true;
      cleanups.splice(0).forEach((cleanup) => cleanup());
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) win.clearTimeout(timerId);
      cancelProbe?.(); listeners.clear(); promptEvent = null;
    },
  };
}
