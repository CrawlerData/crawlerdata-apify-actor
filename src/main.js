// Runs Google Shopping / Google Search requests through the CrawlerData API and saves one dataset row
// per query or product ID. Pay per event: one "credit" event per CrawlerData credit used (1 per request;
// Google Shopping sellers: 1 per 10 sellers returned). Failed requests are not charged.
import { Actor, log } from 'apify';
import { buildRequests, toRow } from './lib.js';

const API_URL = 'https://api.crawlerdata.com/v1/jobs';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const apiKey = process.env.CRAWLERDATA_API_KEY;
if (!apiKey) throw new Error('CRAWLERDATA_API_KEY is not configured for this Actor.');

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
    if (row.credits > 0) {
      const charge = await Actor.charge({ eventName: 'credit', count: row.credits });
      if (charge.eventChargeLimitReached) {
        log.warning('Maximum cost per run reached; stopping.');
        stopped = true;
      }
    }
    if (row.status !== 'completed') log.warning(`${req.input}: ${row.error ?? 'failed'} (not charged)`);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
log.info(`Done: ${done} of ${requests.length} request(s).`);
await Actor.exit();
