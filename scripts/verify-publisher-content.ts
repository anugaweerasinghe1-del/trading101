import "./verify-first32-reference-scope";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { uniqueRoutes } from "./routes";
import { PublisherNotes } from "../src/components/PublisherNotes";

const routes = uniqueRoutes();
const sitemap = readFileSync("dist/sitemap.xml", "utf8");
let checked = 0;
for (const route of routes) {
  const html = readFileSync(`dist${route.path === "/" ? "" : route.path}/index.html`, "utf8");
  const embedded = html.match(/<script id="publisher-notes-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (route.noindex) {
    assert.equal(embedded, undefined, `${route.path}: utility route has no publisher notes`);
    assert.ok(!sitemap.includes(`<loc>https://www.thetradehq.com${route.path}</loc>`));
    continue;
  }
  assert.ok(embedded, `${route.path}: missing initial notes`);
  const page = JSON.parse(embedded!);
  assert.equal(page.path, route.path);
  assert.ok(html.includes(renderToStaticMarkup(React.createElement(PublisherNotes, { page }))), `${route.path}: shared React content must match initial HTML`);
  const json = JSON.parse(readFileSync(`dist/publisher-notes${route.path === "/" ? "" : route.path}/index.json`, "utf8"));
  assert.deepEqual(json, page, `${route.path}: SPA navigation payload must match initial content`);
  checked++;
}
const shortSqueeze = routes.find(r => r.path === "/wiki/short-squeeze")!;
assert.match(shortSqueeze.description, /short|squeeze/i);
assert.ok(shortSqueeze.description.length > 80, "short-squeeze description must not be truncated at an apostrophe");
assert.ok(routes.find(r => r.path === "/trade/pep")?.noindex);
const beginnerGuide = routes.find(r => r.path === "/learn-trading-guide")!;
assert.equal(beginnerGuide.h1, "Beginner Trading Practice Guide");
assert.doesNotMatch(beginnerGuide.summary, /single long-form|complete beginner|first informed trade/i);
const guideHtml = readFileSync("dist/learn-trading-guide/index.html", "utf8");
assert.match(guideHtml, /loss of \$40\.96/, "guide should show fee-aware downside arithmetic");
assert.match(guideHtml, /gain of \$38\.96/, "guide should include an alternative outcome");
assert.doesNotMatch(guideHtml, /single long-form|This sample calculation/, "remove misleading or unfinished guide claims");
assert.equal(Math.round(((460 - 0.46) - (500 + 0.50)) * 100), -4096);
assert.equal(Math.round(((540 - 0.54) - (500 + 0.50)) * 100), 3896);
const guideClient = readFileSync("src/pages/LearnTradingGuide.tsx", "utf8");
assert.match(guideClient, /Beginner Trading Practice Guide/);
assert.doesNotMatch(guideClient, /Institutional Grade Education|high-fidelity simulator|Bitcoin scaling topics/, "remove unsupported promises from hydrated UI");

console.log(`PASS publisher content equivalence: ${checked} indexable snapshots and navigation payloads; utility exclusion and short-squeeze metadata`);

// Exercise the deployed fallback handler and hosting rules against this actual build.
await import("./verify-public-fallbacks");


/** Guard against editorial claims that exceed the actual consent and review flow. */
const newsletterHtml = readFileSync("dist/newsletter/index.html", "utf8");
const reviewsHtml = readFileSync("dist/reviews/index.html", "utf8");
const newsletterPage = readFileSync("src/pages/NewsletterPage.tsx", "utf8");
const reviewPage = readFileSync("src/pages/Reviews.tsx", "utf8");
assert.match(newsletterHtml, /six-digit verification code/);
assert.match(newsletterHtml, /confirms using either method/);
assert.match(newsletterPage, /This link is missing a valid token/);
assert.doesNotMatch(reviewsHtml, /Read honest reviews|The only thing at stake is your time/);
assert.match(reviewsHtml, /Reviewer identity and usage are not independently verified/);
assert.match(reviewPage, /Do not include private or identifying information/);
assert.match(reviewPage, /displayed review/);
assert.doesNotMatch(readFileSync("dist/privacy/index.html", "utf8"), /Contact messages: kept only as long as needed to answer you/);
