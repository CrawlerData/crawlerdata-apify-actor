import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequests, toRow } from '../src/lib.js';

test('one live request per unique query, with defaults', () => {
  const r = buildRequests({ endpoint: 'google-search', queries: ['a', ' a ', 'b', ''], device: 'mobile' });
  assert.equal(r.length, 2);
  assert.deepEqual(r[0].body, { endpoint: 'google-search', params: { query: 'a', country: 'us', language: 'en', device: 'mobile' }, queue: 'live' });
});

test('product endpoints use product IDs and ignore device', () => {
  const r = buildRequests({ endpoint: 'google-shopping-product', productIds: ['123'], queries: ['x'], country: 'GB', device: 'mobile' });
  assert.deepEqual(r[0].body.params, { product_id: '123', country: 'gb', language: 'en' });
});

test('rejects unknown endpoints and empty input', () => {
  assert.throws(() => buildRequests({ endpoint: 'bing' }), /Unknown endpoint/);
  assert.throws(() => buildRequests({ endpoint: 'google-news', queries: [] }), /search query/);
  assert.throws(() => buildRequests({ endpoint: 'google-shopping-product-info' }), /product ID/);
});

test('rows charge only completed jobs', () => {
  const req = buildRequests({ endpoint: 'google-news', queries: ['x'] })[0];
  assert.equal(toRow(req, { job: { status: 'completed', credits: 1 }, result: { a: 1 } }).credits, 1);
  const failed = toRow(req, { job: { status: 'failed', credits: 0, error: 'boom' }, result: null });
  assert.deepEqual([failed.credits, failed.error], [0, 'boom']);
  const network = toRow(req, { error: { message: 'timeout' } });
  assert.deepEqual([network.status, network.credits, network.error], ['failed', 0, 'timeout']);
});
