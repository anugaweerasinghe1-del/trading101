import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { markLessonCompleted, parseCourseProgress, type CourseProgressState } from "../src/lib/courseProgress";
import { chooseLearningActivation } from "../src/lib/learningActivation";
import { QUICK_READ_TRACK, TRADE_REVIEW_LESSON, TRADE_RECALL_LESSON, TRADE_REVIEW_TRACK, quickReadKey, suggestedQuickRead, tradeReviewStage } from "../src/lib/retentionLearning";
import type { BeginnerJourneyProgress } from "../src/lib/beginnerJourney";

const NOW = Date.parse("2026-11-21T12:00:00Z");
const HOUR = 60 * 60 * 1000;
const fresh: CourseProgressState = { v: 1, tracks: {}, updatedAt: "2026-11-21T00:00:00Z" };
const journey: BeginnerJourneyProgress = { version: 1, lessonCompleted: false, tradeId: null, portfolioExplained: false, reflection: "", completedAt: null, updatedAt: "2026-11-21T00:00:00Z" };
const course = [{ slug: "published", title: "Published", level: "Beginner" as const, lessons: [{ slug: "one", title: "Intro", readingMinutes: 5 }] }];
const mastery = { href: "/daily", label: "Open Daily", reason: "General practice" };
const choose = (c: CourseProgressState, j = journey, hasTrade = false) =>
  chooseLearningActivation(course, c, j, mastery, { hasPracticeTrade: hasTrade, now: NOW });

assert.equal(suggestedQuickRead(fresh, NOW), null);
assert.equal(tradeReviewStage(fresh, NOW), "first");
assert.equal(choose(fresh).href, "/start");
assert.deepEqual([choose(fresh, journey, true).state, choose(fresh, journey, true).href], ["trade", "/learn/trade-review"],
  "Recorded practice users should learn from the existing transaction rather than be told to place their first trade");

const withRead = parseCourseProgress(JSON.stringify({
  ...fresh, tracks: { [QUICK_READ_TRACK]: { lessons: { [quickReadKey(1)]: { status: "in-progress", scrolledPct: 50 } } } },
  lastLesson: { track: QUICK_READ_TRACK, lesson: quickReadKey(1), at: fresh.updatedAt },
}));
assert.deepEqual(suggestedQuickRead(withRead, NOW), { id: 1, state: "resume" });
assert.equal(choose(withRead, journey, true).href, "/learn/1", "Unfinished learning is more important than a new prompt");
withRead.tracks[QUICK_READ_TRACK].lessons[quickReadKey(1)] = { status: "completed", score: 3, completedAt: new Date(NOW - 25 * HOUR).toISOString() };
assert.deepEqual(suggestedQuickRead(withRead, NOW), { id: 1, state: "recall" });
assert.equal(choose(withRead).state, "recall", "Review must be spaced rather than demanded on every visit");
withRead.tracks[QUICK_READ_TRACK].lessons[quickReadKey(1)].completedAt = new Date(NOW - HOUR).toISOString();
assert.equal(suggestedQuickRead(withRead, NOW), null, "No immediate prompt after a fresh completed quiz");

const withTrade = parseCourseProgress(JSON.stringify({
  ...fresh, tracks: { [TRADE_REVIEW_TRACK]: { lessons: { [TRADE_REVIEW_LESSON]: { status: "completed", score: 100, completedAt: new Date(NOW - 25 * HOUR).toISOString() } } } },
}));
assert.equal(tradeReviewStage(withTrade, NOW), "recall");
assert.deepEqual([choose(withTrade, journey, true).state, choose(withTrade, journey, true).href],
  ["recall", "/learn/trade-review?review=1"]);
withTrade.tracks[TRADE_REVIEW_TRACK].lessons[TRADE_RECALL_LESSON] = {
  status: "completed", score: 0, completedAt: new Date(NOW - 2 * HOUR).toISOString(),
};
assert.equal(tradeReviewStage(withTrade, NOW), "recent", "Recall is never represented as mastery or required daily");
withTrade.tracks[TRADE_REVIEW_TRACK].lessons[TRADE_RECALL_LESSON].completedAt = new Date(NOW - 74 * HOUR).toISOString();
assert.equal(tradeReviewStage(withTrade, NOW), "recall", "Offer a later optional retrieval review");

const begun = { ...journey, lessonCompleted: true };
assert.equal(choose(fresh, begun, true).href, "/start", "Do not interrupt a begun five-step journey");
const inCourse = { ...fresh, tracks: { published: { lessons: { one: { status: "in-progress" as const } } } } };
assert.equal(choose(inCourse, journey, true).href, "/courses/published/one", "Existing structured courses stay higher priority");

const oldWindow = (globalThis as { window?: unknown }).window;
const oldStorage = (globalThis as { localStorage?: unknown }).localStorage;
const memory = new Map<string, string>();
(globalThis as { window?: unknown }).window = { dispatchEvent: () => {} };
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value); },
};
assert.equal(markLessonCompleted(QUICK_READ_TRACK, quickReadKey(2), 3), true);
assert.equal(parseCourseProgress(memory.get("tradehq_course_progress_v1") ?? null).tracks[QUICK_READ_TRACK]?.lessons[quickReadKey(2)]?.status, "completed",
  "Quick reads share the existing versioned, account-synced private learning record");
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: () => { throw new Error("quota exceeded"); },
};
assert.equal(markLessonCompleted(QUICK_READ_TRACK, quickReadKey(3), 3), false, "Never claim persistence after a failed save");
(globalThis as { window?: unknown }).window = oldWindow;
(globalThis as { localStorage?: unknown }).localStorage = oldStorage;

const read = (file: string) => readFileSync(file, "utf8");
const detail = read("src/pages/LessonDetail.tsx");
const quiz = read("src/components/Quiz.tsx");
const reviewPage = read("src/pages/TradeLearningReview.tsx");
const trade = read("src/pages/Trade.tsx");
const portfolio = read("src/pages/Portfolio.tsx");
const app = read("src/App.tsx");
assert.match(detail, /saveLessonPosition\(QUICK_READ_TRACK/, "Subtopic progress must persist");
assert.match(detail, /markLessonCompleted\(QUICK_READ_TRACK/, "Quiz result must persist");
assert.match(quiz, /setResultSaved\(onResult\(score\)\)/, "Save on result, not only when leaving quiz");
assert.match(quiz, /Retry saving/, "Unsuccessful storage never gives a false saved message");
assert.match(app, /path="\/learn\/trade-review"/, "A public non-indexed review route must be registered");
assert.match(reviewPage, /getPortfolio/, "Trade review must use the user's owner-safe existing cache");
assert.match(reviewPage, /markLessonCompleted/, "Reviews must store private learning, not mutate a portfolio");
assert.doesNotMatch(reviewPage, /executeTrade|record_practice_trade|sendEmail|sendNotification|localStorage\.setItem/, "Review does not place orders or force messaging");
assert.match(trade, /guidedPractice \? "\/start" : "\/learn\/trade-review"/);
assert.match(portfolio, /portfolio\.trades\.length > 0/, "Existing traders can find the lesson from their portfolio");
assert.match(read("src/components/LearningJourneyDashboard.tsx"), /suggested\.state === "trade"/);
console.log("PASS contextual learning loop: durable quick reads, existing-trade review, voluntary spaced recall, no-order guardrails");
