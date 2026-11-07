import assert from "node:assert/strict";
import { createFoundationsCertificateHandler } from "../supabase/functions/_shared/foundationsCertificateHandler.ts";
import { issueFoundationsCertificate } from "../supabase/functions/_shared/foundationsCertificate.ts";
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

const records = new Map<string, Extract<Awaited<ReturnType<typeof issueFoundationsCertificate>>, { status: "available" }>["certificate"]>();
const keyFor = (key: { userId: string; programmeVersion: string; milestone: string }) =>
  JSON.stringify([key.userId, key.programmeVersion, key.milestone]);
const certificateStore: Parameters<typeof issueFoundationsCertificate>[0] = {
  async findPrivateCertificate(key) { return records.get(keyFor(key)) ?? null; },
  async readServerGradedAttempts(userId) {
    if (userId === "outage") throw new Error("graded records unavailable");
    return userId === "learner" ? [...checkpoints, finalCase] : [];
  },
  async createOrReadPrivateCertificate(candidate) {
    const key = keyFor(candidate);
    const existing = records.get(key);
    if (existing) return existing;
    const record = { ...candidate, id: "test-certificate", nameRevision: 0, issuedAt: "2026-11-07T00:00:00Z" };
    records.set(key, record);
    return record;
  },
};

assert.deepEqual(await issueFoundationsCertificate(certificateStore, null, "foundations", "Maya Perera"), { status: "unauthenticated" });
assert.deepEqual(await issueFoundationsCertificate(certificateStore, "learner", "__proto__", "Maya Perera"), { status: "invalid_milestone" });
assert.deepEqual(await issueFoundationsCertificate(certificateStore, "learner", "foundations", "Maya\nPerera"), { status: "invalid_recipient_name" });
assert.deepEqual(await issueFoundationsCertificate(certificateStore, "other-account", "foundations", "Maya Perera"), { status: "ineligible" });
await assert.rejects(issueFoundationsCertificate(certificateStore, "outage", "foundations", "Maya Perera"), /graded records unavailable/);
assert.equal(records.size, 0);

const [issued, retry] = await Promise.all([
  issueFoundationsCertificate(certificateStore, "learner", "foundations", "  මායා පෙරේරා  "),
  issueFoundationsCertificate(certificateStore, "learner", "foundations", "Different Name"),
]);
assert.equal(issued.status, "available");
assert.deepEqual(retry, issued);
assert.equal(records.size, 1);
if (issued.status === "available") {
  assert.equal(issued.certificate.recipientName, "මායා පෙරේරා");
  assert.equal(issued.certificate.templateVersion, "trade-hq-white-teal-v1");
}
assert.deepEqual(await issueFoundationsCertificate(certificateStore, "learner", "foundations", null), issued);
assert.deepEqual(await issueFoundationsCertificate(certificateStore, "other-account", "foundations", "Maya Perera"), { status: "ineligible" });
console.log("Private issuance policy passed: trusted evidence, account scope, immutable retry and Unicode name.");

const learnerToken = "fixture-learner-token";
const otherToken = "fixture-other-account-token";
let rateAllowed = true;
let assessmentOutage = false;
const savedGrades: { account: string; grade: GradedFoundationsAttempt }[] = [];
const fixtureQuestions = Array.from({ length: 5 }, (_, index) => ({
  prompt: "Fixture prompt " + (index + 1),
  choices: ["First", "Second", "Third", "Fourth"],
  correctIndex: index % 4,
}));
const handler = createFoundationsCertificateHandler({
  authenticate: async token => {
    if (token === "fixture-service-outage") throw Error("Private Auth outage metadata");
    if (token === "fixture-evidence-outage") return "outage";
    if (token === learnerToken) return "learner";
    return token === otherToken ? "other-account" : null;
  },
  admit: async () => rateAllowed,
  store: certificateStore,
  correctName: async (key, expected, recipientName) => {
    const current = records.get(keyFor(key));
    if (!current) return false;
    if (current.recipientName === recipientName) return true;
    if (current.nameRevision !== expected) return false;
    records.set(keyFor(key), { ...current, recipientName, nameRevision: expected + 1 });
    return true;
  },
  readAssessment: async () => {
    if (assessmentOutage) return null;
    return { title: "Private scoring fixture", questions: fixtureQuestions };
  },
  recordGrade: async (account, grade) => { savedGrades.push({ account, grade }); },
});
const call = (input: unknown, token = learnerToken) => handler(new Request("http://localhost/foundations-certificate", {
  method: "POST", body: JSON.stringify(input),
  headers: token ? { Authorization: "Bearer " + token } : {},
}));
const clean = { milestone: "foundations", recipientName: "Maya Perera" };
assert.equal((await call(clean, "")).status, 401);
assert.equal((await call(clean, "fixture-forged-jwt-token")).status, 401);
assert.equal((await call({ ...clean, userId: "learner", points: 10 }, otherToken)).status, 400);
assert.equal((await call(clean, otherToken)).status, 409);
assert.equal((await call({ ...clean, recipientName: "a".repeat(1100) })).status, 413);
for (const token of ["fixture-service-outage", "fixture-evidence-outage"]) {
  const failure = await call(clean, token);
  assert.equal(failure.status, 503);
  assert.deepEqual(await failure.json(), { status: "unavailable" });
}
rateAllowed = false;
assert.equal((await call(clean)).status, 429);
rateAllowed = true;
const response = await call({ milestone: "foundations" });
assert.equal(response.status, 200);
assert.equal(response.headers.get("cache-control"), "no-store");
const body = await response.json();
assert.equal(body.certificate.recipientName, "මායා පෙරේරා");
assert.equal(body.certificate.id, "test-certificate");
assert.equal("userId" in body.certificate, false);
assert.equal("evidence" in body.certificate, false);
console.log("Certificate handler passed: session binding, forged inputs, throttling, body bounds, outages and private repeat download metadata.");

const assessment = { action: "assessment", assessmentId: "markets", programmeVersion: FOUNDATIONS_VERSION };
const assessmentResponse = await call(assessment);
assert.equal(assessmentResponse.status, 200);
const publicAssessment = (await assessmentResponse.json()).assessment;
assert.equal(publicAssessment.questions.length, 5);
assert.ok(publicAssessment.questions.every(question => !("correctIndex" in question)));
assert.equal((await call({ ...assessment, assessmentId: "__proto__" })).status, 400);
assert.equal((await call({ ...assessment, programmeVersion: "foundations-v2" })).status, 400);
const grade = { ...assessment, action: "grade", answers: [0, 1, 2, 3, 0] };
for (const input of [
  { ...grade, answers: [0, 1, 2, 3] },
  { ...grade, answers: [0, 1, 2, 3, 4] },
  { ...grade, answers: ["0", 1, 2, 3, 0] },
  { ...grade, points: 5 },
  { ...grade, userId: "learner" },
]) assert.equal((await call(input, otherToken)).status, 400);
assessmentOutage = true;
assert.equal((await call(grade)).status, 503);
assessmentOutage = false;
assert.equal(savedGrades.length, 0);
const graded = await call(grade, otherToken);
assert.equal(graded.status, 200);
assert.deepEqual(await graded.json(), { status: "graded", grade: score("markets", 5) });
assert.deepEqual(savedGrades, [{ account: "other-account", grade: score("markets", 5) }]);
assert.equal((await call({ action: "progress" })).status, 200);
assert.deepEqual((await (await call({ action: "progress" }, otherToken)).json()).milestones, []);
console.log("Assessment handler passed: answer-key omission, strict version and shape, server scoring, wrong-account protection, and unavailable evidence.");

const correction = { action: "correct_name", milestone: "foundations", expectedRevision: 0, recipientName: "Maya Corrected" };
assert.equal((await call(correction, otherToken)).status, 409);
assert.equal((await call({ ...correction, userId: "learner" }, otherToken)).status, 400);
const corrected = await call(correction);
assert.equal(corrected.status, 200);
const correctedBody = await corrected.json();
assert.equal(correctedBody.certificate.id, "test-certificate");
assert.equal(correctedBody.certificate.nameRevision, 1);
assert.equal(correctedBody.certificate.recipientName, "Maya Corrected");
assert.deepEqual(await (await call(correction)).json(), correctedBody);
assert.equal((await call({ ...correction, recipientName: "Late Name" })).status, 409);
assert.deepEqual(await (await call({ action: "certificate", milestone: "foundations" })).json(), correctedBody);
console.log("Certificate correction handler passed: authenticated ownership, immutable ID, retries, stale conflicts and repeat reads.");
