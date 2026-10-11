/** Deterministic read-only diagnosis. Called in memory after trusted collection.
 * Imported/edited JSON and AI claims never grant authority. No source writes,
 * shell commands, model calls, network requests, credentials or release hooks.
 */
import assert from "node:assert/strict";
import { candidateId } from "./agent-repair-review.mjs";
const noAuthority = () => ({ codeWrites: false, modelCalls: false, ownerApproval: false, merge: false, productionRelease: false });
const protectedRoute = path => /^\/(?:auth|portfolio|trade|leaderboard|reviews|courses|daily|admin)(?:\/|$)/.test(path);
const checks = {
  BUNDLE_UNAVAILABLE: ["PUBLIC_ASSET_DELIVERY", "Reproduce the exact public asset failure and correlate the deployed commit; do not edit hosting configuration."],
  MISSING_TITLE: ["SEO_METADATA", "Reproduce the missing title on the exact route and rendered page; SEO changes require owner code review."],
  BLANK_ROOT: ["RENDERING_FAILURE", "Reproduce the blank root in an isolated browser and inspect sanitized console output; source cause is unverified."],
  VISIBLE_ERROR: ["APPLICATION_OR_DATA_FAILURE", "Reproduce the visible error without sign-in or trades; provider or authentication changes require owner permission."],
  REQUEST_OR_RENDER_FAILED: ["PROBE_OR_DELIVERY_FAILURE", "Repeat one read-only public probe independently; a timeout alone does not prove a site defect."],
};
export function diagnosePublicFindings(findings) {
  assert.ok(Array.isArray(findings) && findings.length <= 100, "Invalid bounded diagnosis findings.");
  const seen = new Set();
  const items = findings.map(finding => {
    const id = candidateId(finding);
    assert.equal(finding.id, id, "Finding identity changed.");
    assert.ok(!seen.has(id) && ["route", "browser"].includes(finding.source), "Duplicate or unverified diagnosis source.");
    seen.add(id);
    let [category, nextCheck] = checks[finding.symptom] || ["UNKNOWN_CAUSE", "Manual reproduction and source review required; no repair hypothesis is supported."];
    if (/^HTTP_[45][0-9]{2}$/.test(finding.symptom)) {
      category = finding.symptom === "HTTP_429" ? "RATE_LIMIT_RESPONSE" : "PUBLIC_HTTP_FAILURE";
      nextCheck = finding.symptom === "HTTP_429"
        ? "Correlate Retry-After, shared budget and provider quota evidence; a 429 does not identify which limit was reached. Preserve quote semantics."
        : "Reproduce the exact public HTTP outcome and verify intended route behavior against the deployed commit.";
    }
    return { id, path: finding.path, source: finding.source, symptom: finding.symptom, category,
      risk: "HIGH", protectedRoute: protectedRoute(finding.path), status: "NEEDS_INDEPENDENT_REPRODUCTION",
      rootCauseVerified: false, proposalAllowed: false, nextCheck };
  });
  return { mode: "deterministic-read-only", items, authorization: noAuthority(), cost: { modelCalls: 0, additionalNetworkRequests: 0 },
    limitations: ["Public failures are observed symptoms, not root causes or authenticated regression proof.",
      "Current monitors do not establish a low-risk About typography/spacing defect. No automatic patch is proposed.",
      "Durable controls, owner identity, verified free quota and independent reproduction remain required before any proposal side effect."] };
}
