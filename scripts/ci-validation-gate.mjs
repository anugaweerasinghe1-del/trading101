import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function requireCommit(sha) {
  assert.ok(typeof sha === "string" && /^[a-f0-9]{40}$/.test(sha), "Missing immutable validation commit.");
  return sha;
}

export function requireValidation(sha, needs) {
  requireCommit(sha);
  assert.ok(needs && typeof needs === "object" && !Array.isArray(needs), "Missing upstream results.");
  for (const job of ["phase3", "cloudflare"]) {
    assert.equal(needs[job]?.result, "success", job + " must finish successfully; skipped, pending and unknown are blocked.");
    assert.equal(needs[job]?.outputs?.validated_sha, sha, job + " did not validate the expected immutable commit.");
  }
  return sha;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const sha = requireCommit(process.env.VALIDATION_SHA);
    assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), sha,
      "Checked-out commit does not match validation evidence.");
    if (process.argv.includes("--checkout")) {
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, "validated_sha=" + sha + "\n");
    } else {
      requireValidation(sha, JSON.parse(process.env.VALIDATION_NEEDS || "null"));
    }
    console.log("Immutable validation binding passed for " + sha + "; owner approval and trusted Pages evidence remain separate.");
  } catch (error) {
    console.error("Validation blocked:", error.message);
    process.exitCode = 1;
  }
}
