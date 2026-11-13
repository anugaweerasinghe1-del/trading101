import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { missedDailyCaseAnswers } from "../src/lib/masteryNextAction.ts";
import { latestUnseenRelease } from "../src/lib/releaseNoticeSelection.ts";

const source = (path: string) => readFileSync(path, "utf8");
const daily = {
  answers: [0, 2, 1],
  exercise: { questions: [{ correctAnswer: 0 }, { correctAnswer: 0 }, { correctAnswer: 1 }] },
};
assert.equal(missedDailyCaseAnswers(daily), 1);
assert.equal(missedDailyCaseAnswers({ ...daily, answers: [0, 2] }), 0,
  "An unfinished case does not generate a missed-answer review");
assert.equal(missedDailyCaseAnswers(null), 0);
assert.equal(missedDailyCaseAnswers({ answers: [], exercise: { questions: [] } }), 0);
assert.equal(missedDailyCaseAnswers({ ...daily, answers: [2, 2, 2] }), 3);

const journey = source("src/lib/beginnerJourney.ts");
const page = source("src/pages/BeginnerJourney.tsx");
const banner = source("src/components/ConsentBanner.tsx");
const footer = source("src/components/MegaFooter.tsx");
const dashboard = source("src/components/LearningJourneyDashboard.tsx");
const release = source("src/content/releases/approved.json");
assert.doesNotMatch(journey, /journeyTelemetry|trackConsentedJourneyProgress|amplitude/,
  "Saving private journey progress must not silently expand historical analytics consent");
assert.doesNotMatch(page, /journeyTelemetry|recordConsentedJourneyVisit/,
  "Merely opening a learning page must not trigger optional audience tracking");
assert.match(page, /View Trophy Cabinet/);
assert.match(dashboard, /mastery\.reviewMistakes > 0/);
assert.match(dashboard, /Review the worked explanations/);
assert.match(dashboard, /\/daily\?review=mistakes#deeper-practice/,
  "Missed-answer suggestion should open the actual case and its explanations");
assert.match(source("src/pages/Daily.tsx"), /reviewMissed=\{reviewMistakes\}/,
  "The linked Daily route needs to pass focused review into the case study");
assert.match(source("src/components/DailyPractice.tsx"), /firstMiss/,
  "Review must focus the first saved incorrect answer rather than restarting the quiz");

const now = Date.parse("2026-11-13T10:00:00Z");
const recent = now - 7 * 86400000;
const releases = [
  { marker: "older-approved:2026-11-10", release: { date: "2026-11-10", title: "Earlier feature" } },
  { marker: "new-course:2026-11-13T08:00:00Z", release: { date: "2026-11-13T08:00:00Z", title: "New approved course" } },
  { marker: "future:2026-11-14", release: { date: "2026-11-14", title: "Not released yet" } },
  { marker: "invalid:wat", release: { date: "not a date", title: "Malformed" } },
];
assert.equal(latestUnseenRelease(releases, {}, new Set(), recent, now)?.release.title, "New approved course",
  "A fresh published course must outrank older feature manifest announcements");
assert.equal(latestUnseenRelease(releases, { "new-course:2026-11-13T08:00:00Z": true }, new Set(), recent, now)?.release.title,
  "Earlier feature", "Previously shown courses must not keep replaying");
assert.equal(latestUnseenRelease(releases, {}, new Set(["new-course:2026-11-13T08:00:00Z"]), recent, now)?.release.title,
  "Earlier feature", "Session deduplication works when browser storage is unavailable");
assert.equal(latestUnseenRelease(releases, { "new-course:2026-11-13T08:00:00Z": true,
  "older-approved:2026-11-10": true }, new Set(), recent, now), undefined);
assert.match(source("src/components/ReleaseNotices.tsx"), /latestUnseenRelease\(candidates/,
  "The popup must use the tested newest-unseen selection");
assert.match(source("src/lib/publicCoursePublications.ts"), /order\("published_at", \{ ascending: false \}\)/,
  "A bounded course notice feed must fetch the newest launches first");

assert.match(banner, /STORAGE_KEY = "tradehq_consent_v3"/);
assert.match(banner, /if \(choice === "accepted"\) loadConsentedAnalytics\(\)/);
assert.match(banner, /if \(next === "accepted" && !isAdult\) return/);
assert.match(banner, /autocapture: false/);
assert.match(banner, /fetchRemoteConfig: false/);
assert.match(banner, /Accept optional analytics/);
assert.match(banner, /Reject analytics/);
assert.match(footer, /tradehq:open-consent/);
assert.match(footer, /AdvertisingPrivacyChoices/);
assert.doesNotMatch(banner, /engagementPlugin|sessionReplayPlugin/,
  "Rejecting analytics cannot be bypassed by a surveys or replay plugin");
assert.match(source("src/components/arena/ArenaStudy.tsx"), /mailto:/,
  "Voluntary on-site feedback does not require Amplitude telemetry");
const notes = JSON.parse(release);
assert.ok(notes.some((item: {id: string; announce: boolean; href: string}) =>
  item.id === "release-learner-next-steps-20261112" && item.announce && item.href === "/learn"));
console.log("PASS private journey, opt-in analytics, optional feedback, simpler consent and mastery review");
