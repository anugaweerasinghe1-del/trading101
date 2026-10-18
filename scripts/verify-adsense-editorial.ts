/**
 * Content integrity gate for the 18 October 2026 AdSense editorial audit.
 * This prevents known copy-template leakage and misleading claims from
 * silently returning to the crawler-visible and interactive pages.
 * Passing it is necessary, not sufficient, for AdSense approval.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HOWTO_ASSETS, STRATEGIES } from "../src/lib/seoData";
import { courseTracks } from "../src/lib/coursesData";
import { uniqueRoutes } from "./routes";
import { buildContentMap } from "./content";

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
console.log("PASS editorial audit: eight critical pages, six how-to sources, DCA and psychology consistency");
