import assert from "node:assert/strict";
import { CRYPTO_ID_MAP } from "../supabase/functions/_shared/marketProviders.ts";
import { refreshHeldQuotes } from "../supabase/functions/_shared/refreshPrices.ts";
const stored: string[] = [];
let calls = 0;
const deps = {
  fetch: (async () => { calls++; return new Response(JSON.stringify({ bitcoin: { usd: 100000, last_updated_at: Math.floor(Date.now()/1000) }, ethereum: { usd: 3000, last_updated_at: Math.floor(Date.now()/1000) } })); }) as typeof fetch,
  stock: async () => null, forex: async () => null,
  store: async (asset: string) => { stored.push(asset); return true; },
};
assert.deepEqual(await refreshHeldQuotes([{ assetId: "btc", type: "crypto" }, { assetId: "eth", type: "crypto" }, { assetId: "btc", type: "crypto" }, { assetId: "aapl", type: "stock" }], deps), { requested: 3, updated: 2, unavailable: 1 });
assert.equal(calls, 1); assert.deepEqual(stored, ["btc", "eth"]);
stored.length = 0;
const failure = { ...deps, fetch: (async () => new Response("Rate limited", { status: 429 })) as typeof fetch };
assert.deepEqual(await refreshHeldQuotes([{ assetId: "btc", type: "crypto" }], failure), { requested: 1, updated: 0, unavailable: 1 });
assert.equal(stored.length, 0);
const staleFetch = { ...deps, fetch: (async () => new Response(JSON.stringify({
 bitcoin: { usd: 55000, last_updated_at: 1700000000 },
 ethereum: { usd: 3000, last_updated_at: Math.floor(Date.now() / 1000) },
}))) as typeof fetch };
assert.deepEqual(await refreshHeldQuotes([{assetId:"btc",type:"crypto"},{assetId:"eth",type:"crypto"}],staleFetch),
 {requested:2,updated:1,unavailable:1}, "Ancient provider time must not be rescued by a fresh fetch");
assert.deepEqual(stored, ["eth"], "Reject stale BTC cache writes while keeping fresh ETH");
stored.length=0;
const unknownTimestamp={...deps,fetch:(async()=>new Response(JSON.stringify({bitcoin:{usd:50000}}))) as typeof fetch};
assert.deepEqual(await refreshHeldQuotes([{assetId:"btc",type:"crypto"}],unknownTimestamp),
 {requested:1,updated:0,unavailable:1}, "Undated quotes cannot be treated as current");
assert.equal(stored.length,0);
assert.deepEqual(await refreshHeldQuotes([], deps), { requested: 0, updated: 0, unavailable: 0 });
console.log("Refresh pricing passed: crypto batching/deduplication, missing providers, rate limits, no synthetic replacement and empty portfolios.");

const expanded = Object.keys(CRYPTO_ID_MAP).filter(id => id !== "matic").map(assetId => ({ assetId, type: "crypto" }));
assert.equal(expanded.length, 50);
let expandedCalls = 0;
const expandedResult = await refreshHeldQuotes(expanded, { ...deps,
  fetch: (async () => { expandedCalls++; return new Response(JSON.stringify(Object.fromEntries(expanded.map(a => [CRYPTO_ID_MAP[a.assetId], { usd: 1, last_updated_at: Math.floor(Date.now() / 1000) }])))); }) as typeof fetch,
});
assert.equal(expandedResult.updated, 50); assert.equal(expandedCalls, 1);
console.log("PASS 50 current crypto instruments share one upstream quote request; legacy MATIC remains mapped for history.");
