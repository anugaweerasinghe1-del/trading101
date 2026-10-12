/**
 * On-demand GET-only evidence collector. No models, issue/branch writes, schedule,
 * owner approval, code repair or release. Raw reports/logs never leave this process.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createGithubEvidenceReader, EVIDENCE_REPOSITORY, EVIDENCE_REPOSITORY_ID } from "./github-evidence-reader.mjs";
import { REPORT_TITLES, ATTESTATION_PREFIX, bodyDigest, isoTime, positiveId, immutableSha, reportFields } from "./monitor-attestation.mjs";
import { diagnosePublicFindings } from "./agent-repair-diagnosis.mjs";
import { monitorFindings } from "./agent-repair-review.mjs";

const workflowPath = ".github/workflows/tradehq-agents.yml";
const age = 30 * 60 * 60 * 1000;
const ciAge = 24 * 60 * 60 * 1000;
const ciWorkflows = new Map([
  [".github/workflows/phase3-high-check.yml", 368399831],
  [".github/workflows/cloudflare-preview-build.yml", 380314743],
]);
const requiredChecks = ["TradeHQ Phase 3 tests", "TradeHQ Cloudflare compatibility / Cloudflare build and SEO", "TradeHQ Required validation"];
const reportTitles = Object.values(REPORT_TITLES);
function interval(start, end, now, maxAge = age) {
  const a = isoTime(start), b = isoTime(end);
  assert.ok(a <= b && a >= now - maxAge && b <= now + 60_000, "Stale, future or inconsistent evidence time.");
  return [a, b];
}
function reportsFrom(issues) {
  const reports = [];
  for (const title of reportTitles) {
    const matches = issues.filter(x => x.title === title && !x.pull_request);
    assert.equal(matches.length, 1, "Missing or ambiguous monitor report.");
    const issue = matches[0];
    assert.ok(issue.state === "open" && issue.user?.login === "github-actions[bot]"
      && issue.user?.type === "Bot", "Untrusted monitoring report.");
    positiveId(issue.id); positiveId(issue.number); isoTime(issue.updated_at);
    reports.push(issue);
  }
  return reports;
}
function bindReport(source, issue, job, logs, run, now, expectedRoutes, purpose) {
  assert.ok(job.status === "completed" && ["success", "failure"].includes(job.conclusion)
    && job.run_id === run.id && job.head_sha === run.head_sha, "Failed, incomplete or mismatched monitor job.");
  const [start, end] = interval(job.started_at, job.completed_at, now);
  assert.ok(start >= isoTime(run.run_started_at) && end <= isoTime(run.updated_at) + 1000,
    "Monitor job is outside the current run attempt.");
  const records = [];
  for (const line of logs.split("\n")) {
    const at = line.indexOf(ATTESTATION_PREFIX);
    if (at < 0) continue;
    // Accept an actual console record, never a command/source snippet containing the marker.
    assert.ok(/^\uFEFF?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+$/.test(line.slice(0, at)), "Invalid attestation log record.");
    const logTime = Date.parse(line.slice(0, at).trim());
    assert.ok(logTime >= start && logTime <= end + 1000, "Attestation outside producing job.");
    let value;
    try { value = JSON.parse(line.slice(at + ATTESTATION_PREFIX.length)); } catch { throw Error("Malformed monitor attestation."); }
    records.push(value);
  }
  assert.equal(records.length, 1, "Missing or conflicting trusted monitor attestation; legacy reports are not upgraded to trusted.");
  const a = records[0], f = reportFields(issue.body, source);
  assert.ok(a.schema === "tradehq-monitor-v1" && a.source === source
    && a.repository === EVIDENCE_REPOSITORY && a.repositoryId === EVIDENCE_REPOSITORY_ID
    && a.runId === run.id && a.attempt === run.run_attempt && a.headSha === run.head_sha
    && a.issueId === issue.id && a.issueNumber === issue.number && a.updatedAt === issue.updated_at
    && a.bodySha256 === bodyDigest(issue.body) && a.observedAt === f.observedAt && a.runId === f.runId
    && a.checked === f.checked && a.failed === f.failed, "Tampered, edited, conflicting or mismatched report evidence.");
  assert.equal(f.checked, source === "route" ? expectedRoutes : 12, "Monitoring coverage differs from the reviewed inventory.");
  assert.equal(job.conclusion, f.failed > 0 ? "failure" : "success", "Report outcome contradicts monitor job.");
  if (purpose === "healthy") assert.equal(f.failed, 0, "Failed monitor evidence cannot authorize downstream automation.");
  const observed = isoTime(f.observedAt), updated = isoTime(issue.updated_at);
  assert.ok(observed >= start && observed <= end + 1000 && updated >= observed - 1000 && updated <= end + 1000,
    "Report was edited outside producing job.");
  return { source, issueId: issue.id, issueNumber: issue.number, updatedAt: issue.updated_at,
    bodySha256: a.bodySha256, observedAt: a.observedAt, checked: a.checked, failed: a.failed, jobId: job.id, conclusion: job.conclusion };
}
function same(before, after, message) { assert.equal(JSON.stringify(after), JSON.stringify(before), message); }
function providerChecks(checks, sha, now) {
  const trusted = checks.filter(x => x.head_sha === sha && x.app?.id === 85455
    && x.app?.slug === "cloudflare-workers-and-pages");
  const pages = trusted.filter(x => x.name === "Cloudflare Pages").sort((a, b) => b.id - a.id)[0];
  assert.ok(pages && pages.status === "completed" && pages.conclusion === "success", "Trusted Cloudflare Pages success missing.");
  interval(pages.started_at, pages.completed_at, now, ciAge);
  assert.ok(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(pages.external_id || ""), "Missing Pages deployment identity.");
  const url = new URL(pages.details_url);
  const resource = url.searchParams.get("to") || url.pathname;
  assert.ok(url.origin === "https://dash.cloudflare.com"
    && !url.username && !url.password && !url.hash
    && resource === "/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/" + pages.external_id, "Pages deployment identity mismatch.");
  const workers = trusted.filter(x => x.name.startsWith("Workers Builds:"));
  return { pages: { checkId: pages.id, headSha: sha, deploymentId: pages.external_id, conclusion: "success",
    environment: "not_verified_by_provider_dashboard" },
    workers: workers.map(x => ({ checkId: x.id, headSha: sha, conclusion: x.conclusion, status: x.status })),
    workerDependenciesVerified: false };
}
export async function collectTrustedEvidence({ runId, monitorSha, mainSha, targetSha = mainSha, prNumber,
  expectedRoutes = 352, purpose = "healthy", reader = createGithubEvidenceReader(), now = Date.now() }) {
  assert.ok(["healthy", "diagnosis"].includes(purpose), "Unknown evidence purpose.");
  positiveId(runId); immutableSha(monitorSha); immutableSha(mainSha); immutableSha(targetSha);
  assert.ok(Number.isFinite(now) && Number.isInteger(expectedRoutes) && expectedRoutes > 0 && expectedRoutes <= 400, "Invalid reviewed coverage/time.");
  const repo = await reader.get("");
  assert.ok(repo.id === EVIDENCE_REPOSITORY_ID && repo.full_name === EVIDENCE_REPOSITORY && repo.private === false, "Repository identity changed.");
  const main = await reader.get("/branches/main");
  assert.equal(main.commit?.sha, mainSha, "Main changed; collect again against verified main.");
  let pr;
  if (targetSha !== mainSha) {
    positiveId(prNumber);
    pr = await reader.get("/pulls/" + prNumber);
    assert.ok(pr.state === "open" && pr.head?.sha === targetSha && pr.base?.sha === mainSha
      && pr.head?.repo?.id === repo.id && pr.base?.repo?.id === repo.id, "Proposal head/base/repository mismatch.");
  }
  const run = await reader.get("/actions/runs/" + runId);
  assert.ok(run.id === runId && run.head_sha === monitorSha && run.path === workflowPath && run.workflow_id === 379806172 && run.head_branch === "main"
    && run.repository?.id === repo.id && run.head_repository?.id === repo.id
    && ["push", "schedule", "workflow_dispatch"].includes(run.event)
    && run.status === "completed" && (purpose === "healthy" ? run.conclusion === "success" : ["success", "failure"].includes(run.conclusion)), "Untrusted, failed or incomplete monitoring run.");
  positiveId(run.run_attempt);
  interval(run.run_started_at, run.updated_at, now);
  const ancestry = await reader.get("/compare/" + monitorSha + "..." + mainSha);
  assert.ok(["ahead", "identical"].includes(ancestry.status) && ancestry.base_commit?.sha === monitorSha
    && ancestry.merge_base_commit?.sha === monitorSha, "Monitor code is not on verified main history.");
  const issues = await reader.list("/issues?state=open", null);
  const reports = reportsFrom(issues);
  const jobs = await reader.list("/actions/runs/" + runId + "/attempts/" + run.run_attempt + "/jobs", "jobs");
  const bound = [];
  for (const [source, jobName] of [["route", "scan"], ["browser", "browser"]]) {
    const matches = jobs.filter(x => x.name === jobName);
    assert.equal(matches.length, 1, "Missing or ambiguous monitor job.");
    const issue = reports.find(x => x.title === REPORT_TITLES[source]);
    bound.push(bindReport(source, issue, matches[0], await reader.logs(matches[0].id), run, now, expectedRoutes, purpose));
  }
  assert.equal(run.conclusion, bound.some(report => report.failed > 0) ? "failure" : "success",
    "Monitoring run outcome conflicts with complete attested reports.");
  const findings = monitorFindings({ runId: String(runId), issues: reports }, { now });
  const checksPath = "/commits/" + targetSha + "/check-runs?filter=latest";
  const checks = await reader.list(checksPath, "check_runs");
  const provider = providerChecks(checks, targetSha, now);
  const actionsPath = "/actions/runs?head_sha=" + targetSha;
  const actions = await reader.list(actionsPath, "workflow_runs");
  assert.ok(actions.some(x => x.path === ".github/workflows/phase3-high-check.yml"), "Normal Phase 3 evidence missing.");
  const ci = [], ciJobSnapshots = [];
  for (const path of ciWorkflows.keys()) {
    const latest = actions.filter(x => x.path === path).sort((a, b) => b.id - a.id || b.run_attempt - a.run_attempt)[0];
    if (!latest) continue; // Reusable Cloudflare jobs share the Phase 3 run after #98.
    positiveId(latest.id); positiveId(latest.run_attempt);
    assert.ok(latest.head_sha === targetSha && latest.status === "completed" && latest.conclusion === "success",
      "Failed, inconclusive or stale target CI evidence.");
    assert.ok(latest.workflow_id === ciWorkflows.get(path) && latest.repository?.id === repo.id
      && latest.head_repository?.id === repo.id && ["push","pull_request","workflow_dispatch"].includes(latest.event),
      "Target CI workflow/repository identity mismatch.");
    const [start, end] = interval(latest.run_started_at, latest.updated_at, now, ciAge);
    // A failed-jobs rerun retains successful jobs from an earlier attempt.
    // Membership must come from GitHub's effective latest-job collection,
    // never from widening timestamps or accepting another run's check suite.
    const created = isoTime(latest.created_at);
    assert.ok(created <= start && created >= now - ciAge, "CI creation time is stale or inconsistent.");
    const checkIds = [];
    if (path === ".github/workflows/phase3-high-check.yml") {
      assert.equal(latest.event, pr ? "pull_request" : "push", "Normal CI event mismatch.");
      if (pr) {
        const matches = latest.pull_requests?.filter(x => x.number === prNumber && x.head?.sha === targetSha
          && x.base?.sha === mainSha && x.head?.repo?.id === repo.id && x.base?.repo?.id === repo.id);
        assert.equal(matches?.length, 1, "Normal CI PR binding missing or ambiguous.");
      } else assert.equal(latest.head_branch, "main", "Normal main CI branch mismatch.");
      positiveId(latest.check_suite_id);
      const jobsPath = "/actions/runs/" + latest.id + "/jobs?filter=latest";
      const effectiveJobs = await reader.list(jobsPath, "jobs");
      ciJobSnapshots.push({ path: jobsPath, jobs: effectiveJobs });
      for (const name of requiredChecks) {
        const matches = checks.filter(x => x.name === name);
        assert.equal(matches.length, 1, "Missing or ambiguous required CI check.");
        const check = matches[0]; positiveId(check.id);
        assert.ok(check.head_sha === targetSha && check.app?.id === 15368 && check.app?.slug === "github-actions"
          && check.check_suite?.id === latest.check_suite_id && check.status === "completed" && check.conclusion === "success",
          "Required CI identity, suite or outcome mismatch.");
        const [checkStart, checkEnd] = interval(check.started_at, check.completed_at, now, ciAge);
        const jobMatches = effectiveJobs.filter(x => x.name === name);
        assert.equal(jobMatches.length, 1, "Missing or ambiguous effective CI job.");
        const job = jobMatches[0]; positiveId(job.id);
        assert.ok(job.run_id === latest.id && job.head_sha === targetSha
          && job.status === "completed" && job.conclusion === "success"
          && job.check_run_url === "https://api.github.com/repos/" + EVIDENCE_REPOSITORY + "/check-runs/" + check.id,
          "Required CI check is not bound to the effective successful job.");
        const [jobStart, jobEnd] = interval(job.started_at, job.completed_at, now, ciAge);
        assert.ok(checkStart >= created && checkEnd <= end + 1000
          && jobStart >= created && jobEnd <= end + 1000
          && Math.abs(checkStart - jobStart) <= 1000 && Math.abs(checkEnd - jobEnd) <= 1000,
          "Required check/job times are outside the immutable CI run.");
        checkIds.push({ name, checkId: check.id, jobId: job.id });
      }
    }
    ci.push({ runId: latest.id, attempt: latest.run_attempt, workflow: path, workflowId: latest.workflow_id,
      headSha: latest.head_sha, status: latest.status, conclusion: latest.conclusion,
      startedAt: latest.run_started_at, completedAt: latest.updated_at, checks: checkIds });
  }
  // Re-read both identities and complete collections; no snapshot is considered atomic.
  same(main, await reader.get("/branches/main"), "Main moved during evidence collection.");
  same(run, await reader.get("/actions/runs/" + runId), "Run/attempt changed during evidence collection.");
  same(jobs, await reader.list("/actions/runs/" + runId + "/attempts/" + run.run_attempt + "/jobs", "jobs"),
    "Monitor jobs changed during evidence collection.");
  same(reports, reportsFrom(await reader.list("/issues?state=open", null)), "Reports changed during evidence collection.");
  same(checks, await reader.list(checksPath, "check_runs"), "Provider checks changed during evidence collection.");
  same(actions, await reader.list(actionsPath, "workflow_runs"), "CI changed during evidence collection.");
  for (const snapshot of ciJobSnapshots) {
    same(snapshot.jobs, await reader.list(snapshot.path, "jobs"), "Effective CI jobs changed during evidence collection.");
  }
  if (pr) same(pr, await reader.get("/pulls/" + prNumber), "Proposal changed during evidence collection.");
  return { schema: "tradehq-trusted-evidence-v1", purpose, collectedAt: new Date(now).toISOString(), repositoryId: repo.id,
    repository: EVIDENCE_REPOSITORY, mainSha, targetSha, monitoring: { workflow: workflowPath,
      runId, attempt: run.run_attempt, headSha: monitorSha, conclusion: run.conclusion, reports: bound, findings: findings.findings },
    diagnosis: purpose === "diagnosis" ? diagnosePublicFindings(findings.findings) : null,
    githubActions: ci, cloudflare: provider, apiRequests: reader.requestCount(),
    authorization: { codeWrites: false, modelCalls: false, ownerApproval: false, merge: false, productionRelease: false },
    limitations: ["Public monitoring only; no authenticated regression proof.", "Snapshot must be revalidated before any future side effect.",
      "Job-log binding is not owner approval. Main protection and trusted workflow review remain required.",
      "Worker dependencies, provider dashboard environment and free-tier headroom are unverified."] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const pairs = process.argv.slice(2);
    assert.ok(pairs.length % 2 === 0, "Expected named evidence arguments.");
    const options = {};
    for (let i = 0; i < pairs.length; i += 2) {
      assert.ok(["--run", "--monitor-sha", "--main", "--target", "--pr", "--purpose"].includes(pairs[i]) && !(pairs[i] in options), "Unknown/duplicate evidence argument.");
      options[pairs[i]] = pairs[i + 1];
    }
    const packet = await collectTrustedEvidence({ runId: positiveId(options["--run"]), monitorSha: options["--monitor-sha"],
      purpose: options["--purpose"] || "healthy", mainSha: options["--main"], targetSha: options["--target"] || options["--main"],
      prNumber: options["--pr"] ? positiveId(options["--pr"]) : undefined });
    console.log(JSON.stringify(packet, null, 2));
  } catch {
    // Never print remote bodies, redirect tokens or raw errors that may contain private data.
    console.error("Trusted evidence collection blocked: identity, freshness, completeness, job attestation or source access could not be verified. No authorization produced.");
    process.exitCode = 1;
  }
}
