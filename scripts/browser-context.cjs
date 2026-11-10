async function createAppContext(browser, options) {
  const context = await browser.newContext(options);
  if (process.env.WRA_BASE_URL) {
    // The host's review drawer can cover application controls on mobile.
    // Block only its injected loader; app documents, assets and workers stay real.
    await context.route('**/.netlify/scripts/cdp*', (route) => route.abort());
  }
  return context;
}

async function waitForServiceWorker(page) {
  // waitForFunction treats an async predicate's Promise as truthy. Poll inside
  // one awaited evaluation, including the installing -> activating -> activated
  // transition; an active reference alone does not establish readiness.
  await page.evaluate(async () => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active?.state === 'activated') return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Service worker activation timed out');
  });
}

module.exports = { createAppContext, waitForServiceWorker };
