import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { spawnSync, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import YAML from "yaml";
import { requireValidation, requireCommit } from "./ci-validation-gate.mjs";

const sha = "a".repeat(40);
const valid = () => Object.fromEntries(["phase3", "cloudflare"].map(job => [job, { result: "success", outputs: { validated_sha: sha } }]));
assert.equal(requireValidation(sha, valid()), sha);
for (const missing of [null, undefined, {}, [], "success"]) assert.throws(() => requireValidation(sha, missing));
for (const job of ["phase3", "cloudflare"]) {
  for (const result of [undefined, null, "failure", "skipped", "cancelled", "pending", "neutral", "action_required", "timed_out", "unknown"]) {
    const needs = valid(); needs[job].result = result;
    assert.throws(() => requireValidation(sha, needs), /must finish successfully/);
  }
  for (const value of [undefined, "main", "b".repeat(40), sha.slice(0, 7)]) {
    const needs = valid(); needs[job].outputs.validated_sha = value;
    assert.throws(() => requireValidation(sha, needs), /immutable commit/);
  }
}
for (const value of [undefined, null, "", "main", "refs/heads/main", sha.slice(0, 7)]) assert.throws(() => requireCommit(value));
const phase = YAML.parse(readFileSync(".github/workflows/phase3-high-check.yml", "utf8"));
const cf = YAML.parse(readFileSync(".github/workflows/cloudflare-preview-build.yml", "utf8"));
const proposal = YAML.parse(readFileSync(".github/workflows/tradehq-code-agent.yml", "utf8"));
// Actor and file type never filter PR validation. Bot execution still needs GitHub approval when required.
for (const event of [{ actor: "owner", files: ["src/pages/About.tsx"] }, { actor: "owner", files: ["docs/example.md"] }, { actor: "github-actions[bot]", files: ["src/pages/About.tsx"] }]) {
  assert.deepEqual(phase.on.pull_request, { branches: ["main"] }, JSON.stringify(event));
  assert.equal(phase.jobs.phase3.if, undefined);
  assert.equal(phase.jobs.cloudflare.if, undefined);
}
assert.equal(cf.on.pull_request, undefined); // Reused once, no duplicate PR build.
assert.equal(cf.on.workflow_call.inputs.validation_sha.required, true);
assert.equal(phase.jobs.cloudflare.uses, "./.github/workflows/cloudflare-preview-build.yml");
assert.deepEqual(phase.jobs.validation.needs, ["phase3", "cloudflare"]);
assert.equal(phase.jobs.validation.if, "${{ always() }}");
assert.equal(phase.jobs.validation.steps.at(-1).env.VALIDATION_NEEDS, "${{ toJSON(needs) }}");
for (const workflow of [phase, cf]) {
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.equal(workflow.on.pull_request_target, undefined);
}
assert.deepEqual(proposal.jobs.verify.permissions, { contents: "read" });
assert.equal(proposal.jobs.verify.steps[0].with.ref, "${{ needs.propose.outputs.head_sha }}");
assert.ok(proposal.jobs.verify.steps.some(x => x.env?.TRADEHQ_BASE_SHA === "${{ needs.propose.outputs.base_sha }}"));
assert.equal(phase.jobs.phase3.steps[0].with.ref, "${{ github.event.pull_request.head.sha || github.sha }}");
assert.equal(cf.jobs.compatibility.steps[0].with.ref, "${{ inputs.validation_sha || github.sha }}");
const names = [phase.jobs.phase3.name, phase.jobs.validation.name, cf.jobs.compatibility.name];
assert.equal(new Set(names).size, names.length);
assert.ok(names.every(x => x !== "build"));
const localSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const run = (env, args = []) => spawnSync(process.execPath, ["scripts/ci-validation-gate.mjs", ...args], { encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", ...env } });
assert.equal(run({ VALIDATION_SHA: localSha }, ["--checkout"]).status, 0);
assert.notEqual(run({ VALIDATION_SHA: sha }, ["--checkout"]).status, 0);
const localNeeds = valid(); for (const job of Object.values(localNeeds)) job.outputs.validated_sha = localSha;
assert.equal(run({ VALIDATION_SHA: localSha, VALIDATION_NEEDS: JSON.stringify(localNeeds) }).status, 0);
for (const value of ["{", "null", "{}"]) assert.notEqual(run({ VALIDATION_SHA: localSha, VALIDATION_NEEDS: value }).status, 0);
// Execute the actual proposal script; the preload intercepts every network request.
const fixture = mkdtempSync(join(tmpdir(), "tradehq-proposal-binding-"));
try {
  mkdirSync(join(fixture, "src/pages"), { recursive: true });
  mkdirSync(join(fixture, "src/components"), { recursive: true });
  // Keep the safe fixture multi-line: a one-line export/JSX replacement would
  // correctly be refused by the production mechanical source-scope checker.
  writeFileSync(join(fixture, "src/pages/About.tsx"), [
    "export default function About() {",
    "  return <main>",
    '    <h1 className="mb-4">About our educational paper trading simulator</h1>',
    "  </main>;",
    "}",
  ].join("\n"));
  const output = join(fixture, "output");
  const args = ["--import", resolve("scripts/fixtures/proposal-binding.mjs"), resolve("scripts/agent-code-request.mjs")];
  const env = { ...process.env, GITHUB_REPOSITORY: "anugaweerasinghe1-del/trading101", GITHUB_SHA: sha,
    GITHUB_TOKEN: "offline-dummy", GEMINI_API_KEY: "offline-dummy", GEMINI_AGENT_MODEL: "gemini-3.5-flash-lite",
    TRADEHQ_ISSUE_NUMBER: "999", GITHUB_OUTPUT: output };
  const success = spawnSync(process.execPath, args, { cwd: fixture, env, encoding: "utf8", timeout: 10_000 });
  assert.equal(success.status, 0, success.stderr);
  assert.match(readFileSync(output, "utf8"), new RegExp("head_sha=" + "b".repeat(40) + "\\nbase_sha=" + sha));
  rmSync(output);
  const moved = spawnSync(process.execPath, args, { cwd: fixture, env: { ...env, MOCK_MOVED: "1" }, encoding: "utf8", timeout: 10_000 });
  assert.notEqual(moved.status, 0);
  assert.match(moved.stderr, /branch changed during drafting/);
  assert.equal(existsSync(output), false, "A moved proposal must not publish verification outputs.");
} finally { rmSync(fixture, { recursive: true, force: true }); }
console.log("CI gates: ordinary/docs/bot trigger contracts, exact checkout, both essential outcomes, malformed/missing/stale bindings and least privilege passed. Live bot approval remains external.");

await import("./verify-exact-pages-preview.test.mjs");
