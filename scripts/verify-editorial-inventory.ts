import assert from "node:assert/strict";
import { loadSiteData } from "./loadData";
import { uniqueRoutes } from "./routes";
import { buildContentMap } from "./content";
import { ASSET_REFERENCES } from "../src/lib/assetReferences";
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
for (const route of routes.filter(route => route.path.startsWith("/trade/") && !route.noindex)) {
  const id = route.path.split("/").pop()!;
  const reference = ASSET_REFERENCES[id];
  assert.ok(reference, `${id}: indexable asset requires an explicit reference and distinct exercise`);
  assert.ok(content.get(route.path)?.links.some(link => link.href === reference.href));
  assert.ok(content.get(route.path)?.sections.some(section => section.p?.includes(reference.exercise)));
}
assert.equal(new Set(Object.values(ASSET_REFERENCES).map(reference => reference.exercise)).size, Object.keys(ASSET_REFERENCES).length);
for (const country of data.COUNTRY_GUIDES) assert.ok(country.sources.length && country.sourceCheck.scope.includes("no verification"));
console.log("PASS complete published course manifest/quizzes, individual asset references/worksheets and scoped country sourcing");
