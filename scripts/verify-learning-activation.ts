import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chooseLearningActivation } from "../src/lib/learningActivation.ts";
import { buildLearningOverview } from "../src/lib/learningOverview.ts";
import type { CourseProgressState } from "../src/lib/courseProgress.ts";
import type { BeginnerJourneyProgress } from "../src/lib/beginnerJourney.ts";

const progress: CourseProgressState = { v: 1, tracks: {}, updatedAt: "2026-11-20T00:00:00Z" };
const journey: BeginnerJourneyProgress = { version: 1, lessonCompleted: false, tradeId: null, portfolioExplained: false, reflection: "", completedAt: null, updatedAt: "2026-11-20T00:00:00Z" };
const tracks = [{ slug: "approved-basics", title: "Approved Basics", lessons: [
  { slug: "one", title: "Orders Explained", readingMinutes: 5 },
  { slug: "two", title: "Fees Explained", readingMinutes: 5 },
]}];
const mastery = { href: "/daily", label: "Try Daily Practice", reason: "Review a general scenario" };
const choose = () => chooseLearningActivation(tracks, progress, journey, mastery);

assert.deepEqual([choose().state, choose().href], ["start", "/start"], "First visit must use the existing guided path, not an invented course");
journey.lessonCompleted = true;
assert.deepEqual([choose().state, choose().href], ["journey", "/start"], "Resume without restarting a saved journey");
progress.tracks["approved-basics"] = { lessons: { one: { status: "in-progress" } } };
progress.lastLesson = { track: "approved-basics", lesson: "one", at: progress.updatedAt };
assert.deepEqual([choose().state, choose().href], ["lesson", "/courses/approved-basics/one"], "Resume the unfinished approved lesson");
progress.tracks["approved-basics"].lessons.one = { status: "completed" };
assert.deepEqual([choose().state, choose().href], ["lesson", "/courses/approved-basics/two"], "Continue to next unfinished approved lesson");
progress.tracks["approved-basics"].lessons.two = { status: "completed" };
assert.deepEqual([choose().state, choose().href], ["mastery", "/daily"], "Never restart completed courses or force a daily cap");
journey.completedAt = "2026-11-20T01:00:00Z";
delete progress.lastLesson;
assert.deepEqual([choose().state, choose().href], ["mastery", "/daily"]);
tracks[0].lessons.push({ slug: "three", title: "New Reviewed Lesson", readingMinutes: 5 });
assert.equal(choose().href, "/courses/approved-basics/three", "Approved new lessons must be eligible automatically");
const approvedNewCourses = [
  { slug: "trading-psychology-mastery", title: "Psychology", level: "Beginner" as const, lessons: [{ slug: "biases", title: "Biases", readingMinutes: 6 }] },
  { slug: "bitcoin-simulator-practice-trading", title: "Bitcoin Practice", level: "Beginner" as const, lessons: [{ slug: "orders", title: "Orders", readingMinutes: 6 }] },
  { slug: "options-trading-fundamentals", title: "Options", level: "Intermediate" as const, lessons: [{ slug: "options", title: "Options", readingMinutes: 8 }] },
];
assert.equal(buildLearningOverview(approvedNewCourses, { v: 1, tracks: {}, updatedAt: progress.updatedAt }, journey).next?.href,
  "/courses/bitcoin-simulator-practice-trading/orders", "A newly published beginner practice course outranks psychology/advanced theory");
const files = (name: string) => readFileSync(name, "utf8");
const home = files("src/pages/Index.tsx");
const profile = files("src/pages/TraderProfile.tsx");
const trade = files("src/pages/Trade.tsx");
const learn = files("src/pages/Learn.tsx");
const card = files("src/components/retention/LearningActivationCard.tsx");
const board = files("src/pages/Leaderboard.tsx");
assert.match(home, /<LearningActivationCard\s*\/>/, "Home gets one contextual next action");
assert.doesNotMatch(home, /<ContinueBanner\s*\/>/, "No second competing resume banner");
assert.match(profile, /user && <LearningActivationCard placement="profile"\s*\/>/, "Authenticated account landing contains learning CTA");
assert.ok(learn.indexOf("Learn Trading, One Step at a Time") < learn.indexOf("<LearningJourneyDashboard"), "Page explains itself before optional course library");
assert.ok(learn.indexOf("<LearningJourneyDashboard") < learn.indexOf("Structured Trading Courses"), "Next step precedes browsing");
assert.match(card, /min-h-12 w-full.*sm:w-auto/, "Primary CTA is touch-friendly on mobile");
assert.match(card, /COURSE_PROGRESS_EVENT/);
assert.match(card, /JOURNEY_EVENT/);
assert.doesNotMatch(card, /supabase|\.insert\(|sendEmail|navigator\.share/, "Activation is private/read-only, not a messaging campaign");
assert.match(trade, /setPostTradeLesson\(\{ symbol: asset.symbol, side: type \}\)/);
assert.match(trade, /Learn how orders work/);
assert.match(trade, /guidedPractice \? "\/start" : "\/learn\/1"/);
assert.match(board, /profile\?\.is_public === false/, "Private member sees non-disclosing visibility guidance");
assert.match(board, /Private accounts never appear/);
console.log("PASS learning activation, journey resume, course continuity, post-order education and privacy-safe mobile placement");
