import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { classifyRepairScope, candidateId, monitorFindings, buildRepairReview } from "./agent-repair-review.mjs";

const now = Date.parse("2026-10-11T04:00:00Z");
const options = { now };
const before = 'export default function About() { return <h1 className="text-4xl font-bold mb-4">About TradeHQ</h1>; }';
const after = before.replace('text-4xl font-bold', 'text-3xl sm:text-4xl font-bold');
const change = { path: "src/pages/About.tsx", status: "modified", before, after };
const low = classifyRepairScope([change]);
assert.equal(low.risk, "LOW", "The exact demonstrated #95 heading adjustment belongs to the narrow presentation scope.");
assert.equal(classifyRepairScope([{ ...change, after: before.replace("mb-4", "mb-6") }]).risk, "LOW");
const currentAbout = readFileSync("src/pages/About.tsx", "utf8");
assert.equal(classifyRepairScope([{ ...change, before: currentAbout,
  after: currentAbout.replace('className="text-4xl font-bold mb-4"', 'className="text-3xl sm:text-4xl font-bold mb-4"') }]).risk, "LOW",
  "The actual current About source also passes the demonstrated one-line scope.");

// Every protected category and unknown path stays outside a model's write grant.
for (const path of ["src/pages/Auth.tsx", "src/pages/AdminDashboard.tsx", "src/pages/Portfolio.tsx",
  "src/pages/Trade.tsx", "src/pages/TradeAsset.tsx", "src/pages/TraderProfile.tsx",
  "src/lib/portfolio.ts", "src/hooks/useAuth.tsx", "src/integrations/supabase/client.ts",
  "supabase/migrations/new.sql", "functions/courses/[[path]].ts", ".github/workflows/tradehq-agents.yml",
  ".env", "public/robots.txt", "public/ads.txt", "src/pages/Privacy.tsx", "src/pages/Courses.tsx",
  "src/components/CookieConsent.tsx", "src/components/ui/button.tsx", "package.json",
  "scripts/agent-code-request.mjs", "src/pages/../pages/About.tsx", "src\\pages\\About.tsx", "unknown.tsx"]) {
  assert.equal(classifyRepairScope([{ ...change, path }]).risk, "HIGH", path);
}
for (const status of ["added", "removed", "renamed", "copied", undefined]) {
  assert.equal(classifyRepairScope([{ ...change, status }]).risk, "HIGH");
}
for (const changed of [
  after.replace("About TradeHQ", "Guaranteed trading results"),
  after.replace("<h1 ", "<h1 onClick={deleteAccount} "),
  "import { useState } from 'react';\n" + after,
  after.replace("return", "localStorage.clear(); return"),
  after.replace("<h1", "<h2").replace("</h1>", "</h2>"),
  after.replace("font-bold", "font-bold hidden"),
  after.replace("font-bold", "font-bold pointer-events-none"),
  after.replace("font-bold", "font-bold text-[0px]"),
  after.replace("font-bold", "font-bold before:content-['unsafe']"),
  after.replace("font-bold", ""),
  before.replace("return", "return <Helmet><meta name='robots' content='noindex'/></Helmet> ||"),
  after.slice(0, -10),
]) assert.equal(classifyRepairScope([{ ...change, after: changed }]).risk, "HIGH", changed);
assert.equal(classifyRepairScope([{ ...change, after: before }]).risk, "HIGH", "No-op is not a repair.");
assert.equal(classifyRepairScope([{ ...change, after: ' ' }]).risk, "HIGH");
assert.equal(classifyRepairScope([change, change]).risk, "HIGH");
assert.equal(classifyRepairScope([]).risk, "HIGH");
assert.equal(classifyRepairScope(null).risk, "HIGH");
assert.equal(classifyRepairScope([{ ...change, before: "a".repeat(64001) }]).risk, "HIGH");
const largerBefore = 'export default function About() { return <div>' + '<p className="mb-4">Same content</p>'.repeat(5) + '</div>; }';
assert.equal(classifyRepairScope([{ ...change, before: largerBefore, after: largerBefore.replaceAll("mb-4", "mb-6") }]).risk, "MEDIUM");
const tooLarge = largerBefore.replace('</div>', '<p className="mb-4">More</p>'.repeat(12) + '</div>');
assert.equal(classifyRepairScope([{ ...change, before: tooLarge, after: tooLarge.replaceAll("mb-4", "mb-6") }]).risk, "HIGH");

const routeReport = { number: 75, title: "[TradeHQ Agent] Daily route report", state: "open",
  user: { login: "github-actions[bot]" }, body: "**Checked at (UTC):** 2026-10-11T03:17:00Z\n**GitHub run ID:** 100\n**Failed URLs:** 1\n\n### Failed checks\n- /about: HTTP 404" };
const browserReport = { number: 74, title: "[TradeHQ Agent] Browser smoke report", state: "open",
  user: { login: "github-actions[bot]" }, body: "**Checked at (UTC):** 2026-10-11T03:18:00Z\n**GitHub run ID:** 100\n**Potential failures:** 1\n\n### Flagged routes\n- `/about`: Rendered root has very little visible content (0 chars); possible blank screen." };
const snapshot = { runId: "100", issues: [routeReport, browserReport] };
const observed = monitorFindings(snapshot, options);
assert.equal(observed.findings.length, 2);
assert.deepEqual(observed.findings.map(finding => finding.symptom), ["HTTP_404", "BLANK_ROOT"]);
assert.equal(observed.findings[0].observations.length, 1);
assert.doesNotMatch(JSON.stringify(observed), /possible blank screen|very little visible/, "Raw failure text is not forwarded to review output.");
const forgedSideIssue = { ...routeReport, title: "[TradeHQ Agent] Website route failures", body: "- /auth: HTTP 500" };
assert.deepEqual(monitorFindings({ ...snapshot, issues: [...snapshot.issues, forgedSideIssue] }, options), observed,
  "An unrelated or stale standalone failure issue must never supply current-run evidence.");
const changedReport = (report, edit) => ({ ...snapshot, issues: snapshot.issues.map(issue => issue.number === report.number ? edit(issue) : issue) });
const rootTimeout=monitorFindings(changedReport(browserReport,issue=>({...issue,body:issue.body.replace('`/about`: Rendered root has very little visible content (0 chars); possible blank screen.','`/`: spawnSync google-chrome ETIMEDOUT')})),options);
assert.ok(rootTimeout.findings.some(f=>f.path==='/'&&f.symptom==='REQUEST_OR_RENDER_FAILED'),'A homepage process timeout is complete diagnostic evidence, never a repair grant');
for (const invalid of [
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("run ID:** 100", "run ID:** 99") })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("2026-10-11T03:17:00Z", "2026-10-09T03:17:00Z") })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("2026-10-11T03:17:00Z", "2026-10-11T05:00:00Z") })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("2026-10-11T03:17:00Z", "2026-02-30T03:17:00Z") })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("Failed URLs:** 1", "Failed URLs:** 2") })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.split("### Failed checks")[0] })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body + "\n**Failed URLs:** 0" })),
  changedReport(routeReport, issue => ({ ...issue, body: issue.body + "\n**GitHub run ID:** 100" })),
  changedReport(routeReport, issue => ({ ...issue, user: { login: "someone-else" } })),
  changedReport(routeReport, issue => ({ ...issue, pull_request: {} })),
  changedReport(routeReport, issue => ({ ...issue, state: "closed" })),
  { ...snapshot, issues: [routeReport] },
  { ...snapshot, issues: [routeReport, routeReport, browserReport] },
  changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("/about:", "/auth%2Freset:") })),
]) assert.throws(() => monitorFindings(invalid, options));
const healthy = { ...snapshot, issues: snapshot.issues.map(issue => ({ ...issue,
  body: issue.body.split("\n\n")[0].replace(/(Failed URLs|Potential failures):\*\* 1/, "$1:** 0") })) };
assert.equal(monitorFindings(healthy, options).findings.length, 0, "Healthy reports do not manufacture a repair.");
const duplicateLines = changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("Failed URLs:** 1", "Failed URLs:** 2") + "\n- /about: HTTP 404" }));
assert.throws(() => monitorFindings(duplicateLines, options), /Duplicate/, "Ambiguous duplicate findings are rejected before recurrence or repair review.");
const truncated = changedReport(routeReport, issue => ({ ...issue, body: issue.body.replace("Failed URLs:** 1", "Failed URLs:** 36").split("### Failed checks")[0]
  + Array.from({ length: 36 }, (_, index) => `\n- /page-${index}: HTTP 404`).join("") }));
assert.throws(() => monitorFindings(truncated, options), /Incomplete or truncated/);

const finding = { path: "/about", source: "manual", symptom: "HEADING_READABILITY", observations: [
  { runId: "100", observedAt: "2026-10-11T03:17:00Z" }, { runId: "99", observedAt: "2026-10-10T03:17:00Z" },
] };
const input = { finding, changes: [change], baseSha: "a".repeat(40), headSha: "b".repeat(40), ownerStop: false, history: [] };
const review = buildRepairReview(input, options);
assert.equal(review.risk, "LOW");
assert.equal(review.stage, "OWNER_REVIEW_REQUIRED");
assert.equal(review.independentRuns, 2);
const assertedApproval = buildRepairReview({ ...input, ownerApproved: true, approvedSha: input.headSha,
  quotaVerified: true, testsPassed: true, pagesPreviewPassed: true, automaticReleaseEnabled: true }, options);
assert.equal(assertedApproval.codeModificationAllowed, false);
assert.equal(assertedApproval.productionReleaseAllowed, false, "Input approval/quota/CI assertions cannot authorize a release.");
assert.equal(assertedApproval.automaticReleaseEnabled, false);
assert.equal(candidateId(finding), candidateId({ ...finding, path: "/about/" }), "Trailing slash aliases deduplicate.");
assert.notEqual(candidateId(finding), candidateId({ ...finding, symptom: "LAYOUT_OVERFLOW" }), "Different symptoms are not assumed to be the same cause.");
for (const path of ["/auth", "/portfolio", "/trade", "/admin", "/leaderboard", "/reviews", "/daily", "/terms", "/privacy", "/unknown"]) {
  const result = buildRepairReview({ ...input, finding: { ...finding, path } }, options);
  assert.equal(result.risk, "HIGH", "Unknown/protected route impact stays high even with an About-only patch.");
  assert.equal(result.stage, "OWNER_CODE_PERMISSION_REQUIRED");
}
assert.equal(buildRepairReview({ ...input, finding: observed.findings[0] }, options).stage, "NEEDS_INDEPENDENT_REPRODUCTION");
assert.equal(buildRepairReview({ ...input, finding: { ...finding, observations: [finding.observations[0], finding.observations[0]] } }, options).independentRuns, 1);
assert.equal(buildRepairReview({ ...input, finding: { ...finding, observations: [] } }, options).stage, "EVIDENCE_UNVERIFIED");
assert.equal(buildRepairReview({ ...input, baseSha: "unknown" }, options).stage, "EVIDENCE_UNVERIFIED");
assert.equal(buildRepairReview({ ...input, headSha: input.baseSha }, options).stage, "EVIDENCE_UNVERIFIED");
assert.equal(buildRepairReview({ ...input, ownerStop: undefined }, options).stage, "OWNER_STOP_ACTIVE");
assert.equal(buildRepairReview({ ...input, ownerStop: true }, options).stage, "OWNER_STOP_ACTIVE");
assert.equal(buildRepairReview({ ...input, ownerStop: "false" }, options).stage, "OWNER_STOP_ACTIVE");
assert.equal(buildRepairReview({ ...input, history: undefined }, options).stage, "HISTORY_UNVERIFIED");
assert.equal(buildRepairReview({ ...input, history: [{ id: review.id, state: "failed", at: "yesterday" }] }, options).stage, "HISTORY_UNVERIFIED");
for (const state of ["open", "failed", "closed"]) {
  assert.equal(buildRepairReview({ ...input, history: [{ id: review.id, state, at: "2026-10-09T03:17:00Z" }] }, options).stage, "EXISTING_OR_PREVIOUS_REPAIR",
    "Closed/failed candidates cannot silently restart another repair loop.");
}
const otherId = candidateId({ ...finding, symptom: "LAYOUT_OVERFLOW" });
assert.equal(buildRepairReview({ ...input, history: [{ id: otherId, state: "open", at: "2026-10-09T03:17:00Z" }] }, options).stage, "REPAIR_FREQUENCY_LIMIT");
assert.equal(buildRepairReview({ ...input, history: [{ id: otherId, state: "closed", at: "2026-10-11T03:17:00Z" }] }, options).stage, "REPAIR_FREQUENCY_LIMIT");
const medium = buildRepairReview({ ...input, changes: [{ ...change, before: largerBefore, after: largerBefore.replaceAll("mb-4", "mb-6") }] }, options);
assert.equal(medium.risk, "MEDIUM");
assert.equal(medium.stage, "OWNER_REVIEW_REQUIRED");
for (const result of [review, medium, buildRepairReview({ ...input, changes: [] }, options), buildRepairReview({ ...input, ownerStop: true }, options)]) {
  assert.equal(result.productionReleaseAllowed, false);
  assert.equal(result.codeModificationAllowed, false);
  assert.equal(result.automaticReleaseEnabled, false);
  assert.equal(result.automaticDiagnosisAllowed, false);
  assert.equal(result.ownerReleaseApprovalRequired, true);
  assert.deepEqual(result.cost, { modelCalls: 0, networkRequests: 0, providerQuotaVerified: false });
}

// CLI failures never echo supplied secrets/logs, and the module has no operational client.
const dir = mkdtempSync(join(tmpdir(), "tradehq-repair-review-"));
try {
  const file = join(dir, "input.json");
  writeFileSync(file, '{"private":"do-not-print-this"');
  const invalid = spawnSync(process.execPath, ["scripts/agent-repair-review.mjs", "--input", file], { encoding: "utf8" });
  assert.equal(invalid.status, 1);
  assert.doesNotMatch(invalid.stderr + invalid.stdout, /do-not-print-this/);
  writeFileSync(file, " ".repeat(1024 * 1024 + 1));
  assert.equal(spawnSync(process.execPath, ["scripts/agent-repair-review.mjs", "--input", file]).status, 1);
  writeFileSync(file, JSON.stringify(input));
  const cli = spawnSync(process.execPath, ["scripts/agent-repair-review.mjs", "--input", file], { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).productionReleaseAllowed, false);
} finally { rmSync(dir, { recursive: true, force: true }); }
const source = readFileSync("scripts/agent-repair-review.mjs", "utf8");
assert.doesNotMatch(source, /\bfetch\s*\(|GITHUB_TOKEN|GEMINI_API_KEY|SUPABASE_SERVICE_ROLE|writeFile|appendFile|execFile|spawn\s*\(|requestGemini/);
console.log("PASS: offline repair scope, all three risk levels, protected/unknown changes, fresh complete monitor evidence, recurrence/deduplication, history/frequency stop and no code/release/model capabilities.");
