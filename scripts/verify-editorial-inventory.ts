import assert from "node:assert/strict";
import { loadSiteData } from "./loadData";
import { uniqueRoutes } from "./routes";
import { buildContentMap } from "./content";
import { ASSET_REFERENCES } from "../src/lib/assetReferences";
import { LEARN_ARTICLES } from "../src/lib/learnArticles";
import { ARTICLE_REFERENCES } from "../src/lib/articleReferences";
import { GLOSSARY_WORKSHEETS } from "../src/lib/glossaryWorksheets";
import { ARTICLE_REFERENCES } from "../src/lib/articleReferences";
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
  assert.ok(article.sourceCheck.scope.startsWith("Limited "),
    `${article.slug}: explain narrow scope rather than asserting independent professional review`);
  assert.ok((ARTICLE_REFERENCES[article.slug] || []).some(reference => /^https:\/\//.test(reference.href)),
    `${article.slug}: published article must retain a real external HTTPS source`);
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
console.log("PASS complete published course manifest/quizzes, individual asset references/worksheets and scoped country sourcing");
