import assert from "node:assert/strict";
import { loadSiteData } from "./loadData";
import { uniqueRoutes } from "./routes";
import { buildContentMap } from "./content";
import { ASSET_REFERENCES } from "../src/lib/assetReferences";
import { LEARN_ARTICLES } from "../src/lib/learnArticles";
import { ARTICLE_REFERENCES } from "../src/lib/articleReferences";
import { GLOSSARY_WORKSHEETS } from "../src/lib/glossaryWorksheets";
const data = await loadSiteData();
const routes = uniqueRoutes();
const content = await buildContentMap();
for (const track of data.courseTracks) for (const lesson of track.lessons) {
  const path = `/courses/${track.slug}/${lesson.slug}`;
  assert.ok(routes.some(route => route.path === path && !route.noindex), `Published lesson missing from manifest: ${path}`);
  assert.ok(content.get(path)?.sections.length, path);
  assert.equal(lesson.quiz.length, 4, `${path}: preserve complete quiz`);
  for (const quiz of lesson.quiz) assert.ok(quiz.correctAnswer >= 0 && quiz.correctAnswer < quiz.options.length);
  assert.ok(Array.isArray(lesson.sources) && lesson.sources.length >= 2,
    `${path}: lessons must provide at least two reference entries`);
  assert.ok(lesson.sources.some(source => /^https:\/\/[^\s]+$/.test(source.url)),
    `${path}: lesson must provide an external source with an HTTPS URL`);
}
for (const article of LEARN_ARTICLES) {
  assert.ok(article.sourceCheck && /^2026-\d{2}-\d{2}$/.test(article.sourceCheck.date),
    `${article.slug}: source-check date must reflect a documented actual check`);
  assert.ok(article.sourceCheck.scope.length >= 50 &&
    !/fully verified|independently certified|complete professional review/i.test(article.sourceCheck.scope),
    `${article.slug}: describe actual source-check scope without false certification`);
  assert.ok((ARTICLE_REFERENCES[article.slug] || []).some(reference => /^https:\/\//.test(reference.href)),
    `${article.slug}: published article must retain a real external HTTPS source`);
}
for (const article of LEARN_ARTICLES) {
  const editorial = content.get(`/learn/article/${article.slug}`)?.sections.find(section => section.h === "Publisher and editorial transparency");
  assert.ok(editorial?.p?.some(paragraph =>
    paragraph.includes(`limited source check dated ${article.sourceCheck!.date}`) &&
    paragraph.includes("no independent professional review is claimed") &&
    !paragraph.includes("no recorded editorial review date")),
    `${article.slug}: show limited dated source check accurately in crawler-visible note`);
}
console.log("PASS all static article source checks are scoped and references retained");
for (const route of routes.filter(route => route.path.startsWith("/trade/") && !route.noindex)) {
  const id = route.path.split("/").pop()!;
  const reference = ASSET_REFERENCES[id];
  assert.ok(reference, `${id}: indexable asset requires an explicit reference and distinct exercise`);
  assert.ok(content.get(route.path)?.links.some(link => link.href === reference.href));
  assert.ok(content.get(route.path)?.sections.some(section => section.p?.includes(reference.exercise)));
}
assert.equal(new Set(Object.values(ASSET_REFERENCES).map(reference => reference.exercise)).size, Object.keys(ASSET_REFERENCES).length);
for (const country of data.COUNTRY_GUIDES) assert.ok(country.sources.length && country.sourceCheck.scope.includes("no verification"));
// DeepSeek's two named "empty sources" examples must stay visibly source-backed.
const fomo = GLOSSARY_WORKSHEETS.fomo;
assert.ok(fomo?.references.length > 0, "FOMO worksheet must have an actual citation");
assert.ok(fomo.references.every(reference => /^https:\/\//.test(reference.href)), "FOMO references must have HTTPS URLs");
const paperSources = ARTICLE_REFERENCES["what-is-paper-trading"];
assert.ok(paperSources?.length > 0, "Paper-trading article must have real source links");
assert.ok(paperSources.every(source => /^https:\/\//.test(source.href)), "Paper-trading references must have HTTPS URLs");
console.log("PASS curated FOMO and paper trading references are non-empty and HTTPS");
// Every published glossary entry must retain a substantive exercise and a
// visible, labelled external HTTPS reference. Prevent future empty-source pages.
for (const term of data.tradingGlossary) {
  const path = `/wiki/${term.slug}`;
  const worksheet = GLOSSARY_WORKSHEETS[term.slug];
  assert.ok(worksheet?.exercise?.length >= 80,
    `${path}: missing substantive authored exercise`);
  assert.ok(worksheet.references.length > 0,
    `${path}: no external reference entries`);
  for (const source of worksheet.references) {
    assert.ok(/^https:\/\/[^\s]+$/.test(source.href) && source.label?.trim(),
      `${path}: missing labelled HTTPS reference`);
    assert.ok(content.get(path)?.links.some(link => link.href === source.href),
      `${path}: source not visible in publisher content`);
  }
}
console.log("PASS all glossary exercises and visible HTTPS references");
for (const slug of ["short-squeeze", "rsi-divergence"]) {
  const note = GLOSSARY_WORKSHEETS[slug]?.sourceCheck;
  assert.equal(note?.date, "2026-11-01", `${slug}: expected real, scoped check date`);
  assert.ok(note.scope.length > 130 && /no |not /i.test(note.scope),
    `${slug}: source-check limitations missing`);
  const published = content.get(`/wiki/${slug}`)?.sections.find(section => section.h === "Publisher and editorial transparency");
  assert.ok(published?.p?.some(p => p.includes("2026-11-01") && p.includes("not independent professional review")),
    `${slug}: limited check not visible to crawlers`);
}
console.log("PASS narrow, truthful dated glossary checks");
console.log("PASS complete published course manifest/quizzes, individual asset references/worksheets and scoped country sourcing");


const reviewedOptionsTrack = data.courseTracks.find(track => track.slug === "options-trading-fundamentals");
assert.ok(reviewedOptionsTrack);
assert.match(reviewedOptionsTrack.prerequisites, /No prior trade or minimum practice time is required/);
const reviewedOptionsLessons = reviewedOptionsTrack.lessons;
assert.equal(reviewedOptionsLessons.length, 5);
assert.ok(reviewedOptionsLessons.every(lesson => lesson.quiz.length === 4));
const reviewedIntro = reviewedOptionsLessons.find(lesson => lesson.slug === "what-is-an-option");
assert.ok(reviewedIntro);
assert.match(reviewedIntro.body.join(" "), /total premium can rise or fall/);
assert.match(reviewedIntro.body.join(" "), /gross break-even/);
const reviewedIV = reviewedOptionsLessons.find(lesson => lesson.slug === "implied-volatility-and-earnings");
assert.ok(reviewedIV);
assert.match(reviewedIV.body.join(" "), /usual calculation is undefined/);
assert.equal(reviewedIV.quiz[0].correctAnswer, 1);
assert.match(reviewedIV.quiz[0].options[1], /observed range/);
const reviewedGreeks = reviewedOptionsLessons.find(lesson => lesson.slug === "the-greeks-delta-gamma-theta-vega");
assert.ok(reviewedGreeks);
assert.equal(reviewedGreeks.quiz[2].correctAnswer, 1);
assert.match(reviewedGreeks.quiz[2].explanation, /not inevitable/);


const reviewedMacroTrack = data.courseTracks.find(track => track.slug === "macro-reading-for-traders");
assert.ok(reviewedMacroTrack);
assert.equal(reviewedMacroTrack.lessons.length, 5);
assert.ok(reviewedMacroTrack.lessons.every(lesson => lesson.quiz.length === 4));
const checkedMacroCpi = reviewedMacroTrack.lessons.find(lesson => lesson.slug === "reading-cpi-and-inflation");
assert.ok(checkedMacroCpi);
assert.match(checkedMacroCpi.body.join(" "), /sampled prices and expenditure weights/);
assert.ok(checkedMacroCpi.sources.some(source => source.url === "https://www.bls.gov/schedule/news_release/cpi.htm"));
const checkedMacroFed = reviewedMacroTrack.lessons.find(lesson => lesson.slug === "the-fed-and-fomc-cycle");
assert.ok(checkedMacroFed);
assert.match(checkedMacroFed.body.join(" "), /strategy-only meeting/);
assert.match(checkedMacroFed.body.join(" "), /November 12, 2026/);
assert.ok(checkedMacroFed.sources.some(source => source.url.endsWith("monetary20261112a.htm")));
const checkedMacroCurve = reviewedMacroTrack.lessons.find(lesson => lesson.slug === "the-yield-curve-and-recession");
assert.ok(checkedMacroCurve);
assert.match(checkedMacroCurve.body.join(" "), /one month through thirty years/);
assert.match(checkedMacroCurve.body.join(" "), /twelve months ahead/);
assert.match(checkedMacroCurve.body.join(" "), /official Federal Reserve forecasts/);


const reviewedBehaviourTrack = data.courseTracks.find(track => track.slug === "trading-psychology-mastery");
assert.ok(reviewedBehaviourTrack);
assert.equal(reviewedBehaviourTrack.lessons.length, 5);
const reviewedReminder = reviewedBehaviourTrack.lessons.find(lesson => lesson.slug === "revenge-trading-and-tilt");
assert.ok(reviewedReminder);
assert.match(reviewedReminder.summary, /does not reveal someone's emotional state/);
assert.equal(reviewedReminder.quiz[0].correctAnswer, 1);
const reviewedFuturesTrack = data.courseTracks.find(track => track.slug === "futures-and-derivatives");
assert.ok(reviewedFuturesTrack);
assert.equal(reviewedFuturesTrack.lessons.length, 5);
for (const lesson of reviewedFuturesTrack.lessons) {
  assert.equal(lesson.quiz.length, 4);
  assert.equal(new Set(lesson.sources.map(s => s.url)).size, lesson.sources.length);
}
const reviewedMicro = reviewedFuturesTrack.lessons.find(lesson => lesson.slug === "micro-futures-for-beginners");
assert.ok(reviewedMicro);
assert.match(reviewedMicro.keyTakeaways.join(" "), /not a complete product catalogue/);
assert.doesNotMatch(reviewedMicro.keyTakeaways.join(" "), /let beginners scale/);
