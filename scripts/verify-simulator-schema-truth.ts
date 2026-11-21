import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uniqueRoutes } from "./routes";
import { ASSETS } from "../src/lib/assets";
import { generateAssetMetaDescription } from "../src/lib/assetContent";

const src = readFileSync("src/pages/TradeAsset.tsx", "utf8");
assert.match(src, /"@type": "SoftwareApplication"/, "Asset pages describe software");
assert.doesNotMatch(src, /"@type": "FinancialProduct"/, "Never misrepresent virtual learning as a financial product");
assert.match(src, /"applicationCategory": "FinanceApplication"/, "Educational finance application category");
assert.match(src, /"applicationSubCategory": "Educational trading simulator"/);
assert.match(src, /"operatingSystem": "Web Browser"/);
assert.match(src, /"description": metaDescription/, "Description comes from actual authored instrument content");
assert.match(src, /"price": "0"/, "Core simulator is free");
assert.match(src, /"priceCurrency": "USD"/, "Free price has an explicit unit");
assert.doesNotMatch(src, /"availability": "https:\/\/schema\.org\/InStock"/, "A free web simulator has no retail stock inventory");
assert.match(src, /JSON\.stringify\(assetSchema\)/, "Structured data is emitted by the real page");
assert.match(src, /"url": canonicalUrl/, "No canonical changes or invented endpoints");
assert.match(src, /isIndexableAsset/, "The existing index/noindex policy stays in force");

for (const id of ["btc", "eth", "sol", "gold", "eurusd", "spy", "nvda"]) {
  const asset = ASSETS.find(x => x.id === id);
  assert.ok(asset, id + " must have a real instrument record");
  const description = generateAssetMetaDescription(asset);
  assert.ok(description.length >= 35, id + " needs a meaningful authored description");
  assert.match(description, /virtual|simulat|practi|paper|educational/i,
    id + " description must not imply actual financial execution");
}
const routes = uniqueRoutes();
for (const slug of ["btc", "eth", "gold", "eurusd", "nvda"]) {
  const route = routes.find(x => x.path === "/trade/" + slug);
  assert.ok(route, slug + " route must still exist");
  assert.ok(route.title && route.h1 && route.description, slug + " retains static SEO");
  assert.equal(route.noindex, false, slug + " remains indexable");
}
console.log("PASS cross-asset GEO: truthful simulator-only schema, safe canonical and indexable routes");
