/**
 * Independently check a Gemini candidate BEFORE a branch, blob or PR is written.
 * Runs git diff only on disposable files, without network, credentials or AI calls.
 * The actual immutable proposal diff is still checked independently after writing.
 */
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { inspectScope } from "./verify-ai-pr-scope.mjs";

const MAX_FILES = 2;
const MAX_DIFF_BYTES = 3200;
const MAX_FILE_CHARS = 16500;
const activeContent = /\bon[A-Z][A-Za-z]*\s*=|\b(?:href|src|action|formAction)\s*=\s*["'\x60]\s*(?:javascript:|https?:\/\/)|<\s*(?:iframe|script|object|embed|form)\b/i;

function diffInIsolation(original, edited) {
  const directory = mkdtempSync(join(tmpdir(), "tradehq-ai-preflight-"));
  try {
    const before = join(directory, "before.tsx");
    const after = join(directory, "after.tsx");
    writeFileSync(before, original, { encoding: "utf8", mode: 0o600 });
    writeFileSync(after, edited, { encoding: "utf8", mode: 0o600 });
    const result = spawnSync("git", [
      "-c", "core.quotePath=false", "diff", "--no-index", "--unified=0",
      "--no-ext-diff", "--no-textconv", "--", before, after,
    ], {
      encoding: "utf8", timeout: 4000, maxBuffer: 512 * 1024,
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
    });
    assert.ok(!result.error && result.status === 1 && typeof result.stdout === "string",
      "Independent disposable Git diff failed or edit was unchanged");
    const lines = result.stdout.split("\n").filter(line =>
      (line.startsWith("+") && !line.startsWith("+++")) ||
      (line.startsWith("-") && !line.startsWith("---")));
    assert.ok(lines.length > 0, "No reviewable change lines");
    assert.ok(Buffer.byteLength(lines.join("\n"), "utf8") <= MAX_DIFF_BYTES,
      "Changed source bytes exceed the bounded AI preflight limit");
    const add = lines.filter(line => line[0] === "+").length;
    const del = lines.filter(line => line[0] === "-").length;
    assert.ok(add > 0 && del > 0, "Adding-only or deleting-only changes require manual review");
    for (const line of lines) assert.ok(!activeContent.test(line.slice(1)),
      "Embedded navigation, network URLs or event handlers require manual review");
    return { patch: result.stdout, add, del };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function inspectAiCandidate(originals, changes) {
  assert.ok(Array.isArray(originals) && originals.length > 0 && originals.length <= MAX_FILES,
    "Expected one or two original allowed source files");
  assert.ok(Array.isArray(changes) && changes.length > 0 && changes.length <= MAX_FILES,
    "Expected one or two changed source files");
  const seen = new Set();
  const originalByPath = new Map();
  for (const entry of originals) {
    assert.ok(entry && typeof entry.path === "string" && typeof entry.content === "string"
      && !originalByPath.has(entry.path), "Invalid or duplicate original source");
    originalByPath.set(entry.path, entry.content);
  }
  const files = [], stats = [], patches = [];
  for (const entry of changes) {
    assert.ok(entry && typeof entry.path === "string" && typeof entry.content === "string"
      && originalByPath.has(entry.path) && !seen.has(entry.path),
      "Changed file must match one distinct verified original");
    seen.add(entry.path);
    const original = originalByPath.get(entry.path);
    assert.ok(!original.includes("\0") && !entry.content.includes("\0")
      && original.length >= 80 && original.length <= MAX_FILE_CHARS
      && entry.content.length >= original.length * 0.65
      && entry.content.length <= original.length * 1.7
      && entry.content.length <= MAX_FILE_CHARS,
      "Binary, oversized or destructive source replacement denied");
    const { patch, add, del } = diffInIsolation(original, entry.content);
    files.push(entry.path);
    stats.push({ path: entry.path, add, del });
    patches.push(patch);
  }
  // This is the SAME independent scope guard used by the subsequent read-only
  // validation job, not a softer second set of allowlist rules.
  const checked = inspectScope(files, stats, patches.join("\n"));
  return Object.freeze({ checkedFiles: checked, changedLines: stats.reduce((n,s) => n+s.add+s.del,0),
    authorization: Object.freeze({merge:false,release:false}) });
}
