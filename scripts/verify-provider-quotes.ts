import { priceProviderConfiguration } from "../supabase/functions/_shared/priceProviderConfiguration.ts";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import assert from 'node:assert/strict';
import { coinQuote, forexQuote, stockQuote } from '../supabase/functions/_shared/providerQuotes.ts';
import { configuredAlphaVantageKey } from '../supabase/functions/_shared/marketProviders.ts';
const c = coinQuote({usd:110,usd_24h_change:10,last_updated_at:1700000000});
assert.equal(c?.high24h,null); assert.equal(c?.low24h,null); assert.equal(c?.volume24h,null);
assert.ok(Math.abs(c!.change24h!-10)<1e-10); assert.equal(c?.lastUpdated,'2023-11-14T22:13:20.000Z');
assert.equal(c?.provenance.fields.change24h,'derived from provider percentage');
assert.equal(coinQuote({usd:Infinity}),null); assert.equal(coinQuote({usd:-2}),null);
assert.equal(coinQuote({usd:100},true)?.provenance.status,'proxy');
const f=forexQuote({'5. Exchange Rate':'1.1','6. Last Refreshed':'2026-10-07 12:00:00','7. Time Zone':'UTC'});
for (const key of ['change24h','changePercent24h','high24h','low24h','volume24h']) assert.equal(f?.[key],null);
assert.equal(f?.lastUpdated,'2026-10-07T12:00:00.000Z');
assert.equal(stockQuote({c:100,o:90,t:1700000000000},'Polygon')?.changePercent24h,null);
assert.equal(stockQuote({'05. price':'100','07. latest trading day':'2026-10-06'},'Alpha Vantage')?.provenance.status,'previous_close');
// No Alpha Vantage credentials must mean no calls with its non-production demo key.
for (const invalid of [undefined, null, '', '   ', 'demo', ' DeMo ']) {
  assert.equal(configuredAlphaVantageKey(invalid), null);
}
assert.equal(configuredAlphaVantageKey('  owner-provided-test-key  '), 'owner-provided-test-key');
console.log('PASS provider quotes: absent fields, derived change, observation time, proxy, previous-session labels');

// Diagnostics must never expose credentials or consume an upstream request.
const sentinel = 'PRIVATE_PROVIDER_VALUE_SENTINEL';
const inspected: string[] = [];
let configuration = priceProviderConfiguration(name => { inspected.push(name); return sentinel; });
assert.deepEqual(inspected, ['POLYGON_API_KEY', 'ALPHA_VANTAGE_API_KEY']);
assert.deepEqual(configuration, { polygon: true, alphaVantage: true });
assert.ok(!JSON.stringify(configuration).includes(sentinel));
assert.deepEqual(priceProviderConfiguration(() => undefined), { polygon: false, alphaVantage: false });
assert.deepEqual(priceProviderConfiguration(name => name === 'POLYGON_API_KEY' ? '   ' : ' DeMo '), { polygon: false, alphaVantage: false });
configuration = priceProviderConfiguration(name => { if (name === 'POLYGON_API_KEY') throw Error(sentinel); return sentinel; });
assert.deepEqual(configuration, { polygon: null, alphaVantage: true });
assert.ok(!JSON.stringify(configuration).includes(sentinel));
assert.deepEqual(priceProviderConfiguration(() => { throw Error(sentinel); }), { polygon: null, alphaVantage: null });
console.log('PASS private provider configuration: booleans only, absent/demo flags, independent unknown states and no secret/error payload exposure');

// Execute the actual scheduler handler with synthetic dependencies. Provider
// metadata must stay behind its existing token/lease admission and never fetch.
let handler!: (request: Request) => Promise<Response>;
let claimed = false, claimError = false, refreshes = 0, metadataReads = 0, metadataError = false;
let saved: unknown, finishError = false;
const safeLogs: string[] = [];
const compiled = ts.transpileModule(readFileSync('supabase/functions/refresh-portfolio-prices/index.ts', 'utf8').replace(/^import .+\r?\n/gm, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;
runInNewContext(compiled, {
  createClient: () => ({ rpc: async (name: string, params: Record<string, unknown>) => {
    if (name === 'claim_portfolio_price_refresh') return { data: claimed ? { lease: 'isolated-lease', assets: [] } : null, error: claimError ? { message: sentinel } : null };
    assert.equal(name, 'finish_portfolio_price_refresh'); saved = params.p_result;
    return { error: finishError ? { message: sentinel } : null };
  } }),
  Deno: { serve: (fn: typeof handler) => { handler = fn; }, env: { get: (name: string) => {
    if (name === 'POLYGON_API_KEY' || name === 'ALPHA_VANTAGE_API_KEY') {
      metadataReads++;
      if (metadataError && name === 'POLYGON_API_KEY') throw Error(sentinel);
      return name === 'POLYGON_API_KEY' ? sentinel : 'demo';
    }
    return 'isolated-placeholder';
  } } },
  refreshHeldQuotes: async () => { refreshes++; return { requested: 53, updated: 50, unavailable: 3 }; },
  priceProviderConfiguration,
  fetchStockData: () => { throw Error('Unexpected direct stock request'); },
  fetchForexData: () => { throw Error('Unexpected direct forex request'); },
  cachePrice: () => { throw Error('Unexpected direct cache write'); },
  fetch: () => { throw Error('Unexpected diagnostic provider request'); },
  Request, Response, console: { log: (...args: unknown[]) => safeLogs.push(JSON.stringify(args)) },
}, { timeout: 1000 });
const schedulerRequest = (token?: string, method = 'POST') => new Request('https://example.invalid/refresh', {
  method, headers: token ? { 'x-refresh-token': token } : {},
});
assert.equal((await handler(schedulerRequest(undefined, 'GET'))).status, 405);
for (const token of [undefined, 'invalid', 'a'.repeat(64)]) assert.equal((await handler(schedulerRequest(token))).status, 401);
assert.equal(metadataReads, 0); assert.equal(refreshes, 0);
claimError = true;
assert.equal((await handler(schedulerRequest('a'.repeat(64)))).status, 503);
assert.equal(metadataReads, 0); assert.equal(refreshes, 0);
claimError = false; claimed = true;
let response = await handler(schedulerRequest('a'.repeat(64)));
assert.equal(response.status, 200);
let body = await response.json();
assert.deepEqual(body, { requested: 53, updated: 50, unavailable: 3, providerConfiguration: { polygon: true, alphaVantage: false } });
assert.deepEqual(JSON.parse(JSON.stringify(saved)), body);
assert.equal(refreshes, 1); assert.equal(metadataReads, 2);
assert.equal(response.headers.get('cache-control'), 'no-store');
metadataError = true;
response = await handler(schedulerRequest('a'.repeat(64))); body = await response.json();
assert.equal(response.status, 200, 'Unknown diagnostics must not invalidate successful quote updates');
assert.deepEqual(body.providerConfiguration, { polygon: null, alphaVantage: false });
assert.equal(body.updated, 50); assert.equal(refreshes, 2);
finishError = true;
response = await handler(schedulerRequest('a'.repeat(64)));
assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'Refresh status could not be saved' });
assert.ok(!JSON.stringify(saved).includes(sentinel));
assert.ok(!safeLogs.join(' ').includes(sentinel));
console.log('PASS actual refresh handler: rejected claims read no provider config, admitted results persist counts/flags, unknown metadata preserves successes, no extra fetch or secret/error disclosure');
