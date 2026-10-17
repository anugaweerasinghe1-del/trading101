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
