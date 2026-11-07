import assert from "node:assert/strict";
import {
  FOUNDATIONS_COURSES,
  FOUNDATIONS_FINAL_CASE,
  FOUNDATIONS_VERSION,
  getFoundationsEligibility,
} from "../supabase/functions/_shared/foundationsProgramme.ts";
import type { GradedFoundationsAttempt } from "../supabase/functions/_shared/foundationsProgramme.ts";

const score = (assessmentId: string, points = 4, possible = 5): GradedFoundationsAttempt =>
  ({ programmeVersion: FOUNDATIONS_VERSION, assessmentId, points, possible });
const checkpoints = FOUNDATIONS_COURSES.flatMap(course => course.checkpoints.map(id => score(id)));
const finalCase = score(FOUNDATIONS_FINAL_CASE, 8, 10);

assert.deepEqual(getFoundationsEligibility([]).milestones, []);
assert.deepEqual(getFoundationsEligibility([score("markets")]).milestones, []);
assert.deepEqual(getFoundationsEligibility(checkpoints.slice(0, 2)).milestones, ["first-course"]);
assert.deepEqual(getFoundationsEligibility([score("quotes"), score("quotes"), score("quotes")]).milestones, ["first-course"]);
assert.deepEqual(getFoundationsEligibility(checkpoints.slice(0, -1)).milestones, ["first-course", "core-studies"]);
assert.deepEqual(getFoundationsEligibility([...checkpoints.slice(0, -1), finalCase]).milestones, ["first-course", "core-studies"]);
assert.deepEqual(getFoundationsEligibility(checkpoints).milestones, ["first-course", "core-studies"]);
assert.deepEqual(getFoundationsEligibility([...checkpoints, score(FOUNDATIONS_FINAL_CASE, 7, 10)]).milestones, ["first-course", "core-studies"]);
assert.deepEqual(getFoundationsEligibility([...checkpoints, finalCase, finalCase]).milestones, ["first-course", "core-studies", "foundations"]);
assert.deepEqual(getFoundationsEligibility([
  score("unknown"), score("quotes", 5.5), score("quotes", 6), score("quotes", 4, 4),
  score("quotes", 3), { ...score("quotes"), programmeVersion: "foundations-v2" },
]).milestones, []);
assert.equal(new Set(FOUNDATIONS_COURSES.map(course => course.id)).size, 4);
assert.equal(new Set(FOUNDATIONS_COURSES.flatMap(course => course.checkpoints)).size, 6);
console.log("Foundations v1 eligibility passed: one course, three courses, and four courses plus final case.");
