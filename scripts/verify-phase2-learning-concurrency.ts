import assert from "node:assert/strict";
import { convergeLearningProgress } from "../src/lib/learningCloudConvergence.ts";
import { parseCourseProgress } from "../src/lib/courseProgress.ts";
import { parseJourneyProgress } from "../src/lib/beginnerJourney.ts";
const state = (slug: string) => ({
  courses: parseCourseProgress(JSON.stringify({
    v: 1, tracks: { [slug]: { lessons: { intro: { status: "completed", score: 4 } } } },
    updatedAt: "2026-11-02T11:00:00Z",
  })),
  journey: parseJourneyProgress({ version: 1, lessonCompleted: true, tradeId: null,
    portfolioExplained: false, reflection: "", updatedAt: "2026-11-02T11:00:00Z" }),
});
const a = state("course-a"), b = state("course-b");
let remote = { ...state("baseline"), updated_at: "2026-11-02T10:00:00Z" };
let conflict = false, writes = 0;
const copy = () => JSON.parse(JSON.stringify(remote));
const io = {
  read: async () => copy(),
  insert: async () => { throw Error("Unexpected insert"); return false; },
  updateIfUnchanged: async (merged: typeof a, version: string) => {
    if (!conflict) {
      remote = { ...b, updated_at: "2026-11-02T11:01:00Z" };
      conflict = true;
      return false;
    }
    assert.equal(version, remote.updated_at);
    remote = { ...merged, updated_at: "2026-11-02T11:02:00Z" };
    writes++;
    return true;
  },
};
const result = await convergeLearningProgress(() => a, io, () => true);
for (const name of ["course-a", "course-b"]) {
  assert.equal(result.courses.tracks[name].lessons.intro.status, "completed");
  assert.equal(remote.courses.tracks[name].lessons.intro.status, "completed");
}
assert.equal(writes, 1);
await assert.rejects(
  convergeLearningProgress(() => state("course-c"), { ...io, updateIfUnchanged: async () => false }, () => true, 2),
  /changed on another device/,
);
assert.equal(writes, 1, "A failed write must never overwrite server data");
console.log("PASS concurrent account lesson progress: retry merges both devices and fails closed");
