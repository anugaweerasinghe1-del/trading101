/**
 * Stage 2, offline advisory review only. No network, credentials, code writes,
 * issue writes, model calls or release actions. Input assertions are NOT trusted
 * authorization; every output explicitly denies code/release automation.
 */
import ts from "typescript";
import { createHash } from "node:crypto";
import { openSync, readSync, closeSync, fstatSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFailures } from "./agent-repair-triage.mjs";

const ROUTE_REPORT = "[TradeHQ Agent] Daily route report";
const BROWSER_REPORT = "[TradeHQ Agent] Browser smoke report";
const ROUTE_FAILURES = "[TradeHQ Agent] Website route failures";
const BROWSER_FAILURES = "[TradeHQ Agent] Browser smoke failures";
const SHA = /^[a-f0-9]{40}$/;
const RUN_ID = /^[1-9][0-9]{0,19}$/;
const MAX_AGE_MS = 30 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const SOURCE_LIMIT = 64000;
// Deliberately narrower than the existing code agent. This is NOT a write grant.
const LOW_RISK_FILE = "src/pages/About.tsx";
const STYLE_TOKEN = /^(?:(?:sm|md|lg|xl|2xl):)?(?:text-(?:xs|sm|base|lg|xl|[2-6]xl)|leading-(?:none|tight|snug|normal|relaxed|loose)|tracking-(?:tighter|tight|normal|wide|wider|widest)|[mp][trblxy]?-(?:0|1|2|3|4|5|6|8|10|12|16|20|24))$/;
const LAYOUT_SYMPTOMS = new Set(["HEADING_READABILITY", "LAYOUT_OVERFLOW"]);
const rank = { LOW: 0, MEDIUM: 1, HIGH: 2 };

function publicPath(value) {
  if (typeof value !== "string" || value.length > 180 || !/^\/(?:[A-Za-z0-9._-]+\/?)*$/.test(value)
    || value.startsWith("//") || value.split("/").some(part => part === "." || part === "..")) return null;
  return value === "/" ? value : value.replace(/\/$/, "");
}
function finiteTime(value) {
  // Avoid permissive Date.parse accepting e.g. an empty/null date or bare year.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19) ? time : NaN;
}
function diffTokens(before, after) {
  const counts = new Map();
  for (const token of before) counts.set(token, (counts.get(token) || 0) + 1);
  for (const token of after) counts.set(token, (counts.get(token) || 0) - 1);
  return [...counts.values()].reduce((total, count) => total + Math.abs(count), 0);
}
function classLiterals(text) {
  const source = ts.createSourceFile("About.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (source.parseDiagnostics.length) return null;
  const values = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === "className"
      && node.initializer && ts.isStringLiteral(node.initializer)) {
      const start = node.initializer.getStart(source), end = node.initializer.end;
      values.push({ start, end, value: node.initializer.text });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  let stripped = text;
  for (const value of [...values].reverse()) {
    stripped = stripped.slice(0, value.start) + '"__review_class_literal__"' + stripped.slice(value.end);
  }
  return { values, stripped };
}
export function classifyRepairScope(changes) {
  const high = reason => ({ risk: "HIGH", reason, proof: "Not within the demonstrated presentation scope." });
  if (!Array.isArray(changes) || changes.length !== 1) return high("Only one known existing presentation file can be mechanically assessed.");
  const change = changes[0];
  if (!change || change.path !== LOW_RISK_FILE || change.status !== "modified") {
    return high("Protected or unknown file, rename, addition or deletion: owner code permission required.");
  }
  if (typeof change.before !== "string" || typeof change.after !== "string" || !change.before.length
    || !change.after.length || change.before.length > SOURCE_LIMIT || change.after.length > SOURCE_LIMIT) {
    return high("Complete bounded base and proposal source are required.");
  }
  const before = classLiterals(change.before), after = classLiterals(change.after);
  if (!before || !after || before.stripped !== after.stripped || before.values.length !== after.values.length) {
    return high("Logic, copy, metadata, structure or an unrecognized edit changed; impact needs owner investigation.");
  }
  let attributes = 0, tokens = 0;
  for (let i = 0; i < before.values.length; i++) {
    const oldValue = before.values[i].value, newValue = after.values[i].value;
    if (oldValue === newValue) continue;
    attributes++;
    const oldTokens = oldValue.trim().split(/\s+/).filter(Boolean);
    const newTokens = newValue.trim().split(/\s+/).filter(Boolean);
    if (oldTokens.length > 100 || newTokens.length > 100
      || JSON.stringify(oldTokens.filter(token => !STYLE_TOKEN.test(token)))
        !== JSON.stringify(newTokens.filter(token => !STYLE_TOKEN.test(token)))) {
      return high("An edit changed a token outside the bounded typography/spacing allowlist.");
    }
    tokens += diffTokens(oldTokens, newTokens);
  }
  if (!attributes) return high("No demonstrated repair change.");
  if (attributes > 16 || tokens > 80) return high("Presentation scope exceeded; do not prepare an automated repair.");
  const risk = attributes <= 4 && tokens <= 12 ? "LOW" : "MEDIUM";
  return { risk, reason: risk === "LOW" ? "Only small literal typography/spacing edits were identified."
    : "Presentation-only change is larger than the low-risk limit; substantial UI review required.",
    proof: "All other source bytes are unchanged after removing literal className values.", attributes, tokens };
}
export function candidateId(finding) {
  const path = publicPath(finding?.path);
  if (!path || !["route", "browser", "manual"].includes(finding?.source)
    || typeof finding?.symptom !== "string" || !/^[A-Z][A-Z0-9_]{1,39}$/.test(finding.symptom)) {
    throw Error("Invalid normalized public finding; no raw logs accepted.");
  }
  return "repair-v1-" + createHash("sha256").update(JSON.stringify([finding.source, path, finding.symptom])).digest("hex").slice(0, 24);
}
function symptom(reason) {
  // Exact structured layout signal from an attested synthetic test only. Existing
  // public browsers do not currently emit it, and diagnosis still defaults HIGH.
  if (reason === "LAYOUT_OVERFLOW") return "LAYOUT_OVERFLOW";
  if (/Production JS bundle/i.test(reason)) return "BUNDLE_UNAVAILABLE";
  const http = reason.match(/\bHTTP ([45][0-9]{2})\b/);
  if (http) return "HTTP_" + http[1];
  if (/No HTML title/i.test(reason)) return "MISSING_TITLE";
  if (/blank screen|very little visible content|React root element/i.test(reason)) return "BLANK_ROOT";
  if (/application\/API error|API returned 429/i.test(reason)) return "VISIBLE_ERROR";
  if (/timed out|failed|Chrome exit|Chrome did not return HTML/i.test(reason)) return "REQUEST_OR_RENDER_FAILED";
  return "UNCLASSIFIED";
}
/** Reuse recurrence parsing, but read failures ONLY from the same-run summary
 * bodies. Old standalone failure issues cannot supply evidence for a new run.
 * Truncated reports stop assessment rather than silently losing findings.
 */
export function monitorFindings(snapshot, { now = Date.now() } = {}) {
  if (!Number.isFinite(now) || !snapshot || !RUN_ID.test(String(snapshot.runId || ""))
    || !Array.isArray(snapshot.issues) || snapshot.issues.length > 100) throw Error("Invalid bounded monitor snapshot.");
  const reports = [ROUTE_REPORT, BROWSER_REPORT].map(title => {
    const matches = snapshot.issues.filter(issue => issue?.title === title && !issue.pull_request
      && issue.state === "open" && issue.user?.login === "github-actions[bot]");
    if (matches.length !== 1) throw Error("Exactly one trusted report from each monitor is required.");
    const report = matches[0];
    if (!Number.isSafeInteger(report.number) || report.number <= 0 || typeof report.body !== "string" || report.body.length > 24000) {
      throw Error("Invalid monitor report metadata.");
    }
    const dates = [...report.body.matchAll(/^\*\*Checked at \(UTC\):\*\* ([^\r\n]+)$/gm)];
    const runIds = [...report.body.matchAll(/^\*\*GitHub run ID:\*\* ([^\r\n]+)$/gm)];
    const time = dates.length === 1 ? finiteTime(dates[0][1]) : NaN;
    if (runIds.length !== 1 || runIds[0][1] !== String(snapshot.runId) || !Number.isFinite(time)
      || now - time > MAX_AGE_MS || time - now > FUTURE_TOLERANCE_MS) throw Error("Monitor reports are stale, future-dated or not from the exact requested run.");
    return { ...report, observedAt: dates[0][1] };
  });
  for (const [i, label] of ["Failed URLs", "Potential failures"].entries()) {
    const counts = [...reports[i].body.matchAll(new RegExp("^\\*\\*" + label + ":\\*\\* ([0-9]+)$", "gm"))];
    if (counts.length !== 1) throw Error("Failure counts missing or ambiguous.");
  }
  const failures = readFailures([
    ...reports,
    { ...reports[0], title: ROUTE_FAILURES },
    { ...reports[1], title: BROWSER_FAILURES },
  ], String(snapshot.runId));
  const routeRecords = [...reports[0].body.matchAll(/^- (\/[^\s:]*): ([^\r\n]+)$/gm)];
  const browserRecords = [...reports[1].body.matchAll(/^- `(\/[^\s`]+)`: ([^\r\n]+)$/gm)];
  if (routeRecords.length !== failures.routeCount || browserRecords.length !== failures.browserCount
    || failures.records.length !== routeRecords.length + browserRecords.length) {
    throw Error("Incomplete or truncated same-run evidence; manual investigation required.");
  }
  const findings = new Map();
  for (const record of failures.records) {
    const path = publicPath(record.path);
    const sourceReport = record.source === "route" ? reports[0] : reports[1];
    const finding = { path, source: record.source, symptom: symptom(record.reason) };
    const id = candidateId(finding);
    if (!findings.has(id)) findings.set(id, { ...finding, id, reportIssue: sourceReport.number,
      observations: [{ runId: String(snapshot.runId), observedAt: sourceReport.observedAt }] });
  }
  return { runId: String(snapshot.runId), reportIssues: reports.map(report => report.number),
    coverage: "Public route/rendering samples only; no authenticated functionality proven.", findings: [...findings.values()] };
}
export function buildRepairReview(input, { now = Date.now() } = {}) {
  if (!input || !Number.isFinite(now)) throw Error("Invalid review input.");
  const id = candidateId(input.finding);
  const scope = classifyRepairScope(input.changes);
  const routeRisk = publicPath(input.finding.path) === "/about" && LAYOUT_SYMPTOMS.has(input.finding.symptom) ? "LOW" : "HIGH";
  const risk = rank[scope.risk] >= rank[routeRisk] ? scope.risk : routeRisk;
  const observations = Array.isArray(input.finding.observations) ? input.finding.observations : [];
  const valid = observations.length > 0 && observations.length <= 35 && observations.every(observation => {
    const time = finiteTime(observation?.observedAt);
    return observation && RUN_ID.test(String(observation.runId || "")) && Number.isFinite(time)
      && time - now <= FUTURE_TOLERANCE_MS && now - time <= 2 * MAX_AGE_MS;
  });
  // Multiple jobs/attempts in ONE run do not prove independent recurrence.
  const independentRuns = valid ? new Set(observations.map(observation => String(observation.runId))).size : 0;
  const recent = valid && now - Math.max(...observations.map(observation => finiteTime(observation.observedAt))) <= MAX_AGE_MS;
  const historyValid = Array.isArray(input.history) && input.history.length <= 100 && input.history.every(attempt =>
    attempt && /^repair-v1-[a-f0-9]{24}$/.test(attempt.id || "") && ["open", "failed", "closed"].includes(attempt.state)
    && Number.isFinite(finiteTime(attempt.at)) && finiteTime(attempt.at) <= now + FUTURE_TOLERANCE_MS);
  let stage;
  if (input.ownerStop !== false) stage = "OWNER_STOP_ACTIVE";
  else if (!valid || !recent || !SHA.test(input.baseSha || "") || !SHA.test(input.headSha || "") || input.baseSha === input.headSha) stage = "EVIDENCE_UNVERIFIED";
  else if (!historyValid) stage = "HISTORY_UNVERIFIED";
  else if (input.history.some(attempt => attempt.id === id)) stage = "EXISTING_OR_PREVIOUS_REPAIR";
  else if (input.history.some(attempt => attempt.state === "open" || now - finiteTime(attempt.at) < 24 * 60 * 60 * 1000)) stage = "REPAIR_FREQUENCY_LIMIT";
  else if (independentRuns < 2) stage = "NEEDS_INDEPENDENT_REPRODUCTION";
  else if (risk === "HIGH") stage = "OWNER_CODE_PERMISSION_REQUIRED";
  else stage = "OWNER_REVIEW_REQUIRED";
  return {
    mode: "offline-advisory", id, path: publicPath(input.finding.path), symptom: input.finding.symptom,
    baseSha: SHA.test(input.baseSha || "") ? input.baseSha : null,
    headSha: SHA.test(input.headSha || "") ? input.headSha : null,
    risk, scope, stage, independentRuns,
    ownerCodePermissionRequired: risk === "HIGH", ownerReleaseApprovalRequired: true,
    codeModificationAllowed: false, productionReleaseAllowed: false,
    automaticDiagnosisAllowed: false, automaticReleaseEnabled: false,
    cost: { modelCalls: 0, networkRequests: 0, providerQuotaVerified: false },
    limitations: ["Input metadata is an assertion, not independently collected proof or owner authorization.",
      "Recurrence is not root-cause confirmation; human reproduction and cause analysis are still required.",
      "Exact-head independent tests, Pages preview, user-flow checks, actual quotas and rollback remain separate gates."],
  };
}
function main() {
  if (process.argv.length !== 4 || process.argv[2] !== "--input") throw Error("Usage: node scripts/agent-repair-review.mjs --input snapshot.json");
  const file = openSync(process.argv[3], "r");
  let raw;
  try {
    if (!fstatSync(file).isFile()) throw Error("A regular JSON snapshot file is required.");
    const buffer = Buffer.alloc(1024 * 1024 + 1);
    let size = 0, read;
    do { read = readSync(file, buffer, size, buffer.length - size, null); size += read; } while (read && size < buffer.length);
    if (size > 1024 * 1024) throw Error("Input exceeds the 1 MB offline assessment limit.");
    raw = buffer.subarray(0, size);
  } finally { closeSync(file); }
  const input = JSON.parse(raw.toString("utf8"));
  const result = input.monitorSnapshot ? monitorFindings(input.monitorSnapshot) : buildRepairReview(input);
  console.log(JSON.stringify({ mode: "offline-advisory", codeModificationAllowed: false,
    productionReleaseAllowed: false, automaticReleaseEnabled: false, result }, null, 2));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { main(); } catch { console.error("Offline repair review stopped: invalid, incomplete or stale input. No actions performed."); process.exitCode = 1; }
}
