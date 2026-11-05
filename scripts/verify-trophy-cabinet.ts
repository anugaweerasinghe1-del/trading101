import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPersonalTrophyCabinet, type TrophyCatalogTrack } from "../src/lib/learningAchievements.ts";
import { parseCourseProgress } from "../src/lib/courseProgress.ts";

const catalog: TrophyCatalogTrack[] = [
  { slug: "course-a", title: "Course A", badge: { name: "A completed" }, lessons: [{ slug: "one" }, { slug: "two" }] },
  { slug: "course-b", title: "Course B", badge: { name: "B completed" }, lessons: [{ slug: "three" }] },
  { slug: "course-a", title: "Duplicated Course A", badge: { name: "Duplicated" }, lessons: [{ slug: "one" }] },
];
const progress = parseCourseProgress(JSON.stringify({
  v: 1, tracks: {
    "course-a": { badgeEarnedAt: "2026-10-02T00:00:00Z", lessons: {
      one: { status: "completed", score: 3, completedAt: "2026-10-02T00:00:00Z" },
      two: { status: "in-progress" },
      forged: { status: "completed" },
    } },
    "forged-unknown-track": { badgeEarnedAt: "2026-10-03T00:00:00Z",
      lessons: { fake: { status: "completed" } } },
  }, updatedAt: "2026-10-04T00:00:00Z",
}));
const snapshot = buildPersonalTrophyCabinet(catalog, progress);
assert.equal(snapshot.completedLessons, 1, "Unknown lessons and courses cannot inflate milestones");
assert.equal(snapshot.availableLessons, 3, "Duplicate tracks cannot inflate target counts");
assert.equal(snapshot.completedCourses, 0, "Forged/legacy badge timestamp is not sufficient to complete course");
assert.equal(snapshot.archivedBadgeCount, 1, "Archived personal badge survives without being promoted to award");
assert.equal(snapshot.badges.length, 2);
assert.equal(snapshot.badges[0].previouslyRecorded, true);
assert.equal(snapshot.badges[0].complete, false);
assert.equal(snapshot.milestones.find(x => x.id === "first-lesson")?.earned, true);
assert.equal(snapshot.milestones.find(x => x.id === "first-course")?.earned, false);
assert.equal(snapshot.milestones.find(x => x.id === "five-lessons")?.earned, false);

const completed = parseCourseProgress(JSON.stringify({
  v: 1, tracks: {
    "course-a": { lessons: { one: { status: "completed" }, two: { status: "completed" } } },
    "course-b": { lessons: { three: { status: "completed" } } },
  }, updatedAt: "2026-10-05T00:00:00Z",
}));
const after = buildPersonalTrophyCabinet(catalog, completed);
assert.equal(after.completedCourses, 2);
assert.equal(after.completedLessons, 3);
assert.equal(after.milestones.find(x => x.id === "first-course")?.earned, true);
assert.equal(after.milestones.find(x => x.id === "three-courses")?.earned, false);
assert.equal(after.badges.find(x => x.slug === "course-b")?.complete, true);
assert.equal(buildPersonalTrophyCabinet([], progress).milestonesEarned, 0);

const read = (path: string) => readFileSync(path, "utf8");
const app = read("src/App.tsx");
const page = read("src/pages/TrophyCabinet.tsx");
const learn = read("src/pages/Learn.tsx");
const profile = read("src/pages/TraderProfile.tsx");
const routes = read("scripts/routes.ts");
const fallback = read("src/lib/clientFallbackRoutes.ts");
const publicProfile = read("src/pages/PublicTrader.tsx");
assert.match(app, /path="\/achievements" element={<TrophyCabinet\/>}/);
assert.match(page, /noindex, follow/);
assert.match(page, /not a verified public award/i);
assert.match(page, /does not publish trophies/i);
assert.match(learn, /to="\/achievements"/);
assert.match(profile, /to="\/achievements"/);
assert.match(routes, /path: "\/achievements"[\s\S]{0,400}noindex: true/);
assert.match(fallback, /"\/achievements"/);
assert.doesNotMatch(publicProfile, /learningAchievements|TrophyCabinet|badgeEarnedAt/,
  "Client-controlled trophies must not leak into public trader profiles");
assert.doesNotMatch(page, /\.from\(["']profiles["']\)|insert\(|update\(/,
  "A personal cabinet must not publish any profile/achievement data");
console.log("PASS private Trophy Cabinet: known-course milestones, legacy progress integrity, noindex, discovery and no public claims");
