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

// A production URL-by-URL sweep on 20 October found these two initial HTML
// descriptions too short to explain the page. Preserve meaningful previews.
for (const [path, expectedTopic] of [
  ["/wiki/circuit-breaker", "circuit breakers"],
  ["/courses/futures-and-derivatives/hedging-with-futures", "futures hedges"],
] as const) {
  const description = routes.find((route) => route.path === path)?.description ?? "";
  assert.ok(description.length >= 85 && description.length <= 158,
    path + ": initial HTML meta description should be informative and concise");
  assert.ok(description.toLowerCase().includes(expectedTopic), path + ": topic must be clear in metadata");
}


const wikiClientSource = readFileSync("src/pages/WikiTerm.tsx", "utf8");
assert.ok(
  wikiClientSource.includes("<title>{term.term} — Explanation & Learning Exercise | TradeHQ Wiki</title>"),
  "Hydrated glossary title template differs from the initial HTML title"
);
for (const term of tradingGlossary) {
  const path = "/wiki/" + term.slug;
  const route = routes.find((r) => r.path === path);
  assert.equal(route?.title, `${term.term} — Explanation & Learning Exercise | TradeHQ Wiki`, path + ": misleading or inconsistent glossary title");
  assert.ok(map.get(path)?.sections.some((section) => section.h === "Worked exercise and its limits"), path + ": promised exercise missing");
}

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
// Distinct indexed how-to pages must offer an instrument-specific worked activity,
// not the same generic instruction on every route.
const specificHowtos = ["btc", "eth", "tsla", "nvda", "spy", "sol"];
for (const symbol of specificHowtos) {
  const asset = HOWTO_ASSETS.find(x => x.symbol === symbol);
  assert.ok(asset, "Missing individual how-to guide: " + symbol);
  assert.ok(asset.steps.every(s => !s.includes("Choose hypothetical quantity and price assumptions")),
    symbol + ": template-only order-size step returned");
  assert.ok(asset.steps.every(s => !s.includes("Record the reason for the exercise and any intended manual exit")),
    symbol + ": template-only review step returned");
  assert.ok(asset.steps.some(s => /\\$[\\d,]+|0\\.05 BTC|0\\.5 ETH/.test(s)),
    symbol + ": no instrument-specific numerical worksheet");
}
const learnCopy = JSON.stringify(map.get("/learn"));
assert.match(learnCopy, /For a concrete self-check, write down a quote price/);
assert.doesNotMatch(learnCopy, /A learning timeline varies by topic and prior experience/);

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

const glossaryCopy = JSON.stringify(tradingGlossary);
assert.doesNotMatch(glossaryCopy, /DCA removes these emotional obstacles|Liquidation occurs when losses exceed your margin deposit|Private exchanges for anonymous institutional block trading|Third, impermanent loss|Growing bars = accelerating momentum/);
assert.match(JSON.stringify(map.get("/daily")), /ten linked questions/);
assert.doesNotMatch(JSON.stringify(map.get("/daily")), /three checkable questions|three linked questions/);
assert.doesNotMatch(JSON.stringify(map.get("/how-to-trade")), /Copy the suggested first practice trade exactly|when during the day or week it is worth trading/);
assert.doesNotMatch(JSON.stringify(map.get("/wiki")), /same concept on a live chart in the simulator/);
assert.doesNotMatch(JSON.stringify(map.get("/leaderboard")), /habit that actually improves results/);
const fomcLesson = courseTracks.flatMap(track => track.lessons).find(lesson => lesson.slug === "the-fed-and-fomc-cycle")!;
assert.doesNotMatch(JSON.stringify(fomcLesson), /Each FOMC member.s rate forecast/);
assert.match(JSON.stringify(fomcLesson.quiz), /participant/);
const shellSource = readFileSync("index.html", "utf8");
const { ASSETS } = await loadSiteData();
assert.ok(shellSource.includes(`${ASSETS.length} simulated practice assets`), "Base structured data must agree with actual catalogue count");
assert.doesNotMatch(shellSource, /149 assets|149 simulated practice assets/);

// Recalculate explicit published teaching examples rather than assume passing
// string checks establish numerical accuracy. No order-engine logic is changed.
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.00001, `${a} != ${b}`);
// Gross targets can be net losses under the simulator's stated 0.1% fee.
close(95210 * 0.999 - 95120 * 1.001, -100.33);
close(95080 * 0.999 - 95120 * 1.001, -230.20);
close((95120 * 1.001 / 0.999) * 0.999 - 95120 * 1.001, 0);
// A loss budget based only on price distance omits transaction costs.
close(200 * (100 * 1.001 - 95 * 0.999), 1039);
const feeAwareUnitLoss = 100 * 1.001 - 95 * 0.999;
assert.equal(Math.floor(1000 / feeAwareUnitLoss), 192);
close(192 * feeAwareUnitLoss, 997.44);
assert.ok(193 * feeAwareUnitLoss > 1000);
close(0.52 * 1.5 - 0.48, 0.30); close(0.30 * 500 * 5, 750);
close(0.47 * 2 - 0.53, 0.41); close(0.43 * 2.5 - 0.57, 0.505);
close(0.57 * 1.2 - 0.43, 0.254); close(0.32 * 1.2 - 0.68, -0.296);
close((5 * 50 + 5.2 * 30 + 4.8 * 20) / 100, 5.02);
close((10 * 100 + 13 * 200) / 300, 12);
close(40 * 130 * 0.999 - 40 * 125 * 1.001, 189.8);
close(100000 - 5000 * 1.001 + 4900, 99895);
close((2000 + 8000 * 0.1) / 10000, 0.28);
close(5000 * 50, 250000); close(5000 * 5, 25000); close(0.25 * 5, 1.25);
close(2500 / 13000 * 100, 19.23076923076923);
for (const [price, gross] of [[175, -200], [182, 0], [190, 300]]) {
  const payoff = (Math.max(price - 180, 0) - Math.max(price - 185, 0)) * 100 - 200;
  close(payoff, gross); close(payoff - 8, gross - 8);
}
console.log("PASS residual glossary/hub/quiz claims, catalogue schema and independent strategy/payoff/fee arithmetic");
