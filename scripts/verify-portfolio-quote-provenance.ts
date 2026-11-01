import assert from "node:assert/strict";
import { quoteCoverageForHoldings } from "../src/lib/quoteCoverage.ts";
import { normalizePortfolioPriceStatus, priceLabel, snapshotPriceInfo } from "../src/lib/practicePricing.ts";
const now = Date.parse("2026-11-01T10:00:00Z");
const rows = [
 {asset_id:"btc",price:60000,updated_at:"2026-11-01T09:58:00Z",observed_at:"2026-11-01T09:57:00Z",quote_status:"provider"},
 {asset_id:"msft",price:300,updated_at:"2026-11-01T09:58:00Z",observed_at:"2026-10-30T20:00:00Z",quote_status:"previous_close"},
 {asset_id:"eth",price:2000,updated_at:"2026-11-01T09:20:00Z",observed_at:"2026-11-01T09:20:00Z",quote_status:"provider"},
 {asset_id:"sol",price:100,updated_at:"2026-11-01T09:58:00Z",observed_at:null,quote_status:"provider"},
 {asset_id:"ibm",price:150,updated_at:"2026-11-01T09:59:00Z",observed_at:"2026-10-07T20:00:00Z",quote_status:"previous_close"},
 {asset_id:"iwm",price:220,updated_at:"2026-11-01T09:59:00Z",observed_at:"2026-10-29T20:00:00Z",quote_status:"previous_close"},
];
const status=quoteCoverageForHoldings(["btc","msft","eth","sol","aapl","ibm","iwm"],rows,now);
assert.equal(status.btc.status,"provider");
assert.equal(status.msft.status,"previous_close");
assert.equal(status.ibm.status,"stale", "weeks-old close must not masquerade as previous close");
assert.match(status.ibm.note,/7 days/);
assert.equal(status.iwm.status,"previous_close", "recent prior session close survives weekends");
assert.equal(normalizePortfolioPriceStatus("previous_close", "2026-10-07T20:00:00Z", now),"stale");
assert.equal(normalizePortfolioPriceStatus("previous_close", "2026-10-29T20:00:00Z", now),"previous_close");
assert.equal(normalizePortfolioPriceStatus("previous_close", null, now),"stale");
assert.equal(priceLabel("previous_close", "2026-10-07T20:00:00Z"), "Older cached quotes");
assert.equal(snapshotPriceInfo([{priced_at:"2026-11-01T09:58:00Z",observed_at:"2026-10-07T20:00:00Z",quote_status:"previous_close"}],now).status,"stale");
assert.equal(snapshotPriceInfo([{priced_at:"2026-11-01T09:58:00Z",observed_at:"2026-10-29T20:00:00Z",quote_status:"previous_close"}],now).status,"previous_close");
assert.equal(status.eth.status,"stale");
assert.equal(status.sol.status,"delayed");
assert.equal(status.aapl.status,"simulator");
assert.ok(status.aapl.note.includes("No provider quote"));
const src = await import("node:fs/promises");
const positions = await src.readFile("src/components/portfolio/PositionsTable.tsx","utf8");
assert.match(positions,/QuoteBadge/);
assert.match(positions,/Simulator-only/);
const page = await src.readFile("src/pages/Portfolio.tsx","utf8");
assert.match(page,/quoteCoverageForHoldings/);
assert.match(page,/quoteLookupFailed/);
console.log("PASS quote provenance: provider, close, delayed, stale and simulator fallback are distinct");
