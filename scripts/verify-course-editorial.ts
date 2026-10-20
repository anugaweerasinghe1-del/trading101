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

// Independent accounting checks for the newly completed exact-weight examples.
const fee = 0.001;
const sellToTarget = (equity: number, total: number, target: number) => (equity - target * total) / (1 - target * fee);
for (const [equity, cashBefore, target] of [[70000, 30000, 0.6], [60000, 40000, 0.5]]) {
  const sale = sellToTarget(equity, equity + cashBefore, target);
  const held = equity - sale, afterCash = cashBefore + sale * (1 - fee);
  assert.ok(Math.abs(held / (held + afterCash) - target) < 1e-12, "Fee-aware sale must restore the selected worksheet fraction");
}
const exactBuy = 25000 / 1.00025;
assert.ok(Math.abs(exactBuy / (100000 - exactBuy * fee) - 0.25) < 1e-12);
const sold = 10008, bought = 9992;
const finalEquity = 50000 - sold, finalBonds = 30000 + bought;
const finalCash = 20000 + sold * (1 - fee) - bought * (1 + fee);
assert.ok(Math.abs(finalCash - 19996) < 1e-8);
assert.equal(finalEquity / 99980, 0.4); assert.equal(finalBonds / 99980, 0.4);
for (const row of rows) {
  const candidate = applyCourseEditorialCorrections(row.document);
  const trackHtml = renderApprovedCourse('<html><head></head><body><div id="root"></div></body></html>', row.document)!;
  assert.match(trackHtml, /Who this course is not for/);
  assert.doesNotMatch(trackHtml, /<h2>Scope<\/h2>/);
  if (row.slug === "diversification-and-position-sizing") {
    assert.match(candidate.lessons[0].body.join(" "), /25,000\/1.00025/);
    assert.match(candidate.lessons[2].body.join(" "), /10,000\/0.9994/);
  } else {
    assert.match(candidate.lessons[2].body.join(" "), /10,000\/0.9995/);
    assert.doesNotMatch(candidate.lessons[0].body[4], /In the hypothetical two-venue worksheet/);
  }
  const later = structuredClone(row.document);
  later.lessons[0].body[2] = "Later owner-authored replacement in an inspected paragraph.";
  assert.equal(applyCourseEditorialCorrections(later).lessons[0].body[2], later.lessons[0].body[2]);
}
console.log("PASS exact fee-aware targets, explicit course exclusion heading and preservation of later paragraph edits");
