const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');

async function main() {
  const { GITHUB_REPOSITORY, PR_HEAD_SHA, GH_TOKEN, WRA_BASE_URL } = process.env;
  assert.ok(
    GITHUB_REPOSITORY && PR_HEAD_SHA && GH_TOKEN && WRA_BASE_URL,
    'Preview CI context is required',
  );
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/commits/${PR_HEAD_SHA}/status`;
  const deadline = Date.now() + 5 * 60 * 1000;
  let ready = false;
  while (Date.now() < deadline) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15000),
    });
    assert.ok(response.ok, `Cannot read deploy status: HTTP ${response.status}`);
    const data = await response.json();
    const deploy = data.statuses.find(
      (entry) => entry.context === 'netlify/worldradioapp/deploy-preview',
    );
    if (deploy?.state === 'success') {
      ready = true;
      break;
    }
    assert.ok(
      !['failure', 'error'].includes(deploy?.state),
      `Netlify rejected this commit: ${deploy?.target_url}`,
    );
    await delay(10000);
  }
  assert.ok(ready, 'Timed out waiting for the current commit Netlify preview');
  const scripts = [];
  for (const route of [
    '/',
    '/now-playing',
    '/discover',
    '/library',
    '/station/capital-dance',
    '/station/rb-a740cc4c-9563-4fbe-a13f-e7f9e89b7441',
  ]) {
    const response = await fetch(new URL(route, WRA_BASE_URL), {
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(response.status, 200, `Preview ${route} does not return HTTP 200`);
    assert.ok(
      response.headers.get('content-type')?.includes('text/html'),
      `${route} does not return HTML`,
    );
    const html = await response.text();
    assert.ok(
      html.includes('World Radio App') && html.includes('id="root"'),
      `${route} does not serve the application`,
    );
    const script = html.match(/<script[^>]*src="([^"]*\/static\/js\/main\.[^"]+)"/i)?.[1];
    assert.ok(script, `Missing application script on ${route}`);
    scripts.push(script);
  }
  assert.ok(
    scripts.every((script) => script === scripts[0]),
    'Direct route serves a different application',
  );
  const script = await fetch(new URL(scripts[0], WRA_BASE_URL), {
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(script.status, 200, 'Preview application script is unavailable');
  console.log(
    `Verified current-commit Netlify preview: ${WRA_BASE_URL}/, /now-playing, /discover, /library and shared station routes`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
