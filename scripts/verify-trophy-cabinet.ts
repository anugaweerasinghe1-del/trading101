import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPersonalTrophyCabinet, type TrophyCatalogTrack } from "../src/lib/learningAchievements.ts";
import { parseCourseProgress } from "../src/lib/courseProgress.ts";
import { hasOwnServerRecordedPracticeTrade } from "../src/lib/serverPracticeAchievement.ts";

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

// Invalid first duplicates must not shadow a later valid course. Malformed
// catalog entries and inherited object keys must never inflate milestones.
const malformedCatalog = [
  { slug: "course-a", title: "Broken first entry", badge: { name: "Broken" }, lessons: [] },
  { slug: "course-a", title: "Valid replacement", badge: { name: "Valid" }, lessons: [{ slug: "one" }] },
  { slug: "", title: "Empty slug", badge: { name: "Invalid" }, lessons: [{ slug: "one" }] },
  { slug: "bad-lessons", title: "Missing lessons", badge: { name: "Invalid" }, lessons: null as unknown as { slug: string }[] },
  { slug: "bad-item", title: "Invalid lesson", badge: { name: "Invalid" }, lessons: [null as unknown as { slug: string }] },
];
const recovered = buildPersonalTrophyCabinet(malformedCatalog, progress);
assert.equal(recovered.badges.length, 1);
assert.equal(recovered.badges[0].name, "Valid");
assert.equal(recovered.completedLessons, 1);
assert.equal(recovered.availableLessons, 1);
assert.equal(recovered.archivedBadgeCount, 1);
const inherited = buildPersonalTrophyCabinet([
  { slug: "__proto__", title: "Prototype key", badge: { name: "Private" }, lessons: [{ slug: "toString" }] },
], progress);
assert.equal(inherited.completedLessons, 0);
assert.equal(inherited.completedCourses, 0);


const accountA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const accountB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let tradeReads = 0;
const ledger = async (_id: string) => { tradeReads++; return [{id:"trade-fixture"}]; };
await assert.rejects(
  hasOwnServerRecordedPracticeTrade(null, async () => accountA, ledger), /Sign in/
);
await assert.rejects(
  hasOwnServerRecordedPracticeTrade(accountA, async () => accountB, ledger), /signed-in user changed/
);
assert.equal(tradeReads, 0, "Do not read any trade ledger before confirmed account match");
assert.equal(await hasOwnServerRecordedPracticeTrade(accountA, async () => accountA,
  async id => { assert.equal(id,accountA); return []; }), false);
assert.equal(await hasOwnServerRecordedPracticeTrade(accountA, async () => accountA, ledger), true);
assert.equal(tradeReads, 1);
await assert.rejects(hasOwnServerRecordedPracticeTrade(accountA,
  async () => { throw Error("Auth outage"); }, ledger), /Auth outage/);
await assert.rejects(hasOwnServerRecordedPracticeTrade(accountA,
  async () => accountA, async () => { throw Error("Ledger unavailable"); }), /Ledger unavailable/);
assert.equal(await hasOwnServerRecordedPracticeTrade(accountA, async () => accountA,
  async () => [{id:""}]), false, "Missing evidence ID cannot complete milestone");
assert.equal(await hasOwnServerRecordedPracticeTrade(accountA, async () => accountA,
  async () => null as unknown as Array<{id:string}>).catch(() => null), null,
  "Null server responses fail closed, never becoming an earned milestone");

const read = (path: string) => readFileSync(path, "utf8");
const app = read("src/App.tsx");
const page = read("src/pages/TrophyCabinet.tsx");
const learn = read("src/pages/Learn.tsx");
const profile = read("src/pages/TraderProfile.tsx");
const routes = read("scripts/routes.ts");
const fallback = read("src/lib/clientFallbackRoutes.ts");
const publicProfile = read("src/pages/PublicTrader.tsx");
const tradeWidget = read("src/components/achievements/FirstRecordedTradeMilestone.tsx");

assert.match(app, /path="\/achievements"\s+element=\{<TrophyCabinet\s*\/>\}/);
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
assert.ok(page.includes("<FirstRecordedTradeMilestone />"));
assert.ok(tradeWidget.includes("supabase.auth.getUser()"));
assert.ok(tradeWidget.includes('from("practice_trades")'));
assert.ok(tradeWidget.includes('select("id")'));
assert.ok(tradeWidget.includes('.eq("user_id", ownerId)'));
assert.ok(tradeWidget.includes(".limit(1)"));
assert.ok(tradeWidget.includes("enabled: Boolean(userId) && !authLoading"));
assert.ok(tradeWidget.includes("refetchOnWindowFocus: true"));
assert.ok(tradeWidget.includes("Never public by default"));
assert.ok(tradeWidget.includes("No trading history or award is shared"));
assert.ok(!publicProfile.includes("FirstRecordedTradeMilestone"));
assert.ok(!tradeWidget.includes(".insert(") && !tradeWidget.includes(".update(") && !tradeWidget.includes(".upsert(") && !tradeWidget.includes("localStorage.setItem"));
console.log("PASS private Trophy Cabinet: known-course milestones, legacy progress integrity, noindex, discovery and no public claims");
