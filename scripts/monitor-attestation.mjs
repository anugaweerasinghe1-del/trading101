import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

export const REPORT_TITLES = {
  route: "[TradeHQ Agent] Daily route report",
  browser: "[TradeHQ Agent] Browser smoke report",
};
export const ATTESTATION_PREFIX = "TRADEHQ_MONITOR_ATTESTATION ";
export const bodyDigest = body => createHash("sha256").update(body, "utf8").digest("hex");
export function isoTime(value) {
  assert.ok(typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value), "Invalid evidence timestamp.");
  const time = Date.parse(value);
  assert.ok(Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19), "Invalid calendar timestamp.");
  return time;
}
export function positiveId(value) {
  const id = Number(value);
  assert.ok(/^[1-9][0-9]*$/.test(String(value)) && Number.isSafeInteger(id), "Invalid evidence ID.");
  return id;
}
export function immutableSha(value) {
  assert.ok(typeof value === "string" && /^[a-f0-9]{40}$/.test(value), "Invalid immutable evidence SHA.");
  return value;
}
export function reportFields(body, source) {
  assert.ok(REPORT_TITLES[source] && typeof body === "string" && Buffer.byteLength(body) <= 24_000, "Invalid bounded report.");
  const field = label => {
    const values = [...body.matchAll(new RegExp("^\\*\\*" + label + ":\\*\\* ([^\\r\\n]+)$", "gm"))];
    assert.equal(values.length, 1, "Missing or ambiguous report field.");
    return values[0][1];
  };
  const observedAt = field("Checked at \\(UTC\\)");
  isoTime(observedAt);
  const runId = positiveId(field("GitHub run ID"));
  const checked = positiveId(field(source === "route" ? "URLs checked" : "Checked routes"));
  const rawFailed = field(source === "route" ? "Failed URLs" : "Potential failures");
  assert.ok(/^(0|[1-9][0-9]*)$/.test(rawFailed), "Invalid failure count.");
  const failed = Number(rawFailed);
  assert.ok(failed <= checked && checked <= (source === "route" ? 400 : 12), "Invalid report coverage.");
  return { observedAt, runId, checked, failed };
}
export function makeAttestation(source, body, issue, env) {
  const fields = reportFields(body, source);
  assert.equal(issue?.body, body, "Persisted monitoring body differs from the producer.");
  assert.equal(issue.title, REPORT_TITLES[source], "Wrong report issue.");
  assert.equal(issue.user?.login, "github-actions[bot]", "Monitoring report is not bot-authored.");
  assert.equal(env.GITHUB_REPOSITORY, "anugaweerasinghe1-del/trading101", "Unexpected monitoring repository.");
  assert.equal(fields.runId, positiveId(env.GITHUB_RUN_ID), "Monitoring run mismatch.");
  isoTime(issue.updated_at);
  return {
    schema: "tradehq-monitor-v1", source, repository: env.GITHUB_REPOSITORY,
    repositoryId: positiveId(env.GITHUB_REPOSITORY_ID), runId: fields.runId,
    attempt: positiveId(env.GITHUB_RUN_ATTEMPT), headSha: immutableSha(env.GITHUB_SHA),
    issueId: positiveId(issue.id), issueNumber: positiveId(issue.number),
    updatedAt: issue.updated_at, bodySha256: bodyDigest(body), ...fields,
  };
}
export function emitMonitorAttestation(source, body, issue) {
  const attestation = makeAttestation(source, body, issue, process.env);
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    attestation.headSha, "Monitor checkout changed.");
  // A digest is corroboration only when retrieved from the corresponding trusted Actions job.
  console.log(ATTESTATION_PREFIX + JSON.stringify(attestation));
}
