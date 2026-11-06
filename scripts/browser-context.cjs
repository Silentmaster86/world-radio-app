async function createAppContext(browser, options) {
  const context = await browser.newContext(options);
  if (process.env.WRA_BASE_URL) {
    // The host's review drawer can cover application controls on mobile.
    // Block only its injected loader; app documents, assets and workers stay real.
    await context.route('**/.netlify/scripts/cdp*', (route) => route.abort());
  }
  return context;
}

module.exports = { createAppContext };
