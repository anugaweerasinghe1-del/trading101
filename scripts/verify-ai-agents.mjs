import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import YAML from "yaml";

const scripts = [
  "scripts/agent-code-request.mjs",
  "scripts/agent-monthly-ideas.mjs",
  "scripts/agent-monitor.mjs",
  "scripts/agent-browser-smoke.mjs",
  "scripts/agent-feature-inventory.mjs",
  "scripts/verify-ai-pr-scope.mjs",
];
const startup=spawnSync(process.execPath,["scripts/verify-isolated-chrome-startup.mjs"],{encoding:"utf8"});
assert.equal(startup.status,0,"Isolated Chrome startup guard failed: "+startup.stdout+startup.stderr);
console.log(startup.stdout.trim());
for (const file of scripts) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert.equal(result.status, 0, file + " syntax failed: " + result.stderr);
}
const reviewCheck=spawnSync(process.execPath,["scripts/verify-owner-pr-review.mjs"],{encoding:"utf8"});
assert.equal(reviewCheck.status,0,"Owner PR review evidence regression: "+reviewCheck.stdout+reviewCheck.stderr);
console.log(reviewCheck.stdout.trim());
const ownerWorkflow=YAML.parse(readFileSync(".github/workflows/tradehq-owner-pr-review.yml","utf8"));
assert.deepEqual(ownerWorkflow.on.pull_request_review,{types:["submitted"]});
assert.deepEqual(ownerWorkflow.permissions,{contents:"read","pull-requests":"read"});
assert.deepEqual(ownerWorkflow.jobs.review.permissions,{contents:"read","pull-requests":"read"});
assert.match(ownerWorkflow.jobs.review.if,/github.event.review.state == .approved./);
assert.match(ownerWorkflow.jobs.review.if,/github.repository_owner/);
assert.equal(ownerWorkflow.jobs.review.steps[0].with.ref,"main");
assert.equal(ownerWorkflow.jobs.review.steps[0].with["persist-credentials"],false);
assert.ok(ownerWorkflow.jobs.review.steps.some(step=>step.run==="node scripts/agent-owner-pr-review.mjs"));
assert.doesNotMatch(readFileSync(".github/workflows/tradehq-owner-pr-review.yml","utf8"),/\b(?:pull_request_target|contents: write|issues: write|pull-requests: write|gh pr merge)\b/);

const prewrite = spawnSync(process.execPath, ["scripts/verify-agent-code-preflight.mjs"], { encoding: "utf8" });
assert.equal(prewrite.status, 0, "Pre-write model-scope regression: "+prewrite.stdout+prewrite.stderr);
console.log(prewrite.stdout.trim());

const ownerProof = spawnSync(process.execPath, ["scripts/verify-owner-request-gate.mjs"], { encoding: "utf8" });
assert.equal(ownerProof.status, 0, "Owner proposal gate failed: "+ownerProof.stdout+ownerProof.stderr);
console.log(ownerProof.stdout.trim());

const scopeCheck = spawnSync(process.execPath, ["scripts/verify-ai-pr-scope.mjs", "--self-test"], { encoding: "utf8" });
assert.equal(scopeCheck.status, 0, "AI scope-check regression: " + scopeCheck.stdout + scopeCheck.stderr);
const dashboard = readFileSync("src/pages/AdminDashboard.tsx", "utf8");
const assistant = readFileSync("src/pages/AdminAIAssistant.tsx", "utf8");
assert.match(dashboard, /anugaweerasinghe1-del\/trading101/);
assert.match(assistant, /anugaweerasinghe1-del\/trading101/);
assert.match(assistant, /smoke-test proposal:/);
const evidence = readFileSync("src/lib/aiReleaseEvidence.ts", "utf8");
assert.match(evidence, /Cloudflare Pages deployment FAILED; release blocked/);
assert.match(evidence, /Cloudflare Pages deployment NOT VERIFIED/);
assert.match(evidence, /Workers Builds:/);
assert.match(assistant, /Validation unavailable/);
const workflow = readFileSync(".github/workflows/tradehq-code-agent.yml", "utf8");
const agent = readFileSync("scripts/agent-code-request.mjs", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const routes = readFileSync("scripts/routes.ts", "utf8");
assert.match(workflow, /github\.event\.issue\.user\.login == github\.repository_owner/);
assert.match(workflow, /pull-requests: write/);
assert.match(workflow, /contents: read/);
assert.match(workflow, /needs: propose/);
assert.match(workflow, /confirm-pr-created/);
assert.match(workflow, /pr_created/);
assert.match(workflow, /verify-ai-pr-scope\.mjs/);
assert.match(workflow, /VALIDATION_RESULT/);
assert.match(workflow, /run: npm run build:cloudflare/);
assert.match(workflow, /verify-cloudflare-seo\.mjs/);
assert.match(workflow, /verify-cloudflare-courses-root\.ts/);
assert.match(workflow, /TRADEHQ_CLOUDFLARE_LIVE: '0'/);
assert.match(workflow, /fetch-depth: 0/);
assert.match(agent, /pr_created=/);
assert.match(agent, /validateOwnerCodeRequest/);
assert.match(agent, /assertUnchangedOwnerIssue/);
assert.match(agent, /collectOwnerIssueHistory/);
assert.match(agent, /GITHUB_EVENT_PATH/);
assert.doesNotMatch(workflow, /merge_pull_request|gh pr merge|pull_request_target/);
assert.match(agent, /\/git\/refs/);
assert.match(agent, /draft: true/);
assert.match(agent, /MAX_FILES = 2/);
assert.match(agent, /src\\\/\(pages\|components\)/);
assert.match(agent, /Cannot|\ballowed\b/);
assert.match(app, /path="\/admin\/ai"/);
assert.match(routes, /"\/admin\/ai"/);
console.log("TradeHQ AI agent syntax, transfer owner, independent safety scope, route and review gates verified.");

const evidenceCheck = spawnSync(process.execPath, ["--import", "tsx", "scripts/verify-ai-release-evidence.ts"], { encoding: "utf8" });
assert.equal(evidenceCheck.status, 0, "AI release evidence regression: " + evidenceCheck.stdout + evidenceCheck.stderr);
console.log(evidenceCheck.stdout.trim());
const trustedCheck = spawnSync(process.execPath, ["scripts/verify-trusted-evidence.mjs"], { encoding: "utf8" });
assert.equal(trustedCheck.status, 0, "Trusted evidence regression: " + trustedCheck.stdout + trustedCheck.stderr);
console.log(trustedCheck.stdout.trim());

const ownerApprovalCheck = spawnSync(process.execPath, ['scripts/verify-repair-approval-server.mjs'], { encoding: 'utf8' });
assert.equal(ownerApprovalCheck.status, 0, 'Repair approval server regression: '+ownerApprovalCheck.stdout+ownerApprovalCheck.stderr);
console.log(ownerApprovalCheck.stdout.trim());
const syntheticDraftCheck = spawnSync(process.execPath, ['scripts/verify-synthetic-draft-pr.mjs'], { encoding: 'utf8' });
assert.equal(syntheticDraftCheck.status, 0, 'Synthetic draft PR regression: '+syntheticDraftCheck.stdout+syntheticDraftCheck.stderr);
console.log(syntheticDraftCheck.stdout.trim());

const gateTest = spawnSync(process.execPath, ['scripts/verify-evidence-cycle.mjs'], { encoding: 'utf8' });
assert.equal(gateTest.status, 0, 'Read-only evidence cycle regression: '+gateTest.stdout+gateTest.stderr);
console.log(gateTest.stdout.trim());
const memoryTest = spawnSync(process.execPath, ['scripts/verify-incident-memory.mjs'], { encoding: 'utf8' });
assert.equal(memoryTest.status, 0, 'Offline incident-memory regression: '+memoryTest.stdout+memoryTest.stderr);
console.log(memoryTest.stdout.trim());
const feedbackTest = spawnSync(process.execPath, ['scripts/verify-incident-feedback.mjs'], { encoding: 'utf8' });
assert.equal(feedbackTest.status, 0, 'Authenticated incident feedback regression: '+feedbackTest.stdout+feedbackTest.stderr);
console.log(feedbackTest.stdout.trim());
const learningTest = spawnSync(process.execPath, ['scripts/verify-incident-learning.mjs'], { encoding: 'utf8' });
assert.equal(learningTest.status, 0, 'Statistical incident learning regression: '+learningTest.stdout+learningTest.stderr);
console.log(learningTest.stdout.trim());
const approvalTransactionTest = spawnSync(process.execPath, ['scripts/verify-repair-approval-transaction.mjs'], { encoding: 'utf8' });
assert.equal(approvalTransactionTest.status, 0, 'Durable approval transaction regression: '+approvalTransactionTest.stdout+approvalTransactionTest.stderr);
console.log(approvalTransactionTest.stdout.trim());
const adminChatTest = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/verify-admin-agent-chat.ts'], { encoding: 'utf8' });
assert.equal(adminChatTest.status, 0, 'Admin chat pilot regression: '+adminChatTest.stdout+adminChatTest.stderr);
console.log(adminChatTest.stdout.trim());
