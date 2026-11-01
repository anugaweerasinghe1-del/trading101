import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeCourseRecords,mergeJourneyRecords } from "../src/lib/learningCloudMerge.ts";
import { parseCourseProgress } from "../src/lib/courseProgress.ts";
import { parseJourneyProgress } from "../src/lib/beginnerJourney.ts";
const local=parseCourseProgress(JSON.stringify({
  v:1,tracks:{intro:{lessons:{
    first:{status:"completed",score:3,completedAt:"2026-10-01T00:00:00Z"},
    second:{status:"in-progress",scrolledPct:47,quizAnswers:{"0":2}},
  }}},updatedAt:"2026-11-01T12:00:00Z",
  lastLesson:{track:"intro",lesson:"second",at:"2026-11-01T12:00:00Z"}
}));
const remote=parseCourseProgress(JSON.stringify({
  v:1,tracks:{intro:{lessons:{
    first:{status:"in-progress",scrolledPct:22},
    second:{status:"in-progress",scrolledPct:81,quizAnswers:{"1":1}}
  }},newcourse:{lessons:{intro:{status:"completed",score:4}}}},
  updatedAt:"2026-10-31T12:00:00Z",
}));
const merged=mergeCourseRecords(local,remote);
assert.equal(merged.tracks.intro.lessons.first.status,"completed");
assert.equal(merged.tracks.intro.lessons.second.scrolledPct,81);
assert.equal(merged.tracks.intro.lessons.second.quizAnswers?.["0"],2);
assert.equal(merged.tracks.intro.lessons.second.quizAnswers?.["1"],1);
assert.equal(merged.tracks.newcourse.lessons.intro.status,"completed");
assert.equal(merged.lastLesson?.lesson,"second");
assert.deepEqual(mergeCourseRecords(merged,remote).tracks.intro.lessons.first.status,"completed");
const a=parseJourneyProgress({version:1,lessonCompleted:true,tradeId:"trade-1",portfolioExplained:false,reflection:"",updatedAt:"2026-11-01T12:00:00Z"});
const b=parseJourneyProgress({version:1,lessonCompleted:true,tradeId:null,portfolioExplained:true,reflection:"This was a virtual trade with a fee.",updatedAt:"2026-10-31T12:00:00Z"});
const combined=mergeJourneyRecords(a,b);
assert.equal(combined.tradeId,"trade-1");
assert.equal(combined.portfolioExplained,true);
assert.ok(combined.reflection.includes("virtual"));
const component=readFileSync("src/components/courses/CloudLearningProgressSync.tsx","utf8");
assert.match(component,/activateLearningOwner\(uid\)/);
assert.match(component,/user_learning_progress/);
assert.match(component,/replaceCourseProgressSnapshot/);
assert.match(component,/onConflict:"user_id"/);
assert.doesNotMatch(component,/record_practice_trade|start_ranked_practice|service_role/);
const schema=readFileSync("supabase/migrations/20261101120000_private_user_learning_progress.sql","utf8");
assert.match(schema,/ENABLE ROW LEVEL SECURITY/);
assert.match(schema,/WITH CHECK \(\(select auth\.uid\(\)\)=user_id\)/);
console.log("PASS cross-device learning merge, saved drafts, completed steps and owner-only boundaries");
