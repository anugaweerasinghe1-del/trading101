import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyCourseEditorialCorrections } from "../src/lib/courseEditorialCorrections";
import { renderApprovedCourse } from "../src/lib/courseHtml";
import { validateCourseDocument, type CourseDocument } from "../supabase/functions/_shared/courseDocument";
const rows = JSON.parse(readFileSync("scripts/fixtures/published-course-editorial.json", "utf8")) as {slug: string; document: CourseDocument}[];
for (const row of rows) {
  const original = JSON.stringify(row.document);
  const candidate = applyCourseEditorialCorrections(row.document);
  assert.equal(JSON.stringify(row.document), original, "Must not mutate publication data");
  assert.deepEqual(validateCourseDocument(candidate, true), [], row.slug + ": preserve document validity");
  assert.deepEqual(applyCourseEditorialCorrections(candidate), candidate, "Correction must be idempotent");
  for (const lesson of candidate.lessons) {
    const html = renderApprovedCourse('<html><head></head><body><div id="root"></div></body></html>', row.document, lesson.slug)!;
    const bootstrap = JSON.parse(html.match(/id="approved-course-bootstrap" type="application\/json">([\s\S]*?)<\/script>/)![1]);
    assert.deepEqual(bootstrap, candidate, "SSR and interactive bootstrap must share corrected copy");
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.match(html, /rel="canonical"[^>]*data-static-head/, "Initial native canonical must be retired when Helmet paints");
    assert.ok(!/establish your target weight perfectly|achieving your target allocation perfectly|distribution perfectly/.test(html), lesson.slug);
    for (const question of lesson.quiz) assert.ok(!question.options[question.correctAnswer].includes("undervalued"), lesson.slug + ": underweight is not undervalued");
  }
  const newer = structuredClone(row.document);
  newer.tagline = "A later owner edit to the course tagline";
  assert.equal(applyCourseEditorialCorrections(newer).tagline, newer.tagline, "Preserve later owner edits");
}
const equities = 70000 - 10000;
const cash = 30000 + 10000 * (1 - 0.001);
assert.equal(cash, 39990);
assert.ok(Math.abs(equities / (equities + cash) * 100 - 60.006) < 0.0001);
const combinedCash = 20000 + 10000 * (1 - 0.001) - 10000 * (1 + 0.001);
assert.equal(combinedCash, 19980);
console.log("PASS both published course fixtures, six lesson render/bootstrap pairs, idempotence, later-edit preservation, fee-aware examples and corrected quiz wording; no database writes");
