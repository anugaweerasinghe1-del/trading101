/** Structural regression coverage; passing is not an AdSense approval claim. */
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { uniqueRoutes, DOMAIN } from "./routes";
import { buildContentMap } from "./content";
import { loadSiteData } from "./loadData";
import { GLOSSARY_WORKSHEETS } from "../src/lib/glossaryWorksheets";
import { isClientFallbackRoute } from "../src/lib/clientFallbackRoutes";

const routes = uniqueRoutes();
const manifest = new Map(routes.map(route => [route.path, route]));
const content = await buildContentMap();
const data = await loadSiteData();
const sitemap = readFileSync("dist/sitemap.xml", "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(new Set(urls).size, urls.length, "Duplicate sitemap locations");
assert.deepEqual([...urls].sort(), routes.filter(route => !route.noindex).map(route => DOMAIN + route.path).sort());
const redirects = JSON.parse(readFileSync("vercel.json", "utf8")).redirects;
const aliases = new Set(redirects.map(rule => rule.source));
const titles = new Set<string>();
const descriptions = new Set<string>();
const broken: string[] = [];
const duplicates: string[] = [];
let internalLinks = 0;
for (const route of routes) {
  const file = route.path === "/" ? "dist/index.html" : `dist${route.path}/index.html`;
  const html = readFileSync(file, "utf8");
  const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)];
  assert.equal(canonicals.length, 1, route.path + ": one canonical");
  assert.equal(canonicals[0][1], DOMAIN + route.path, route.path + ": canonical consistency");
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, route.path + ": one initial H1");
  assert.equal(/name="robots" content="noindex/.test(html), !!route.noindex, route.path + ": robots parity");
  if (route.noindex) continue;
  assert.ok(!titles.has(route.title), route.path + ": duplicate title"); titles.add(route.title);
  assert.ok(!descriptions.has(route.description), route.path + ": duplicate description"); descriptions.add(route.description);
  assert.ok(route.description.trim() && route.h1.trim(), route.path + ": metadata");
  const page = content.get(route.path)!;
  assert.ok(page?.sections.length, route.path + ": authored content required");
  const seen = new Set<string>();
  for (const section of page.sections) for (const paragraph of section.p || []) {
    if (paragraph.length < 100) continue;
    if (seen.has(paragraph)) duplicates.push(route.path + ": " + paragraph.slice(0, 90));
    seen.add(paragraph);
  }
  for (const link of page.links) {
    if (!link.href.startsWith("/") || link.href.startsWith("//")) continue;
    internalLinks++;
    const path = new URL(link.href, DOMAIN).pathname.replace(/\/$/, "") || "/";
    if (!manifest.has(path) && !aliases.has(path) && !isClientFallbackRoute(path) && !existsSync("public" + path)) broken.push(route.path + " → " + path);
  }
}
assert.deepEqual(broken, [], "Broken internal publisher links");
assert.deepEqual(duplicates, [], "Duplicate paragraphs within a page");
assert.deepEqual(Object.keys(GLOSSARY_WORKSHEETS).sort(), data.tradingGlossary.map(term => term.slug).sort());
assert.equal(new Set(Object.values(GLOSSARY_WORKSHEETS).map(item => item.exercise)).size, data.tradingGlossary.length);
for (const term of data.tradingGlossary) {
  const page = content.get("/wiki/" + term.slug)!;
  const worksheet = GLOSSARY_WORKSHEETS[term.slug];
  assert.ok(worksheet.references.length && worksheet.exercise, term.slug);
  assert.ok(page.sections.some(section => section.p?.includes(worksheet.exercise)), term.slug + ": exercise not prerendered");
  for (const reference of worksheet.references) assert.ok(page.links.some(link => link.href === reference.href), term.slug + ": reference missing");
  for (const related of term.relatedTerms) assert.ok(manifest.has("/wiki/" + related), term.slug + ": broken related term " + related);
}
for (const route of routes.filter(route => /^(\/wiki\/|\/learn\/article\/|\/courses\/[^/]+\/)/.test(route.path))) {
  assert.ok(content.get(route.path)?.links.some(link => link.href.startsWith("https://")), route.path + ": clickable external reference required");
}
// Independently recompute the educational examples and test adverse cases.
const near = (actual: number, expected: number, tolerance = 0.005) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
near((100 / 10 + 100 / 8 + 100 / 12) * 12 - 300, 70);
near((100 / 10 + 100 / 5) * 5 - 200, -50);
near((10 * 100 + 30 * 104) / 40, 103);
near(10 * 19 * (1 - 0.001) - 10 * 20 * (1 + 0.001), -10.39);
near(2 * Math.sqrt(2) / 3 - 1, -0.05719, 0.00001);
near((100000 - 80000) / 100000, 0.2);
near(100000 / 80000 - 1, 0.25);
near(0.25 * 3 - 0.75 * 1, 0);
assert.ok(0.25 * 3 - 0.75 * 1 - 0.01 < 0, "Costs turn gross break-even into loss");
for (const track of data.courseTracks) for (const lesson of track.lessons) for (const quiz of lesson.quiz) {
  assert.ok(quiz.options[quiz.correctAnswer] && quiz.explanation.trim(), lesson.slug + ": invalid quiz answer");
  assert.ok(!/surfaces real edge|preferred recession spread|Consistent P&L comes/.test(JSON.stringify(quiz)), lesson.slug + ": unsupported quiz claim");
}
assert.ok(content.get("/learn")?.sections.length);
assert.ok(readFileSync("scripts/routes.ts", "utf8").includes("${tradingGlossary.length}-term"), "Glossary count must derive from data");
const result = { routes: routes.length, sitemapURLs: urls.length, intentionallyNoindex: routes.length - urls.length, internalLinks, worksheets: data.tradingGlossary.length, calculations: 9, checks: "PASS", scope: "compiled metadata, content graph, duplicate paragraphs, reference presence, quiz structure and known numerical examples; not financial-source validation or browser proof" };
if (process.env.TRADEHQ_VERIFICATION_OUTPUT) writeFileSync(process.env.TRADEHQ_VERIFICATION_OUTPUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
