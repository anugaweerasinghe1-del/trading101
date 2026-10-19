/**
 * Content integrity gate for the 18 October 2026 AdSense editorial audit.
 * This prevents known copy-template leakage and misleading claims from
 * silently returning to the crawler-visible and interactive pages.
 * Passing it is necessary, not sufficient, for AdSense approval.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadSiteData } from "./loadData";
import { uniqueRoutes } from "./routes";
import { buildContentMap } from "./content";

const { HOWTO_ASSETS, STRATEGIES, courseTracks, LEARN_ARTICLES, tradingGlossary } = await loadSiteData();
const routes = uniqueRoutes();
const map = await buildContentMap();
const audited = [
  "/how-to-trade/sol",
  "/strategy/dca-dollar-cost-averaging",
  "/strategy",
  "/courses",
  "/courses/trading-psychology-mastery",
  "/courses/trading-psychology-mastery/the-trading-journal",
  "/courses/trading-psychology-mastery/discipline-and-daily-rituals",
  "/courses/trading-psychology-mastery/handling-drawdowns",
];

for (const route of audited) {
  const manifest = routes.find((r) => r.path === route);
  assert.ok(manifest, "Missing audit route: " + route);
  assert.equal(manifest.noindex, undefined, "Audited important route unexpectedly noindex: " + route);
  assert.ok(map.get(route)?.sections.length, "Missing crawler-visible page: " + route);
}

const copy = audited.map((route) => JSON.stringify(map.get(route))).join("\n");
for (const fragment of [
  "converting the empty response to zero would fabricate",
  "Stop and target levels are conceptual assumptions",
  "Take at least thirty trades before drawing any conclusion",
  "single highest-leverage tool",
  "You are literally trading blind",
  "Consistent P&L comes from consistent process",
  "sleep 8 hours",
  "what a realistic first account size is",
  "The Professional's Routine",
  "How Pros Stay Sane",
]) assert.ok(!copy.includes(fragment), "Audit regression: " + fragment);

const sol = HOWTO_ASSETS.find((x) => x.symbol === "sol");
assert.ok(sol?.sources?.some((source) => source.href.startsWith("https://solana.com/docs/")));
assert.ok(sol?.firstTrade.includes("40 × $125"));
assert.ok(!sol?.mistakes.some((value) => /timeout|provider|fallback/i.test(value)));

for (const asset of HOWTO_ASSETS) {
  assert.ok(asset.sources?.length, asset.symbol + ": missing primary sources");
  assert.ok(map.get("/how-to-trade/" + asset.symbol)?.links.some((link) =>
    asset.sources!.some((source) => source.href === link.href)), asset.symbol + ": sources missing from prerender");
  // A summary step should not reproduce an entire full review paragraph.
  assert.ok(asset.steps.every((step) => step !== asset.review), asset.symbol + ": duplicate review step");
}
const dca = STRATEGIES.find((x) => x.slug === "dca-dollar-cost-averaging");
assert.ok(dca?.sources?.some((x) => x.href.includes("investor.gov")));
assert.ok(/30\.833/.test(dca?.example || ""));
assert.ok(!/stop and target|removes the hardest variable/i.test(JSON.stringify(dca)));

const track = courseTracks.find((x) => x.slug === "trading-psychology-mastery");
assert.ok(track);
for (const slug of ["the-trading-journal", "discipline-and-daily-rituals", "handling-drawdowns"]) {
  const lesson = track.lessons.find((x) => x.slug === slug);
  assert.ok(lesson, "Missing psychology lesson: " + slug);
  assert.equal(lesson.quiz.length, 4, "Expected four revised quiz questions: " + slug);
  assert.ok(lesson.sources.some((source) => /^https:\/\/www\.(investor\.gov|finra\.org)/.test(source.url)));
}
const coursesPage = readFileSync("src/pages/Courses.tsx", "utf8");
assert.ok(!coursesPage.includes("Every claim sourced"), "Cannot claim every course statement is source-backed");
const paper = LEARN_ARTICLES.find(article => article.slug === "what-is-paper-trading")!;
const charts = LEARN_ARTICLES.find(article => article.slug === "how-to-read-stock-charts")!;
const orderTypes = LEARN_ARTICLES.find(article => article.slug === "market-orders-vs-limit-orders")!;
assert.ok(paper && charts && orderTypes);
assert.doesNotMatch(paper.metaDescription, /no risk|no downside/i, "paper practice still has educational limits");
assert.match(paper.metaDescription, /real-market costs/i);
assert.doesNotMatch(charts.metaDescription, /like a pro|smarter trades/i);
assert.match(JSON.stringify(charts.sections), /not evidence that a reversal is imminent/);
assert.match(orderTypes.metaDescription, /market orders only/i);
assert.doesNotMatch(orderTypes.metaDescription, /fill guarantees/i);
assert.ok(orderTypes.relatedLinks.some(link => link.href === "/trade/nvda" && /simulated market order/.test(link.label)));
assert.match(JSON.stringify(orderTypes.sections), /highest acceptable price/);

// Review named content families without claiming that an automated test can judge
// all financial statements or Google's qualitative originality assessment.
const publisherSource = readFileSync("scripts/content.ts", "utf8");
const supportingSource = readFileSync("scripts/staticCopyExtra.ts", "utf8");
for (const unsupported of [
  "Volatility is several times that of a large-cap equity",
  "timing beats analysis in this market",
  "fund positions reward a longer review cycle",
  "the single most predictable source of a large move",
  "Forced liquidations of leveraged positions cause a large share",
  "real returns will lag the simulated ones",
  "Size crypto positions smaller than equity positions",
  "give the position a wider stop",
]) {
  assert.ok(!publisherSource.includes(unsupported), "Unsupported asset-family claim returned: " + unsupported);
}
for (const unsupported of [
  "There are no signals, price targets or recommendations anywhere",
  "Answering those honestly over a few months does more for results than any indicator",
  "Because TradeHQ handles no money and executes no trades, disputes about market outcomes cannot arise",
  "usually the worst risk-reward entry available",
]) {
  assert.ok(!supportingSource.includes(unsupported), "Unsupported hub-wide claim returned: " + unsupported);
}
for (const path of ["/trade/btc", "/trade/aapl", "/trade/spy", "/trade/eurusd", "/trade/gold"]) {
  const page = map.get(path);
  assert.ok(page?.sections.length, path + ": asset class must have visible learning content");
}
const indexArticle = LEARN_ARTICLES.find(a => a.slug === "stock-market-index-etfs")!;
const portfolioArticle = LEARN_ARTICLES.find(a => a.slug === "how-to-build-a-portfolio")!;
assert.match(JSON.stringify(indexArticle.sections), /ETF shareholder owns shares of that fund/);
assert.match(JSON.stringify(portfolioArticle.sections), /\$7,500 loss before costs/);
assert.equal(0.25 * 100000 * 0.30, 7500, "Diversification example arithmetic");
for (const [slug, expected] of [
  ["limit-order-vs-market-order", /simplified virtual market orders only/],
  ["dark-pool", /not by itself prove it took place in a dark pool/],
  ["market-maker", /quoted spread is not guaranteed profit/],
  ["wyckoff-method", /not records proving institutional intentions/],
  ["paper-trading", /No number of successful virtual transactions proves/],
  ["elliott-wave-theory", /hindsight bias/],
] as const) {
  const term = tradingGlossary.find(t => t.slug === slug)!;
  assert.ok(term && expected.test(term.definition + " " + term.expertDefinition), slug + ": glossary qualification missing");
  assert.ok(map.get("/wiki/" + slug)?.sections.length, slug + ": glossary has no authored page");
}
console.log("PASS scoped source-fit regression: five asset classes, core hubs, portfolio articles and six glossary topics; no AdSense approval implied");

for (const route of ["/learn", "/challenge", "/about", "/trade"]) {
  assert.ok(map.get(route)?.sections.length, route + ": public support content required");
}
const learnHub = JSON.stringify(map.get("/learn"));
const challengeHub = JSON.stringify(map.get("/challenge"));
const aboutHub = JSON.stringify(map.get("/about"));
assert.match(learnHub, /Study the options and futures lessons as conceptual examples/);
assert.doesNotMatch(learnHub, /Only then take options or futures|complete beginner guide end to end|avoid predictions entirely/);
assert.match(challengeHub, /no prize pool and no real money/);
assert.doesNotMatch(challengeHub, /coin-flip on leverage|Judge the winner/);
assert.doesNotMatch(aboutHub, /never handles money at all|Nothing on the site forecasts prices/);
assert.ok(!readFileSync("scripts/staticCopy.ts", "utf8").includes('label: "Complete beginner guide"'));
console.log("PASS published hubs: simulator-only derivatives, qualified editorial scope and virtual-only challenges");

console.log("PASS editorial audit: eight critical pages, six how-to sources, DCA and psychology consistency");

// Keep public feature descriptions consistent with the actual local mentor and
// server-scored duel implementation. This does not alter either feature.
const mentorHub = JSON.stringify(map.get("/ai-mentor"));
assert.match(mentorHub, /Chat does not call an AI provider/);
assert.doesNotMatch(mentorHub, /requests AI responses|AI responses depend|mentor will decline/);
assert.match(challengeHub, /final scores are frozen/);
assert.doesNotMatch(challengeHub, /are not frozen|very likely lose to them over a year/);
assert.doesNotMatch(JSON.stringify(map.get("/")), /Most beginners lose money not because/);
assert.doesNotMatch(JSON.stringify(map.get("/trade")), /see how the equity curve smooths out/);
assert.doesNotMatch(JSON.stringify(map.get("/reviews")), /product with no negative reviews is a product that removes/);
assert.match(aboutHub, /AI-assisted drafting/);
const aboutClient = readFileSync("src/pages/About.tsx", "utf8");
assert.match(aboutClient, /AI-assisted drafting/);
assert.doesNotMatch(aboutClient, /do not sell user data or run behavioural ads/);
assert.doesNotMatch(readFileSync("src/pages/Challenge.tsx", "utf8"), /figures originate in client-held simulator state/);
console.log("PASS public mentor, duel, publisher and hub claim consistency");
