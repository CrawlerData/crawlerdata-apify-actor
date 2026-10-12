// Pure helpers, kept separate from main.js so they can be tested without the Apify runtime.

export const PRODUCT_ENDPOINTS = new Set(['google-shopping-product', 'google-shopping-product-info']);
export const DEVICE_ENDPOINTS = new Set(['google-search']);
export const ENDPOINTS = [
  'google-shopping-search', 'google-shopping-product', 'google-shopping-product-info', 'google-search',
  'google-images', 'google-news', 'google-local', 'google-autocomplete',
];

/** One CrawlerData request body per query or product ID. */
export function buildRequests(input) {
  const endpoint = input.endpoint;
  if (!ENDPOINTS.includes(endpoint)) throw new Error(`Unknown endpoint: ${endpoint}`);
  const byProduct = PRODUCT_ENDPOINTS.has(endpoint);
  const items = (byProduct ? input.productIds : input.queries) ?? [];
  const values = [...new Set(items.map((s) => String(s).trim()).filter(Boolean))];
  if (!values.length) throw new Error(byProduct ? 'Add at least one product ID.' : 'Add at least one search query.');
  const country = (input.country || 'us').trim().toLowerCase();
  const language = (input.language || 'en').trim().toLowerCase();
  return values.map((value) => {
    const params = { [byProduct ? 'product_id' : 'query']: value, country, language };
    if (DEVICE_ENDPOINTS.has(endpoint) && input.device) params.device = input.device;
    return { input: value, body: { endpoint, params, queue: 'live' } };
  });
}

/** Dataset row for one finished request. */
export function toRow(req, response) {
  const job = response?.job ?? {};
  return {
    input: req.input,
    endpoint: req.body.endpoint,
    country: req.body.params.country,
    status: job.status ?? 'failed',
    credits: job.status === 'completed' ? job.credits ?? 0 : 0,
    error: job.error ?? response?.error?.message ?? null,
    result: response?.result ?? null,
  };
}
