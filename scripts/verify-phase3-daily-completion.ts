import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { starterPracticeBank } from "../src/lib/dailyPracticeBank";
import { newPractice, savePractice, savedPracticeComplete } from "../src/lib/dailyPracticeProgress";

const original = newPractice(starterPracticeBank);
const answers = original.exercise.questions.map(q => q.correctAnswer);
assert.ok(answers.length > 0);
const complete = { ...original, answers };
const memory = new Map<string,string>();
const storage = {
  getItem: (key:string) => memory.get(key) ?? null,
  setItem: (key:string, value:string) => { memory.set(key, value); },
};
assert.equal(savedPracticeComplete(savePractice(complete, storage)), true, "Completed, persisted case earns a Daily completion");
assert.equal(savedPracticeComplete(savePractice({ ...original, answers: answers.slice(0, -1) }, { getItem: () => null, setItem: () => {} })), false, "Incomplete case never earns a completion");
const failedStorage = { getItem: (_key:string) => "[]", setItem: (_key:string, _value:string) => { throw new Error("quota full"); } };
assert.equal(savedPracticeComplete(savePractice(complete, failedStorage)), false, "A failed save must never produce a completed streak");
const daily = readFileSync("src/pages/Daily.tsx", "utf8");
const start = readFileSync("src/pages/BeginnerJourney.tsx", "utf8");
const practice = readFileSync("src/components/DailyPractice.tsx", "utf8");
assert.match(daily,/streak\?\.lastCompletedDate === date && guidedStage < 4/, "The guided handoff follows either form of Daily Practice");
assert.match(start,/hasPlayedToday\(\)/, "Start Here accepts either form of today's completed practice");
assert.match(start,/DAILY_PROGRESS_EVENT/, "Start Here refreshes when practice completes in the same tab");
assert.match(start,/DAILY_PROGRESS_KEY/, "Start Here refreshes from another tab");
assert.match(practice,/if \(savedPracticeComplete\(saved\)\) onComplete\(\)/, "Case study credits only durable completion");
console.log("PASS Phase 3 Daily handoff: quick or deep practice, stored streak only, and cross-tab continuity");
