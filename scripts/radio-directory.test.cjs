const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = () => import('../netlify/functions/radio-directory.mjs');
test('discovers mirrors, rejects foreign hosts, fails over and bounds paging', async () => {
  const { createHandler } = await load();
  const urls = [];
  const handler = createHandler({
    random: () => 0,
    lookup: async () => [
      { name: 'evil.example' },
      { name: 'de1.api.radio-browser.info' },
      { name: 'nl1.api.radio-browser.info' },
    ],
    request: async (url) => {
      urls.push(url);
      if (urls.length === 1) throw Error('down');
      return new Response(JSON.stringify([{ stationuuid: 'id' }]));
    },
  });
  const response = await handler({
    httpMethod: 'GET',
    queryStringParameters: { q: 'Jazz', country: 'fr', page: '9999' },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(urls.length, 2);
  assert.match(urls[1], /^https:\/\/nl1.api.radio-browser.info/);
  assert.equal(new URL(urls[1]).searchParams.get('offset'), '1000');
  assert.equal(new URL(urls[1]).searchParams.get('countrycode'), 'FR');
  assert.equal(
    new URL(urls[1]).searchParams.has('is_https'),
    false,
    'incompatible entries must reach the UI for explanation',
  );
});
test('rejects invalid requests without contacting external services', async () => {
  const { createHandler } = await load();
  const handler = createHandler({
    lookup: () => {
      throw Error('should not run');
    },
  });
  assert.equal((await handler({ httpMethod: 'POST' })).statusCode, 405);
  assert.equal(
    (await handler({ httpMethod: 'GET', queryStringParameters: { q: 'x' } })).statusCode,
    400,
  );
});
test('returns service error if all mirrors return invalid JSON or fail', async () => {
  const { createHandler } = await load();
  const handler = createHandler({
    lookup: async () => [],
    request: async () => new Response('not JSON'),
  });
  assert.equal(
    (await handler({ httpMethod: 'GET', queryStringParameters: { country: 'PL' } })).statusCode,
    503,
  );
});

test('accepts the common UK country alias using Radio Browser GB code', async () => {
  const { createHandler } = await load();
  let requestUrl;
  const handler = createHandler({
    lookup: async () => [{ name: 'de1.api.radio-browser.info' }],
    request: async (url) => {
      requestUrl = url;
      return new Response('[]');
    },
  });
  assert.equal(
    (await handler({ httpMethod: 'GET', queryStringParameters: { q: 'Kiss', country: ' uk ' } }))
      .statusCode,
    200,
  );
  assert.equal(new URL(requestUrl).searchParams.get('countrycode'), 'GB');
});
