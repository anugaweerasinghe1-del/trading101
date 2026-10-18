import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isEligibleAdScreen } from "../src/lib/adInventory";
for (const pathname of ["/auth", "/reset-password", "/admin", "/admin/ai", "/trader/empty", "/portfolio", "/trade/btc", "/markets", "/leaderboard", "/reviews", "/daily", "/challenge/demo", "/ai-mentor", "/missing"]) {
  assert.equal(isEligibleAdScreen({ pathname, siteApproved: true, publishedPublisherContent: true }), false, pathname);
}
const article = { pathname: "/learn/article/what-is-paper-trading", siteApproved: true, publishedPublisherContent: true };
assert.equal(isEligibleAdScreen(article), true);
for (const state of [{ siteApproved: false }, { publishedPublisherContent: false }, { loading: true }, { error: true }]) {
  assert.equal(isEligibleAdScreen({ ...article, ...state }), false);
}
assert.equal(isEligibleAdScreen({ pathname: article.pathname }), false);
const ads = readFileSync("public/ads.txt", "utf8").trim();
assert.equal(ads, "google.com, pub-4160578126993254, DIRECT, f08c47fec0942fa0");
const shell = readFileSync("index.html", "utf8");
assert.ok(shell.includes("ca-pub-4160578126993254"));
assert.ok(!/enable_page_level_ads/.test(shell));
console.log("PASS manual ad-inventory default denial, utility/error/loading exclusion and unchanged publisher identity; no ads enabled");
