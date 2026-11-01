import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildLearningOverview } from "../src/lib/learningOverview.ts";
import type { CourseProgressState } from "../src/lib/courseProgress.ts";
import type { BeginnerJourneyProgress } from "../src/lib/beginnerJourney.ts";

const old = { slug:"old-course", title:"Original course", lessons:[
  { slug:"one",title:"Lesson one",readingMinutes:5 },
  { slug:"two",title:"Lesson two",readingMinutes:6 },
] };
const published = { slug:"new-owner-approved-course",title:"New course",lessons:[
  {slug:"intro",title:"Published lesson",readingMinutes:8}
] };
const course:CourseProgressState={v:1,tracks:{
  "old-course":{lessons:{one:{status:"completed"},two:{status:"in-progress",scrolledPct:37,quizAnswers:{"0":2}}}}
},lastLesson:{track:"old-course",lesson:"two",at:new Date().toISOString()},updatedAt:new Date().toISOString()};
const journey:BeginnerJourneyProgress={version:1,lessonCompleted:true,tradeId:"practice-trade",portfolioExplained:true,reflection:"Reviewed hypothetical trade costs.",completedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
const before=JSON.stringify(course);
let overview=buildLearningOverview([old],course,journey);
assert.equal(overview.next?.href,"/courses/old-course/two");
overview=buildLearningOverview([old,published],course,journey);
assert.equal(overview.next?.href,"/courses/old-course/two","Publishing a new course must never kick a learner out of an unfinished lesson");
assert.equal(overview.lessonsTotal,3);
assert.equal(overview.lessonsDone,1);
assert.equal(JSON.stringify(course),before,"Catalog expansion must not reset or rewrite saved progress");
course.tracks["old-course"].lessons.two={status:"completed"};
overview=buildLearningOverview([old,published],course,journey);
assert.equal(overview.next?.href,"/courses/new-owner-approved-course/intro","Completed learners should automatically see a newly published course");

const source=(p:string)=>readFileSync(p,"utf8");
const live=source("src/components/PortfolioLiveUpdates.tsx");
assert.match(live,/public"?, table: "market_prices"/);
assert.match(live,/table: "practice_portfolios"/);
assert.match(live,/filter: "user_id=eq\." \+ user\.id/);
assert.match(live,/pushPortfolio\(user\.id\)/);
assert.match(live,/document\.hidden/);
assert.match(live,/savePortfolio\(updated, \{ silent: true \}\)/);
assert.doesNotMatch(live,/record_practice_trade|service_role|SUPABASE_SERVICE_ROLE_KEY/);
const app=source("src/App.tsx");
assert.match(app,/<PortfolioLiveUpdates \/>/);
const catalog=source("src/hooks/useCourseCatalog.ts");
assert.match(catalog,/get_published_course_catalog/);
assert.match(catalog,/refetchInterval: 45000/);
const start=source("src/pages/BeginnerJourney.tsx");
assert.match(start,/buildLearningOverview\(tracks, courseProgress, progress\)/);
assert.match(start,/publishedCourses/);
assert.match(start,/courseProgress\.tracks\[course\.slug\]/);
assert.doesNotMatch(start,/getTrack\(last\.track\)/);
const next=source("src/components/GuidedNextLesson.tsx");
assert.match(next,/useCourseCatalog\(\)/);
assert.match(next,/buildLearningOverview\(tracks, progress, readJourney\(\)\)/);
console.log("PASS live portfolio delivery boundaries and dynamic published-course journey with preserved partial progress");
