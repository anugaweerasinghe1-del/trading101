import assert from "node:assert/strict";
import { summarizeReleaseEvidence, type ReleaseCheck, type ReleaseRun } from "../src/lib/aiReleaseEvidence";
const sha = "a".repeat(40), stale = "b".repeat(40);
const now = Date.parse("2026-10-11T06:00:00Z");
const times = { started_at: "2026-10-11T05:01:00Z", completed_at: "2026-10-11T05:10:00Z" };
const pages: ReleaseCheck = { id: 10, name: "Cloudflare Pages", head_sha: sha, status: "completed", conclusion: "success", app: { id: 85455, slug: "cloudflare-workers-and-pages" }, external_id: "12345678-1234-1234-1234-123456789012", details_url: "https://dash.cloudflare.com/?to=/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/12345678-1234-1234-1234-123456789012", ...times };
const runs: ReleaseRun[] = [{ id: 1, path: ".github/workflows/phase3-high-check.yml", head_sha: sha, status: "completed", conclusion: "success", event: "pull_request", workflow_id: 368399831, repository: { id: 1130435580 }, head_repository: { id: 1130435580 }, run_attempt: 1, check_suite_id: 99, created_at: "2026-10-11T05:00:00Z", run_started_at: "2026-10-11T05:00:00Z", updated_at: "2026-10-11T05:11:00Z" }];
const gates: ReleaseCheck[] = ["TradeHQ Phase 3 tests", "TradeHQ Cloudflare compatibility / Cloudflare build and SEO", "TradeHQ Required validation"].map((name, i) => ({ ...pages, id: 20 + i, name, app: { id: 15368, slug: "github-actions" }, check_suite: { id: 99 } }));
const evaluate = (checks: ReleaseCheck[], workflowRuns: ReleaseRun[] = runs) => summarizeReleaseEvidence(sha, checks, workflowRuns, now);
assert.equal(evaluate([pages, ...gates]).failed, false);
// A duplicate/generic build check cannot substitute for either required workflow.
assert.equal(evaluate([pages, { ...pages, id: 20, name: "build" }]).failed, true);
assert.equal(evaluate([pages, ...gates], runs.map(run => ({ ...run, head_sha: stale }))).failed, true);
assert.equal(evaluate([{ ...pages, head_sha: stale }, ...gates]).failed, true);
assert.equal(evaluate([{ ...pages, app: { slug: "untrusted-app" } }, ...gates]).failed, true);
for (const conclusion of [null, "neutral", "skipped", "failure", "cancelled", "timed_out", "action_required", "stale"]) {
  assert.equal(evaluate([{ ...pages, conclusion }, ...gates]).failed, true);
  assert.equal(evaluate([pages, ...gates], [{ ...runs[0], conclusion }]).failed, true);
  for (let i = 0; i < gates.length; i++) assert.equal(evaluate([pages, ...gates.map((gate, j) => i === j ? { ...gate, conclusion } : gate)]).failed, true);
}
// A newer failed or pending run supersedes an older success on the same commit.
assert.equal(evaluate([pages, ...gates], [...runs, { ...runs[0], id: 50, conclusion: "failure" }]).failed, true);
assert.equal(evaluate([pages, ...gates], [...runs, { ...runs[0], run_attempt: 2, status: "in_progress", conclusion: null }]).failed, true);
assert.equal(evaluate([pages, ...gates], [...runs, { ...runs[0], id: 50, check_suite_id: 100 }]).failed, true);
assert.equal(evaluate([pages, ...gates, { ...pages, id: 50, conclusion: "failure" }]).failed, true);
for (const timestamp of [undefined, "bad", "2026-10-09T05:00:00Z", "2026-10-12T05:00:00Z"]) {
  assert.equal(evaluate([{ ...pages, started_at: timestamp }, ...gates]).failed, true);
  assert.equal(evaluate([pages, ...gates], [{ ...runs[0], run_started_at: timestamp }]).failed, true);
}
assert.equal(evaluate([pages, ...gates], [{ ...runs[0], created_at: "2026-10-09T05:00:00Z", run_attempt: 2 }]).failed, false, "A fresh rerun may validate an older PR; old attempt evidence still cannot substitute.");
assert.equal(evaluate([pages, ...gates, { ...gates[0], id: 30 }]).failed, true);
assert.equal(evaluate([pages, ...gates], [{ ...runs[0], event: "issues" }]).failed, true);
assert.equal(evaluate([pages, ...gates.map(gate => ({ ...gate, check_suite: { id: 100 } }))]).failed, true);
const separateWorker = { ...pages, id: 40, name: "Workers Builds: thetradehq", conclusion: "failure" };
const result = evaluate([pages, ...gates, separateWorker]);
assert.equal(result.failed, false);
assert.match(result.summary, /Separate Worker: failure/);
assert.equal(summarizeReleaseEvidence("invalid", [pages], runs, now).failed, true);
console.log("AI release evidence: immutable SHA, current workflow suite, three unique gates, 24-hour freshness, trusted Pages, non-success outcomes, reruns and separate Worker verified.");

// Named app slugs alone and green checks outside the current attempt are insufficient.
for (const id of [undefined, 7]) {
  assert.equal(evaluate([{ ...pages, app: { id, slug: "cloudflare-workers-and-pages" } }, ...gates]).failed, true);
  assert.equal(evaluate([pages, ...gates.map(g => ({ ...g, app: { id, slug: "github-actions" } }))]).failed, true);
}
for (const change of [{ workflow_id: 7 }, { repository: { id: 7 } }, { head_repository: { id: 7 } }])
  assert.equal(evaluate([pages, ...gates], [{ ...runs[0], ...change }]).failed, true);
assert.equal(evaluate([pages, ...gates.map(g => ({ ...g, completed_at: "2026-10-11T05:12:00Z" }))]).failed, true);
for (const change of [{ external_id: undefined }, { external_id: "wrong" },
  { details_url: "https://evil.example/" }, { details_url: pages.details_url!.replace("tradehq-preview", "other-project") },
  { details_url: pages.details_url!.replace("01087d56e4cb7b728a7a9ddbcb12b9bb", "another-account") },
  { started_at: "2026-02-30T05:01:00Z" }])
  assert.equal(evaluate([{ ...pages, ...change }, ...gates]).failed, true);
console.log("Release provenance: numeric app/workflow/repository identities, exact Pages account/project/deployment and current-attempt completion verified.");
