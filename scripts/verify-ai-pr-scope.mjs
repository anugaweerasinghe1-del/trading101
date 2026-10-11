/**
 * Independent, credential-free guard for Gemini's proposed frontend branch.
 * Executes in a read-only GitHub Actions job after the model has drafted a branch.
 * Does not accept an LLM's assurance of safety as evidence.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const maxFiles = 2;
const maxChangedLines = 80;
const safePath = /^src\/(pages|components)\/[A-Za-z0-9_/-]+\.tsx$/;
const excluded = [
  /(^|\/)Admin/i, /(^|\/)(Auth|ResetPassword|Trade|TradeAsset|Portfolio|Challenge|TraderProfile|PublicTrader)\.tsx$/i,
  /(^|\/)(Security|Consent|Payment|Billing)/i, /^src\/components\/ui\//,
  /^src\/components\/courses\/CourseDraftEditor\.tsx$/,
];
const sensitiveEdit = /\b(?:import|export|fetch|supabase|useState|useEffect|useMemo|useCallback|localStorage|sessionStorage|onClick|onSubmit|onChange|navigate|setTimeout|setInterval|eval|dangerouslySetInnerHTML)\b|(?:window|document|process)\s*\./;

export function inspectScope(files, numstat, patch) {
  assert.ok(files.length > 0 && files.length <= maxFiles,
    "AI branch must change 1–2 existing low-risk frontend files (found " + files.length + ").");
  assert.equal(new Set(files).size, files.length, "Duplicate changed file path.");
  for (const file of files) {
    assert.ok(safePath.test(file) && !file.includes("..") && !excluded.some(x => x.test(file)),
      "Disallowed path in AI proposal: " + file);
    const stat = numstat.find(x => x.path === file);
    assert.ok(stat && Number.isInteger(stat.add) && Number.isInteger(stat.del),
      "AI proposal cannot add, delete, rename or modify binary files: " + file);
    assert.ok(stat.add > 0 && stat.del > 0 && stat.add + stat.del <= maxChangedLines,
      "Large or destructive source change; manually review instead: " + file);
  }
  const editedLines = patch.split("\n").filter(line =>
    (line.startsWith("+") && !line.startsWith("+++")) ||
    (line.startsWith("-") && !line.startsWith("---")));
  assert.ok(editedLines.length > 0, "No reviewable code changes.");
  for (const line of editedLines) {
    assert.ok(!sensitiveEdit.test(line.slice(1)),
      "AI changed logic, imports, hooks or an event handler. Owner-led development required.");
  }
  return files.length;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 }).trim();
}

if (process.argv.includes("--self-test")) {
  assert.equal(inspectScope(["src/pages/About.tsx"],
    [{ path: "src/pages/About.tsx", add: 2, del: 2 }],
    "@@ -1 +1 @@\n-<h1 className=\"mb-4\">About</h1>\n+<h1 className=\"mb-3 sm:mb-4\">About</h1>"), 1);
  assert.throws(() => inspectScope(["src/pages/AdminDashboard.tsx"],
    [{ path: "src/pages/AdminDashboard.tsx", add: 1, del: 1 }], "-foo\n+bar"), /Disallowed/);
  assert.throws(() => inspectScope(["src/pages/About.tsx"],
    [{ path: "src/pages/About.tsx", add: 1, del: 1 }], "-old\n+onClick={saveUser}"), /logic/);
  assert.throws(() => inspectScope(["src/pages/About.tsx"],
    [{ path: "src/pages/About.tsx", add: 60, del: 60 }], "-old\n+new"), /Large/);
  console.log("AI proposal scope tests passed.");
} else if (process.argv[1] && process.argv[1].endsWith("verify-ai-pr-scope.mjs")) {
  // Both ends must be immutable, supplied by the trusted proposal job.
  const baseSha = process.env.TRADEHQ_BASE_SHA, headSha = process.env.TRADEHQ_HEAD_SHA;
  assert.ok(/^[a-f0-9]{40}$/.test(baseSha || "") && /^[a-f0-9]{40}$/.test(headSha || ""), "Missing immutable proposal base/head.");
  assert.equal(git(["rev-parse", "HEAD"]), headSha, "Checkout is not the proposed commit.");
  git(["merge-base", "--is-ancestor", baseSha, headSha]);
  const base = baseSha + "..." + headSha;
  const files = git(["diff", "--name-only", base, "--"]).split("\n").filter(Boolean);
  const numstat = git(["diff", "--numstat", base, "--"]).split("\n").filter(Boolean).map(row => {
    const [added, deleted, ...name] = row.split("\t");
    return { path: name.join("\t"), add: Number(added), del: Number(deleted) };
  });
  const patch = git(["diff", "--unified=0", base, "--"]);
  const count = inspectScope(files, numstat, patch);
  console.log("Read-only independent scope check passed for " + count + " file(s); separate build and regression checks still required.");
}
