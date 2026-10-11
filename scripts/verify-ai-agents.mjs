import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const scripts = [
  "scripts/agent-code-request.mjs",
  "scripts/agent-monthly-ideas.mjs",
  "scripts/agent-monitor.mjs",
  "scripts/agent-browser-smoke.mjs",
  "scripts/agent-feature-inventory.mjs",
  "scripts/verify-ai-pr-scope.mjs",
];
for (const file of scripts) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert.equal(result.status, 0, file + " syntax failed: " + result.stderr);
}
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
