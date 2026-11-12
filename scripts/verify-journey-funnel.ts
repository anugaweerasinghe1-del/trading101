import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newJourneyMilestones } from "../src/lib/journeyTelemetry.ts";
import { missedDailyCaseAnswers } from "../src/lib/masteryNextAction.ts";
import type { BeginnerJourneyProgress } from "../src/lib/beginnerJourney.ts";

const base: BeginnerJourneyProgress = {
  version: 1, lessonCompleted: false, tradeId: null, portfolioExplained: false,
  reflection: "", completedAt: null, updatedAt: "2026-11-12T00:00:00Z",
};
const lesson = { ...base, lessonCompleted: true };
const trade = { ...lesson, tradeId: "private-id" };
const reviewed = { ...trade, portfolioExplained: true };
const finished = { ...reviewed, completedAt: "2026-11-12T02:00:00Z" };

assert.deepEqual(newJourneyMilestones(base, base), []);
assert.deepEqual(newJourneyMilestones(base, lesson), ["First Lesson Completed"]);
assert.deepEqual(newJourneyMilestones(lesson, trade), ["First Trade Recorded"]);
assert.deepEqual(newJourneyMilestones(trade, reviewed), ["Portfolio Reviewed"]);
assert.deepEqual(newJourneyMilestones(reviewed, finished), ["Completed"]);
assert.deepEqual(newJourneyMilestones(finished, finished), [], "Reloads do not count as new milestones");
assert.deepEqual(newJourneyMilestones(base, { ...base, tradeId: "not-a-real-trade" }), [],
  "A trade ID without a completed prerequisite cannot be counted");
assert.deepEqual(newJourneyMilestones(base, { ...base, completedAt: finished.completedAt }), [],
  "An unsupported completed timestamp cannot manufacture a funnel completion");

const daily = {
  answers: [0, 2, 1],
  exercise: { questions: [{ correctAnswer: 0 }, { correctAnswer: 0 }, { correctAnswer: 1 }] },
};
assert.equal(missedDailyCaseAnswers(daily), 1);
assert.equal(missedDailyCaseAnswers({ ...daily, answers: [0, 2] }), 0,
  "An unfinished case never produces a completion review count");
assert.equal(missedDailyCaseAnswers(null), 0);
assert.equal(missedDailyCaseAnswers({ answers: [], exercise: { questions: [] } }), 0);
assert.equal(missedDailyCaseAnswers({ ...daily, answers: [2, 2, 2] }), 3);

const source = (path: string) => readFileSync(path, "utf8");
const telemetry = source("src/lib/journeyTelemetry.ts");
assert.match(telemetry, /arenaAnalyticsAllowed\(localStorage\.getItem\(ARENA_ANALYTICS_CONSENT_KEY\)\)/);
assert.match(telemetry, /__tradehqAmplitudeStarted/);
assert.match(telemetry, /"TradeHQ Journey " \+ event/);
assert.doesNotMatch(telemetry, /\.track\([^\n]*(?:user_id|tradeId|reflection|email|balance)/i);
const saver = source("src/lib/beginnerJourney.ts");
assert.match(saver, /if \(saved\) trackConsentedJourneyProgress\(previous, next\)/,
  "Only saved milestones may enter the engagement funnel");
assert.doesNotMatch(saver, /replaceJourneySnapshot[\s\S]{0,450}trackConsentedJourneyProgress/,
  "Restoring account history is not a new learner action");
assert.match(source("src/pages/BeginnerJourney.tsx"), /recordConsentedJourneyVisit\(\)/);
assert.match(source("src/pages/BeginnerJourney.tsx"), /View Trophy Cabinet/);
assert.match(source("src/components/LearningJourneyDashboard.tsx"), /mastery\.reviewMistakes > 0/);
console.log("PASS consent-only journey funnel transitions, trophy navigation and private Daily review suggestions");
