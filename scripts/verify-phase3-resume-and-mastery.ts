import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chooseCourseContinuation, chooseReturnDestination } from "../src/lib/learnerResume";
import { chooseMasteryNextActionForTradeCount } from "../src/lib/masteryNextAction";
import type { CourseProgressState } from "../src/lib/courseProgress";
import type { BeginnerJourneyProgress } from "../src/lib/beginnerJourney";

const tracks = [
  { slug: "base", title: "Foundations", lessons: [{slug:"one",title:"First",readingMinutes:4},{slug:"two",title:"Second",readingMinutes:4}] },
  { slug: "approved-new", title: "Newly Approved", lessons: [{slug:"new",title:"Fresh lesson",readingMinutes:5}] },
];
const progress: CourseProgressState = {
  v:1, updatedAt:"2026-11-11T00:00:00Z", tracks:{},
};
const journey: BeginnerJourneyProgress = {
  version:1, lessonCompleted:false,tradeId:null,portfolioExplained:false,reflection:"",completedAt:null,updatedAt:progress.updatedAt,
};
assert.equal(chooseCourseContinuation(tracks,progress,journey),null,"No fake resume on a fresh account");
assert.equal(chooseReturnDestination(tracks,progress,journey,"/portfolio")?.href,"/portfolio");
assert.equal(chooseReturnDestination(tracks,progress,journey,"//phishing.example"),null);
assert.equal(chooseReturnDestination(tracks,progress,journey,"/courses/removed/quiz")?.href,"/courses");
progress.tracks.base = { lessons: { one: { status:"completed" }, two: { status:"in-progress",scrolledPct:60 } } };
progress.lastLesson = { track:"base",lesson:"one",at:progress.updatedAt };
assert.equal(chooseCourseContinuation(tracks,progress,journey)?.href,"/courses/base/two","A completed last lesson must be skipped");
assert.equal(chooseReturnDestination(tracks,progress,journey,"/courses/base/one")?.href,"/courses/base/two");
progress.tracks.base.lessons.two = {status:"completed"};
progress.tracks["approved-new"] = {lessons:{new:{status:"in-progress"}}};
progress.lastLesson = {track:"approved-new",lesson:"new",at:progress.updatedAt};
assert.equal(chooseCourseContinuation(tracks,progress,journey)?.href,"/courses/approved-new/new","Approved dynamic tracks must resume");
progress.tracks["approved-new"].lessons.new={status:"completed"};
assert.equal(chooseCourseContinuation(tracks,progress,journey),null,"All completed means no stale resume");
assert.equal(chooseReturnDestination(tracks,progress,journey,"/courses/base/one")?.href,"/daily","Completed learners continue practice");
assert.equal(chooseMasteryNextActionForTradeCount(true,2).href,"/portfolio","Recorded account trades must not suggest first trade");
assert.equal(chooseMasteryNextActionForTradeCount(true,0).href,"/trade");
assert.equal(chooseMasteryNextActionForTradeCount(true,null).href,"/portfolio","Unknown account snapshot is not zero trades");
assert.equal(chooseMasteryNextActionForTradeCount(false,null).href,"/daily");
const dashboard=readFileSync("src/components/LearningJourneyDashboard.tsx","utf8");
const guided=readFileSync("src/components/GuidedNextLesson.tsx","utf8");
const hook=readFileSync("src/hooks/useMasteryNextAction.ts","utf8");
const courses=readFileSync("src/pages/Courses.tsx","utf8");
const banner=readFileSync("src/components/retention/ContinueBanner.tsx","utf8");
const daily=readFileSync("src/lib/dailyChallenge.ts","utf8");
assert.match(dashboard,/useMasteryNextAction\(\)/);
assert.match(guided,/useMasteryNextAction\(\)/);
assert.match(hook,/getAccountPortfolio\(user\?\.id\)/);
assert.match(hook,/subscribeAccountPortfolio/);
assert.match(hook,/DAILY_PROGRESS_EVENT/);
assert.match(hook,/hasPlayedToday\(\)/, "Completed long case study counts as today's practice");
assert.match(daily,/window\.dispatchEvent\(new Event\(DAILY_PROGRESS_EVENT\)\)/);
assert.match(courses,/to=\{resume\.href\}/);
assert.match(banner,/chooseReturnDestination/);
console.log("PASS Phase 3: skip completed lessons, resume approved courses, safe return destinations, account-accurate mastery, reactive Daily updates");
