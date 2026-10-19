// Runs Google Search / Google Shopping requests through the CrawlerData API and saves one dataset row
// per query or product ID. The user's own CrawlerData API key is the input `apiKey`: requests use their
// CrawlerData credits (1 per request; Google Shopping sellers: 1 per 10 sellers returned; failed requests
// are not charged). The Actor itself is free; Apify bills the user only for platform usage.
import { Actor, log } from 'apify';
import { buildRequests, toRow } from './lib.js';

const API_URL = 'https://api.crawlerdata.com/v1/jobs';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const apiKey = typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
if (!apiKey) {
  throw new Error('Enter your CrawlerData API key. Create one at https://app.crawlerdata.com (new accounts with a verified work email get 50 free credits).');
}

const requests = buildRequests(input);
const concurrency = Math.min(10, Math.max(1, input.maxConcurrency ?? 5));
log.info(`Running ${requests.length} ${input.endpoint} request(s), ${concurrency} at a time.`);

let next = 0;
let stopped = false;
let done = 0;

async function call(req) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(200_000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === 2) return { error: { message: err.message } };
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
}

async function worker() {
  while (!stopped && next < requests.length) {
    const req = requests[next++];
    const row = toRow(req, await call(req));
    await Actor.pushData(row);
    done++;
    if (row.error && /api key|credits|unauthor/i.test(String(row.error))) {
      log.error(`${row.error} Check your key and balance at https://app.crawlerdata.com.`);
      stopped = true;
    }
    if (row.status !== 'completed') log.warning(`${req.input}: ${row.error ?? 'failed'} (not charged)`);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
log.info(`Done: ${done} of ${requests.length} request(s).`);
await Actor.exit();
