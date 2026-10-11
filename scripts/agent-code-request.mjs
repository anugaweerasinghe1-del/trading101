/**
 * TradeHQ's review-gated, free-tier Gemini coding assistant.
 * Invoked ONLY for repository-owner GitHub issues with the special title.
 * Writes existing non-sensitive frontend files to an isolated PR branch.
 * NO auto-merge, backend updates, migrations, Actions changes, or deployments.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { requestGeminiJson } from "./gemini-free-models.mjs";
const repo = process.env.GITHUB_REPOSITORY || "anugaweerasinghe1-del/trading101";
const token = process.env.GITHUB_TOKEN;
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_AGENT_MODEL || "gemini-3.5-flash-lite";
const issueNumber = Number(process.env.TRADEHQ_ISSUE_NUMBER);
const prefix = "[TradeHQ Code Request]";
const deadline = 40000;
const root = process.cwd();
const MAX_CHARS = 14000;
const MAX_BODY = 2500;
const MAX_FILES = 2;

async function github(method, endpoint, body) {
  const response = await fetch("https://api.github.com/repos/" + repo + endpoint, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const status = response.status;
    throw new Error("GitHub API failed (" + status + ") at " + endpoint.split("?")[0]);
  }
  return response.json();
}
async function comment(message) {
  if (!token || !Number.isInteger(issueNumber)) return;
  await github("POST", "/issues/" + issueNumber + "/comments", { body: message.slice(0, 3000) });
}
function allowed(file) {
  // Keep authentication, admin controls, market execution, backend and secrets out of model-write scope.
  if (typeof file !== "string" || file.includes("..") || file.includes("\\") || file.startsWith("/")) return false;
  if (!/^src\/(pages|components)\/[A-Za-z0-9_/-]+\.tsx$/.test(file)) return false;
  const forbidden = [
    /(^|\/)Admin/i, /(^|\/)(Auth|ResetPassword|Trade|TradeAsset|Portfolio|Challenge|TraderProfile|PublicTrader)\.tsx$/i,
    /(^|\/)(Security|Consent|Payment|Billing)/i,
    /^src\/components\/ui\//,
    /^src\/components\/courses\/CourseDraftEditor\.tsx$/,
  ];
  return !forbidden.some(pattern => pattern.test(file));
}
async function collect(directory, results = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(full, results);
    else if (entry.isFile()) {
      const relative = path.relative(root, full).replaceAll(path.sep, "/");
      if (allowed(relative)) results.push(relative);
    }
  }
  return results;
}
async function generate(prompt, maxOutputTokens) {
  if (!apiKey) throw new Error("No GEMINI_API_KEY secret configured. Open repository Settings → Secrets and variables → Actions.");
  const { value } = await requestGeminiJson({
    apiKey, prompt, preferredModel: model,
    temperature: 0.15, maxOutputTokens, timeoutMs: deadline,
  });
  return value;
}
async function main() {
  if (!token || !Number.isInteger(issueNumber) || issueNumber <= 0) throw new Error("Missing trusted GitHub Actions environment.");
  const issue = await github("GET", "/issues/" + issueNumber);
  const owner = repo.split("/")[0];
  if (issue.user?.login !== owner || issue.title?.trim() !== prefix || issue.pull_request || issue.state !== "open") {
    throw new Error("Only open requests submitted by the repository owner under the exact Code Request title are processed.");
  }
  const request = String(issue.body || "").trim();
  if (request.length < 20 || request.length > MAX_BODY) throw new Error("Describe a specific request in 20–2500 characters.");
  // Public GitHub issues are intentional: never accept or publish credentials, private information or user data.
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_|github_pat_|sb_secret_|AIza[0-9A-Za-z_-]{30,}/i.test(request)) throw new Error("Possible credential detected. Remove secrets from the public issue.");
  const candidates = (await collect(path.join(root, "src/pages"))).concat(await collect(path.join(root, "src/components"))).sort();
  const selection = await generate([
    "You are TradeHQ's cautious frontend engineer. Choose at most TWO existing files from the EXACT candidate list.",
    "The website is a free educational paper trading simulator (no real money).",
    "Request from repository owner: " + request,
    "Allowed existing TSX files: " + JSON.stringify(candidates),
    "Return JSON ONLY: {\"paths\":[\"one/existing/path.tsx\"],\"reason\":\"short explanation\"}.",
    "Prefer to decline complex, risky, unclear or cross-system requests by returning an empty paths array.",
    "Do not choose backend, auth, trading execution, config, CI, admin security or payment files.",
  ].join("\n"), 500);
  const chosen = selection.paths;
  if (!Array.isArray(chosen) || !chosen.length || chosen.length > MAX_FILES || chosen.some(f => !candidates.includes(f)) || new Set(chosen).size !== chosen.length) {
    await comment("I couldn't safely select one or two eligible frontend files. No code was changed. Please narrow the request or use normal engineering review.");
    return;
  }
  const originals = await Promise.all(chosen.map(async file => {
    const content = await fs.readFile(path.join(root, file), "utf8");
    if (content.length > MAX_CHARS || content.length < 80) throw new Error("Selected file is too large or too small for the safe edit limit: " + file);
    return { path: file, content };
  }));
  const answer = await generate([
    "You are editing a public educational React/TypeScript website for a human review-only pull request.",
    "Request: " + request,
    "Selected CURRENT files (preserve functionality; do not add imports to new files): " + JSON.stringify(originals),
    "Return JSON ONLY: {\"summary\":\"short\", \"changes\":[{\"path\":\"exact selected filename\",\"content\":\"FULL replacement source code\"}]}.",
    "Return each selected file exactly once, with complete and syntactically valid TSX contents.",
    "Never change authentication, business calculations, trading workflows, portfolio updates, backend, secrets, policies, hooks, CI or package dependencies.",
    "Don't invent capabilities, providers, financial outcomes, user statistics, endorsements or investment recommendations.",
    "If unsure, preserve the original code unchanged. All changes require human review and tests.",
  ].join("\n"), 10000);
  const edits = answer.changes;
  if (!Array.isArray(edits) || edits.length !== originals.length || edits.some(c => !chosen.includes(c.path) || typeof c.content !== "string")) throw new Error("AI response did not exactly match the selected files.");
  const changes = edits.filter(edit => originals.find(x => x.path === edit.path)?.content !== edit.content);
  if (!changes.length) { await comment("Gemini determined no safe change was necessary. No branch was created."); return; }
  for (const edit of changes) {
    const original = originals.find(x => x.path === edit.path).content;
    if (edit.content.length < original.length * 0.65 || edit.content.length > original.length * 1.7 ||
        edit.content.length > MAX_CHARS + 2500 || !edit.content.includes("export")) {
      throw new Error("AI output changed too much of a file or failed preservation checks: " + edit.path);
    }
  }
  const mainRef = await github("GET", "/git/ref/heads/main");
  const baseSha = mainRef.object?.sha;
  if (!/^[0-9a-f]{40}$/.test(baseSha || "")) throw new Error("Could not verify main branch commit.");
  if (process.env.GITHUB_SHA && baseSha !== process.env.GITHUB_SHA) throw new Error("Main branch changed during drafting. Request a fresh proposal to prevent stale-file overwrites.");
  const branch = "ai/issue-" + issueNumber;
  await github("POST", "/git/refs", { ref: "refs/heads/" + branch, sha: baseSha });
  let headSha;
  for (const edit of changes) {
    const originalSha = await github("GET", "/contents/" + edit.path + "?ref=" + encodeURIComponent(branch));
    const written = await github("PUT", "/contents/" + edit.path, {
      message: "AI proposal for request #" + issueNumber + ": " + edit.path,
      branch, sha: originalSha.sha, content: Buffer.from(edit.content, "utf8").toString("base64"),
    });
    headSha = written.commit?.sha;
  }
  if (!/^[0-9a-f]{40}$/.test(headSha || "")) throw new Error("Could not verify the proposed commit.");
  const proposedRef = await github("GET", "/git/ref/heads/" + branch);
  if (proposedRef.object?.sha !== headSha) throw new Error("Proposal branch changed during drafting; independent verification stopped.");
  const title = "AI proposal: " + request.replace(/\s+/g, " ").slice(0, 65);
  const prBody = [
    "Closes #" + issueNumber,
    "### Proposed change", String(answer.summary || "Frontend update").slice(0, 1200),
    "### Files", changes.map(x => "- " + x.path).join("\n"),
    "### Safety",
    "- Generated using the Gemini free-tier only; no paid fallback.",
    "- This pull request was NOT merged or deployed.",
    "- Changes are restricted to existing non-sensitive TSX files.",
    "- Automated tests are launched in a separate read-only job without AI credentials.",
    "- The owner must review all code, security implications, AdSense/YMYL claims, and tests before merging.",
  ].join("\n\n");
  let prUrl, prCreated = false, prError = "";
  try {
    const pr = await github("POST", "/pulls", { title, head: branch, base: "main", body: prBody, draft: true });
    prUrl = pr.html_url;
    prCreated = true;
  } catch (error) {
    prError = error instanceof Error ? error.message.slice(0,250) : "Unknown GitHub PR permission error";
    prUrl = "https://github.com/" + repo + "/compare/main..." + branch;
  }
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT,
    "branch=" + branch + "\nhead_sha=" + headSha + "\nbase_sha=" + baseSha + "\npr_created=" + String(prCreated) + "\n");
  await comment("AI proposed edits on an isolated branch. Review here: " + prUrl +
    (prCreated ? "\n\nDraft PR created successfully; human review required." :
    "\n\n⚠️ Automatic draft PR creation failed: " + prError +
    "\nRepository owner: check Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create pull requests.") +
    "\nNo changes were merged or deployed. Check the separate read-only validation job.");
  console.log("AI edited " + changes.length + " file(s); draft PR created: " + prCreated + ". " + prUrl);
}
try { await main(); }
catch(error) {
  const message = error instanceof Error ? error.message : "Unknown agent failure";
  console.error("Agent stopped safely:", message);
  try { await comment("AI coding request paused. No automatic production changes. Reason: " + message.slice(0, 1000)); } catch { /* Logging was already attempted. */ }
  process.exitCode = 1;
}
