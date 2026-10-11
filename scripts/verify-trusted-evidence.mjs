import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { collectTrustedEvidence } from "./agent-trusted-evidence.mjs";
import { createGithubEvidenceReader, EVIDENCE_REPOSITORY, EVIDENCE_REPOSITORY_ID } from "./github-evidence-reader.mjs";
import { makeAttestation, ATTESTATION_PREFIX, REPORT_TITLES } from "./monitor-attestation.mjs";

const mainSha = "b".repeat(40), monitorSha = "a".repeat(40), runId = 123;
const now = Date.parse("2026-10-11T06:00:00Z");
const root = "https://api.github.com/repos/" + EVIDENCE_REPOSITORY;
const options = { runId, monitorSha, mainSha, now };
const json = (body, headers = {}, status = 200) => new Response(JSON.stringify(body), { status, headers });
function fixture() {
  const repo = { id: EVIDENCE_REPOSITORY_ID, full_name: EVIDENCE_REPOSITORY, private: false };
  const run = { id: runId, head_sha: monitorSha, path: ".github/workflows/tradehq-agents.yml", workflow_id: 379806172,
    head_branch: "main", repository: repo, head_repository: repo, event: "schedule", run_attempt: 2,
    status: "completed", conclusion: "success", run_started_at: "2026-10-11T05:00:00Z", updated_at: "2026-10-11T05:06:00Z" };
  const reports = ["route", "browser"].map((source, i) => ({
    id: 100 + i, number: 74 + i, title: REPORT_TITLES[source], state: "open", user: { login: "github-actions[bot]", type: "Bot" },
    updated_at: "2026-10-11T05:04:00Z", body: [
      "**Checked at (UTC):** 2026-10-11T05:01:00.000Z", "**GitHub run ID:** 123",
      source === "route" ? "**URLs checked:** 352" : "**Checked routes:** 12",
      source === "route" ? "**Failed URLs:** 0" : "**Potential failures:** 0",
      "PRIVATE_REPORT_SENTINEL (must never appear in output)",
    ].join("\n\n"),
  }));
  const jobs = ["scan", "browser"].map((name, i) => ({ id: 200 + i, name, run_id: runId, head_sha: monitorSha,
    status: "completed", conclusion: "success", started_at: "2026-10-11T05:00:00Z", completed_at: "2026-10-11T05:05:00Z" }));
  const env = { GITHUB_REPOSITORY: EVIDENCE_REPOSITORY, GITHUB_REPOSITORY_ID: String(repo.id),
    GITHUB_RUN_ID: String(runId), GITHUB_RUN_ATTEMPT: "2", GITHUB_SHA: monitorSha };
  const logs = reports.map((report, i) => "2026-10-11T05:04:00.0000000Z " + ATTESTATION_PREFIX
    + JSON.stringify(makeAttestation(i ? "browser" : "route", report.body, report, env)) + "\nPRIVATE_LOG_SENTINEL\n");
  const checks = [{ id: 300, head_sha: mainSha, name: "Cloudflare Pages", app: { id: 85455, slug: "cloudflare-workers-and-pages" },
    status: "completed", conclusion: "success", started_at: "2026-10-11T05:10:00Z", completed_at: "2026-10-11T05:15:00Z",
    external_id: "12345678-1234-1234-1234-123456789012",
    details_url: "https://dash.cloudflare.com/?to=/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/12345678-1234-1234-1234-123456789012" }];
  checks.push({ ...checks[0], id: 301, name: "Workers Builds: thetradehq", conclusion: "failure" });
  for (const [i,name] of ["TradeHQ Phase 3 tests", "TradeHQ Cloudflare compatibility / Cloudflare build and SEO", "TradeHQ Required validation"].entries()) {
    checks.push({ id: 310+i, name, head_sha: mainSha, app: { id: 15368, slug: "github-actions" },
      check_suite: { id: 500 }, status: "completed", conclusion: "success",
      started_at: "2026-10-11T05:11:00Z", completed_at: "2026-10-11T05:19:00Z" });
  }
  const actions = [{ id: 400, path: ".github/workflows/phase3-high-check.yml", head_sha: mainSha,
    workflow_id: 368399831, repository: repo, head_repository: repo, check_suite_id: 500,
    event: "push", head_branch: "main", pull_requests: [],
    status: "completed", conclusion: "success", run_attempt: 1, run_started_at: "2026-10-11T05:10:00Z", updated_at: "2026-10-11T05:20:00Z" }];
  return { repo, run, reports, jobs, logs, checks, actions, calls: [], seen: new Map(), mutate: null };
}
function readerFor(f) {
  return createGithubEvidenceReader({ token: "PRIVATE_TOKEN_SENTINEL", now: () => now, fetchImpl: async (url, request) => {
    assert.equal(request.method, "GET"); assert.equal(request.redirect, "manual");
    assert.ok(!url.includes("PRIVATE_TOKEN_SENTINEL"));
    f.calls.push(url);
    const u = new URL(url), path = u.pathname.slice(new URL(root).pathname.length);
    const seen = (f.seen.get(path) || 0) + 1; f.seen.set(path, seen);
    let data;
    if (path === "") data = f.repo;
    else if (path === "/branches/main") data = { commit: { sha: mainSha } };
    else if (path === "/actions/runs/" + runId) data = f.run;
    else if (path.startsWith("/compare/")) data = { status: "ahead", base_commit: { sha: monitorSha }, merge_base_commit: { sha: monitorSha } };
    else if (path === "/issues") data = f.reports;
    else if (path.endsWith("/attempts/2/jobs")) data = { total_count: f.jobs.length, jobs: f.jobs };
    else if (path === "/actions/jobs/200/logs") return new Response(f.logs[0]);
    else if (path === "/actions/jobs/201/logs") return new Response(f.logs[1]);
    else if (path.includes("/check-runs")) data = { total_count: f.checks.length, check_runs: f.checks };
    else if (path === "/actions/runs") data = { total_count: f.actions.length, workflow_runs: f.actions };
    else if (path === "/pulls/999") data = { state: "open", head: { sha: "c".repeat(40), repo: f.repo }, base: { sha: mainSha, repo: f.repo } };
    else throw Error("Unexpected fixture request");
    data = structuredClone(data);
    if (f.mutate) data = f.mutate(path, seen, data);
    return json(data);
  } });
}
let f = fixture();
const packet = await collectTrustedEvidence({ ...options, reader: readerFor(f) });
assert.equal(packet.monitoring.attempt, 2);
assert.equal(packet.monitoring.reports.length, 2);
assert.equal(packet.cloudflare.workers[0].conclusion, "failure");
assert.equal(packet.githubActions[0].checks.length, 3, "Reusable Cloudflare evidence is bound within the normal Phase 3 suite.");
assert.deepEqual(Object.values(packet.authorization), [false, false, false, false, false]);
assert.ok(!/PRIVATE_(?:TOKEN|REPORT|LOG)_SENTINEL/.test(JSON.stringify(packet)));
assert.ok(f.calls.every(x => x.startsWith(root)));
// GitHub job/issue times have second precision; a real console record can include fractions.
f = fixture();
f.jobs[0].completed_at = "2026-10-11T05:01:00Z";
f.reports[0].updated_at = "2026-10-11T05:01:00Z";
f.reports[0].body = f.reports[0].body.replace("05:01:00.000Z", "05:01:00.500Z");
f.logs[0] = "2026-10-11T05:01:00.6000000Z " + ATTESTATION_PREFIX + JSON.stringify(makeAttestation("route",f.reports[0].body,f.reports[0],
  { GITHUB_REPOSITORY:EVIDENCE_REPOSITORY, GITHUB_REPOSITORY_ID:String(EVIDENCE_REPOSITORY_ID), GITHUB_RUN_ID:String(runId), GITHUB_RUN_ATTEMPT:"2", GITHUB_SHA:monitorSha }));
assert.equal((await collectTrustedEvidence({ ...options, reader:readerFor(f) })).monitoring.reports.length,2);
f.jobs[0].completed_at = "2026-10-11T05:00:59Z";
await assert.rejects(collectTrustedEvidence({ ...options, reader:readerFor(f) }), /outside producing job/);
const attacks = [
  x => { x.repo.id++; },
  x => { x.repo.private = true; },
  x => { x.run.path = ".github/workflows/untrusted.yml"; },
  x => { x.run.workflow_id++; },
  x => { x.run.event = "pull_request"; },
  x => { x.run.head_branch = "feature"; },
  x => { x.run.head_sha = mainSha; },
  x => { x.run.repository = { id: 7 }; },
  x => { x.run.conclusion = "action_required"; },
  x => { x.run.run_started_at = "2026-10-09T05:00:00Z"; },
  x => { x.run.run_started_at = "2026-10-12T05:00:00Z"; },
  x => { x.run.updated_at = "bad"; },
  x => { x.run.run_attempt = 1; },
  x => { x.reports.pop(); },
  x => { x.reports.push({ ...x.reports[0], id: 999 }); },
  x => { x.reports[0].user.login = "owner"; },
  x => { x.reports[0].body += "\nEdited after the run"; },
  x => { x.reports[0].body = x.reports[0].body.replace("352", "351"); },
  x => { x.reports[0].body = x.reports[0].body.replace("123", "124"); },
  x => { x.reports[0].updated_at = "2026-10-11T05:45:00Z"; },
  x => { x.logs[0] = ""; },
  x => { x.logs[0] += x.logs[0]; },
  x => { x.logs[0] = x.logs[0].replace('"bodySha256":"', '"bodySha256":"0'); },
  x => { x.logs[0] = x.logs[0].replace("2026-10-11T05:04", "2026-10-11T04:04"); },
  x => { x.logs[0] = "Run echo " + x.logs[0]; },
  x => { x.logs[0] = "2026-10-11T05:04:00Z " + ATTESTATION_PREFIX + "not-json"; },
  x => { x.jobs[0].head_sha = mainSha; },
  x => { x.jobs[0].run_id++; },
  x => { x.jobs[0].conclusion = "failure"; },
  x => { x.jobs.push({ ...x.jobs[0], id: 299 }); },
  x => { x.checks[0].app.id++; },
  x => { x.checks[0].head_sha = monitorSha; },
  x => { x.checks[0].name = "build"; },
  x => { x.checks[0].conclusion = "skipped"; },
  x => { x.checks[0].completed_at = null; },
  x => { x.checks[0].external_id = "unknown"; },
  x => { x.checks[0].details_url = "https://evil.example/pages/view/tradehq-preview/" + x.checks[0].external_id; },
  x => { x.actions[0].conclusion = "failure"; },
  x => { delete x.actions[0].run_attempt; },
  x => { x.actions[0].head_sha = monitorSha; },
  x => { x.actions[0].run_started_at = "2026-10-09T05:00:00Z"; },
  x => { x.actions[0].run_started_at = "2026-10-10T05:00:00Z"; },
  x => { x.actions[0].workflow_id++; },
  x => { x.actions[0].repository = { id: 7 }; },
  x => { x.actions[0].head_repository = { id: 7 }; },
  x => { x.actions[0].event = "pull_request_target"; },
  x => { x.actions[0].head_branch = "feature"; },
  x => { x.actions[0].check_suite_id++; },
  x => { x.actions[0].run_started_at = "2026-10-11T05:12:00Z"; },
  x => { x.checks.pop(); },
  x => { x.checks.push({ ...x.checks[2], id: 999 }); },
  x => { x.checks[2].app.id++; },
  x => { x.checks[2].app.slug = "untrusted"; },
  x => { x.checks[2].head_sha = monitorSha; },
  x => { x.checks[2].check_suite.id++; },
  x => { x.checks[2].conclusion = "skipped"; },
  x => { x.checks[2].status = "in_progress"; },
  x => { x.checks[2].started_at = null; },
  x => { x.checks[2].started_at = "2026-10-10T05:00:00Z"; },
  x => { x.checks[2].completed_at = "2026-10-11T05:21:00Z"; },
  x => { x.actions.length = 0; },
  x => { x.mutate = (path, n, data) => path === "/branches/main" && n > 1 ? { commit: { sha: monitorSha } } : data; },
  x => { x.mutate = (path, n, data) => { if (path === "/issues" && n > 1) data[0].body += "later edit"; return data; }; },
  x => { x.mutate = (path, n, data) => { if (path === "/actions/runs/123" && n > 1) data.run_attempt++; return data; }; },
  x => { x.mutate = (path, n, data) => { if (path.includes("/check-runs") && n > 1) data.check_runs[0].conclusion = "failure"; return data; }; },
];
for (const attack of attacks) {
  f = fixture(); attack(f);
  await assert.rejects(collectTrustedEvidence({ ...options, reader: readerFor(f) }));
}
await assert.rejects(collectTrustedEvidence({ ...options, targetSha: "c".repeat(40), reader: readerFor(fixture()) }));
f = fixture();
f.checks.forEach(check => { check.head_sha = "c".repeat(40); });
f.actions[0].head_sha = "c".repeat(40);
f.actions[0].event = "pull_request";
f.actions[0].pull_requests = [{ number: 999, head: { sha: "c".repeat(40), repo: f.repo }, base: { sha: mainSha, repo: f.repo } }];
const proposalPacket = await collectTrustedEvidence({ ...options, targetSha: "c".repeat(40), prNumber: 999, reader: readerFor(f) });
assert.equal(proposalPacket.targetSha, "c".repeat(40));
f = fixture();
f.mutate = (path, n, data) => { if (path === "/pulls/999" && n > 1) data.head.sha = mainSha; return data; };
f.checks.forEach(check => { check.head_sha = "c".repeat(40); }); f.actions[0].head_sha = "c".repeat(40);
f.actions[0].event = "pull_request";
f.actions[0].pull_requests = [{ number: 999, head: { sha: "c".repeat(40), repo: f.repo }, base: { sha: mainSha, repo: f.repo } }];
await assert.rejects(collectTrustedEvidence({ ...options, targetSha: "c".repeat(40), prNumber: 999, reader: readerFor(f) }));
for (const mutate of [x => { x.actions[0].pull_requests = []; }, x => { x.actions[0].pull_requests[0].head.sha = mainSha; },
  x => { x.actions[0].pull_requests[0].base.sha = monitorSha; }, x => { x.actions[0].pull_requests.push(x.actions[0].pull_requests[0]); }]) {
  f = fixture(); f.checks.forEach(check => { check.head_sha = "c".repeat(40); }); f.actions[0].head_sha = "c".repeat(40);
  f.actions[0].event = "pull_request";
  f.actions[0].pull_requests = [{ number: 999, head: { sha: "c".repeat(40), repo: f.repo }, base: { sha: mainSha, repo: f.repo } }];
  mutate(f);
  await assert.rejects(collectTrustedEvidence({ ...options, targetSha: "c".repeat(40), prNumber: 999, reader: readerFor(f) }));
}

// Typed failure evidence is read-only, complete and bound to the actual failed job.
function failedFixture(source = "route", reason = "HTTP 429") {
  const x = fixture(), i = source === "route" ? 0 : 1;
  x.run.conclusion = "failure"; x.jobs[i].conclusion = "failure";
  x.reports[i].body = x.reports[i].body.replace(source === "route" ? "**Failed URLs:** 0" : "**Potential failures:** 0",
    source === "route" ? "**Failed URLs:** 1" : "**Potential failures:** 1")
    + (source === "route" ? "\n- /about: " : "\n- `/about`: ") + reason;
  x.logs[i] = "2026-10-11T05:04:00.0000000Z " + ATTESTATION_PREFIX + JSON.stringify(makeAttestation(source,x.reports[i].body,x.reports[i],
    { GITHUB_REPOSITORY:EVIDENCE_REPOSITORY,GITHUB_REPOSITORY_ID:String(EVIDENCE_REPOSITORY_ID),GITHUB_RUN_ID:String(runId),GITHUB_RUN_ATTEMPT:"2",GITHUB_SHA:monitorSha }));
  return x;
}
for (const source of ["route", "browser"]) {
  f = failedFixture(source);
  await assert.rejects(collectTrustedEvidence({ ...options, reader: readerFor(f) }));
  const failed = await collectTrustedEvidence({ ...options, purpose: "diagnosis", reader: readerFor(f) });
  assert.equal(failed.monitoring.conclusion, "failure");
  assert.equal(failed.diagnosis.items[0].category, "RATE_LIMIT_RESPONSE");
  assert.equal(failed.diagnosis.items[0].proposalAllowed, false);
  assert.ok(Object.values(failed.authorization).every(x => x === false));
  assert.ok(Object.values(failed.diagnosis.authorization).every(x => x === false));
  assert.ok(!/PRIVATE_(?:TOKEN|REPORT|LOG)_SENTINEL/.test(JSON.stringify(failed)));
}
for (const mutate of [
  x => { x.run.conclusion = "success"; }, x => { x.jobs[0].conclusion = "success"; },
  x => { x.jobs[0].conclusion = "cancelled"; }, x => { x.logs[0] = ""; },
  x => { x.reports[0].body += "\n- /trade: HTTP 500"; },
  x => { x.checks[0].conclusion = "failure"; }, x => { x.actions[0].conclusion = "failure"; },
  x => { x.run.run_started_at = "2026-10-11T05:00:01Z"; },
]) { f = failedFixture(); mutate(f); await assert.rejects(collectTrustedEvidence({ ...options, purpose: "diagnosis", reader: readerFor(f) })); }
await assert.rejects(collectTrustedEvidence({ ...options, purpose: "repair", reader: readerFor(fixture()) }));
f = fixture(); f.run.conclusion = "failure";
await assert.rejects(collectTrustedEvidence({ ...options, purpose: "diagnosis", reader: readerFor(f) }), /conflicts/);
const { diagnosePublicFindings } = await import("./agent-repair-diagnosis.mjs");
const { candidateId } = await import("./agent-repair-review.mjs");
for (const [path, symptom] of [["/auth","BLANK_ROOT"],["/trade","HTTP_429"],["/portfolio","VISIBLE_ERROR"],["/admin/ai","MISSING_TITLE"],["/courses","BUNDLE_UNAVAILABLE"],["/daily","REQUEST_OR_RENDER_FAILED"],["/reviews","UNCLASSIFIED"],["/leaderboard","HTTP_500"]]) {
  const finding = { path, source: "browser", symptom }; finding.id = candidateId(finding);
  const result = diagnosePublicFindings([finding]);
  assert.equal(result.items[0].protectedRoute, true); assert.equal(result.items[0].risk, "HIGH");
  assert.equal(result.items[0].rootCauseVerified, false); assert.equal(result.items[0].proposalAllowed, false);
  assert.throws(() => diagnosePublicFindings([{ ...finding, id: "edited" }]));
  assert.throws(() => diagnosePublicFindings([finding,finding]));
}
// Exercise real pagination, including completeness, gaps, changed totals and origin leakage.
const entries = Array.from({ length: 205 }, (_, i) => ({ id: i + 1 }));
const pageReader = (mutate = (page, data, headers) => ({ data, headers })) => createGithubEvidenceReader({ now: () => now, fetchImpl: async url => {
  const page = Number(new URL(url).searchParams.get("page"));
  const headers = page < 3 ? { link: "<" + root + "/actions/runs?per_page=100&page=" + (page + 1) + '>; rel="next"' } : {};
  const result = mutate(page, { total_count: entries.length, workflow_runs: entries.slice((page - 1) * 100, page * 100) }, headers);
  return json(result.data, result.headers);
} });
assert.equal((await pageReader().list("/actions/runs", "workflow_runs")).length, 205);
for (const mutate of [
  (p, d) => ({ data: d, headers: {} }),
  (p, d, h) => ({ data: { ...d, total_count: p === 2 ? 206 : 205 }, headers: h }),
  (p, d, h) => ({ data: { ...d, workflow_runs: p === 2 ? [{ id: 1 }, ...d.workflow_runs.slice(1)] : d.workflow_runs }, headers: h }),
  (p, d) => ({ data: d, headers: { link: "<" + root + '/actions/runs?per_page=100&page=3>; rel="next"' } }),
  (p, d) => ({ data: d, headers: { link: '<https://evil.example/next?per_page=100&page=2>; rel="next"' } }),
  (p, d) => ({ data: d, headers: { link: "<" + root + '/actions/runs?per_page=100&page=6>; rel="next"' } }),
]) await assert.rejects(pageReader(mutate).list("/actions/runs", "workflow_runs"));
let calls = [];
const logReader = createGithubEvidenceReader({ token: "PRIVATE_TOKEN_SENTINEL", now: () => now, fetchImpl: async (url, request) => {
  calls.push({ url, request });
  return calls.length === 1 ? new Response(null, { status: 302, headers: { location: "https://results.blob.core.windows.net/logs?signature=private" } }) : new Response("trusted log");
} });
assert.equal(await logReader.logs(1), "trusted log");
assert.equal(calls[1].request.headers.Authorization, undefined, "No credentials may follow log redirects.");
for (const status of [401, 403, 429, 500]) {
  let attempts = 0;
  const reader = createGithubEvidenceReader({ fetchImpl: async () => { attempts++; return json({}, {}, status); } });
  await assert.rejects(reader.get("")); assert.equal(attempts, 1);
}
const blockedRedirect = createGithubEvidenceReader({ fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://evil.example/logs" } }) });
await assert.rejects(blockedRedirect.logs(1));
const oversized = createGithubEvidenceReader({ fetchImpl: async () => new Response("{}", { headers: { "content-length": "2000001" } }) });
await assert.rejects(oversized.get(""));
const budget = createGithubEvidenceReader({ now: () => now, fetchImpl: async () => json({}) });
for (let i = 0; i < 50; i++) await budget.get("");
await assert.rejects(budget.get(""));
let clock = now;
const deadline = createGithubEvidenceReader({ now: () => clock, fetchImpl: async () => { clock += 120_001; return json({}); } });
await assert.rejects(deadline.get(""));
const invalidCli = spawnSync(process.execPath, ["scripts/agent-trusted-evidence.mjs", "--unknown", "PRIVATE_TOKEN_SENTINEL"], { encoding: "utf8" });
assert.notEqual(invalidCli.status, 0); assert.ok(!invalidCli.stderr.includes("PRIVATE_TOKEN_SENTINEL"));
console.log("Trusted evidence: GET-only producer-log binding, immutable identities/attempts, report tampering, freshness, races, CI/Pages separation, Worker status, full pagination, redirect credential isolation, bounded requests and private-data omission passed.");
