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
    const record = { ...candidate, id: "test-certificate", issuedAt: "2026-11-07T00:00:00Z" };
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
const handler = createFoundationsCertificateHandler({
  authenticate: async token => {
    if (token === "fixture-service-outage") throw Error("Private Auth outage metadata");
    if (token === "fixture-evidence-outage") return "outage";
    if (token === learnerToken) return "learner";
    return token === otherToken ? "other-account" : null;
  },
  admit: async () => rateAllowed,
  store: certificateStore,
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
