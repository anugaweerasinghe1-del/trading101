import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uniqueRoutes } from "./routes";
import { ASSETS } from "../src/lib/assets";
import { BITCOIN_SIMULATOR_SEO } from "../src/lib/bitcoinSimulatorSeo";
import { generateAssetMetaTitle, generateAssetMetaDescription } from "../src/lib/assetContent";
import { tradeReviewQuestion } from "../src/lib/tradeReviewQuestions";
import { tradeReviewStage, TRADE_REVIEW_LESSON, TRADE_RECALL_LESSON, TRADE_REVIEW_TRACK } from "../src/lib/retentionLearning";
import { recordConsentedLearningVisit, trackLearningMilestone, LEARNING_VISIT_KEY } from "../src/lib/learningTelemetry";
import { ARENA_ANALYTICS_CONSENT_KEY } from "../src/lib/arenaTelemetry";
import type { CourseProgressState } from "../src/lib/courseProgress";

const files = (path: string) => readFileSync(path, "utf8");
const btc = ASSETS.find(asset => asset.id === "btc");
assert.ok(btc, "Published BTC asset must exist");
const routes = uniqueRoutes();
const route = routes.find(row => row.path === "/trade/btc");
assert.ok(route && !route.noindex, "Preserve the already-indexed Bitcoin simulator URL");
assert.deepEqual(
  [route.title, route.description, route.h1],
  [BITCOIN_SIMULATOR_SEO.title, BITCOIN_SIMULATOR_SEO.description, BITCOIN_SIMULATOR_SEO.h1],
  "Prerendered title, description and primary heading must match the shared authored copy",
);
assert.equal(generateAssetMetaTitle(btc), route.title, "Hydrated document title matches no-JS metadata");
assert.equal(generateAssetMetaDescription(btc), route.description, "Hydrated description matches no-JS metadata");
assert.equal(route.description.length <= 165, true);
assert.equal(route.title.includes("Bitcoin Simulator"), true);
const eth = routes.find(row => row.path === "/trade/eth");
assert.ok(eth && eth.title.includes("Paper Trade"), "Do not mass rewrite other existing search winners");
const asset = files("src/pages/TradeAsset.tsx");
assert.match(asset, /BITCOIN_SIMULATOR_SEO\.h1/, "Hydrated H1 uses the same text");
assert.match(asset, /id === "btc"/, "Only BTC gets this entry block");
assert.match(asset, /Bitcoin beginner guide/, "Guide is reachable from the existing simulator page");
assert.match(asset, /to="\/wiki\/paper-trading"/, "Educational glossary context is one click away");
assert.match(asset, /No signup required/, "The user can practise without a forced account");
assert.match(asset, /simulated 0\.1% fee/, "Simulation scope and fees remain explicit");
assert.doesNotMatch(asset, /setTimeout\(|autoExecuteTrade/, "No forced or timed trades");

const DAY = 86_400_000;
const buy = tradeReviewQuestion("buy", false, 2 * DAY);
const sell = tradeReviewQuestion("sell", false, 2 * DAY);
assert.equal(buy.correctIndex, 1, "Correct answer must not always be the first radio");
assert.equal(sell.correctIndex, 2, "Sell review uses the net proceeds answer");
assert.match(buy.explanation, /simulated buy/i);
const variants = new Set<string>();
const positions = new Set<number>();
for (let i = 0; i < 8; i++) {
  const question = tradeReviewQuestion("buy", true, (21_000 + i) * DAY);
  variants.add(question.id);
  positions.add(question.correctIndex);
  assert.equal(question.options.length, 3);
  assert.ok(question.options[question.correctIndex] && question.explanation.length > 35);
}
assert.equal(variants.size, 4, "Four varied recall prompts rotate across calendar days");
assert.ok(positions.has(0) && positions.has(1) && positions.has(2), "Answers must not all sit in the same position");
assert.deepEqual(tradeReviewQuestion("buy", true, 24_000 * DAY), tradeReviewQuestion("sell", true, 24_000 * DAY), "Recall is about universal mechanics, not asset recommendations");
const now = 24_000 * DAY;
const progress: CourseProgressState = {
  v: 1,
  updatedAt: new Date(now).toISOString(),
  tracks: { [TRADE_REVIEW_TRACK]: { lessons: {
    [TRADE_REVIEW_LESSON]: { status: "completed", score: 100, completedAt: new Date(now - 5 * DAY).toISOString() },
    [TRADE_RECALL_LESSON]: { status: "completed", score: 0, completedAt: new Date(now - 25 * 3_600_000).toISOString() },
  } } },
};
assert.equal(tradeReviewStage(progress, now), "recall", "A wrong answer can be reviewed after a day");
progress.tracks[TRADE_REVIEW_TRACK].lessons[TRADE_RECALL_LESSON].score = 100;
assert.equal(tradeReviewStage(progress, now), "recent", "A correct result rests for three days");
progress.tracks[TRADE_REVIEW_TRACK].lessons[TRADE_RECALL_LESSON].completedAt = new Date(now - 73 * 3_600_000).toISOString();
assert.equal(tradeReviewStage(progress, now), "recall", "Correct knowledge can still be reviewed after several days");

const review = files("src/pages/TradeLearningReview.tsx");
assert.match(review, /tradeReviewQuestion\(side, recall\)/);
assert.match(review, /didAnswerCorrectly \? 100 : 0/);
assert.match(review, /lessonQuestion\.explanation/);
assert.doesNotMatch(review, /executeTrade|record_practice_trade|sendNotification|sendEmail/, "Knowledge checks must never make a trade or send a reminder");

const oldWindow = (globalThis as { window?: unknown }).window;
const events: { name: string; props?: Record<string, number> }[] = [];
const store = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
  },
  __tradehqAmplitudeStarted: true,
  amplitude: { track: (name: string, props?: Record<string, number>) => { events.push({ name, props }); } },
};
recordConsentedLearningVisit(new Date("2026-11-20T10:00:00Z"));
trackLearningMilestone("Trade Review Completed");
assert.equal(events.length, 0, "No analytics or cookie before explicit consent");
assert.equal(store.has(LEARNING_VISIT_KEY), false);
store.set(ARENA_ANALYTICS_CONSENT_KEY, "accepted");
recordConsentedLearningVisit(new Date("2026-11-20T10:00:00Z"));
recordConsentedLearningVisit(new Date("2026-11-21T09:00:00Z"));
trackLearningMilestone("Quick Read Completed");
assert.deepEqual(events.map(e => e.name), [
  "TradeHQ Learning Viewed", "TradeHQ Learning Viewed", "TradeHQ Learning Returned", "TradeHQ Quick Read Completed",
]);
assert.deepEqual(events[2].props, { days_since_learning_visit: 1 });
store.set(ARENA_ANALYTICS_CONSENT_KEY, "rejected");
trackLearningMilestone("Trade Review Completed");
assert.equal(events.length, 4, "Consent withdrawal immediately blocks later analytics");
(globalThis as { window?: unknown }).window = oldWindow;
assert.match(files("src/pages/LessonDetail.tsx"), /recordConsentedLearningVisit/);
assert.match(review, /recordConsentedLearningVisit/);
console.log("PASS BTC SEO consistency, educational on-ramp, varied recall and consent-gated return signals");
