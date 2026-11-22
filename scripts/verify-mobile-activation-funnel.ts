import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { trackLearningMilestone, recordConsentedLearningVisit } from "../src/lib/learningTelemetry";
import { ARENA_ANALYTICS_CONSENT_KEY } from "../src/lib/arenaTelemetry";

const read = (path: string) => readFileSync(path, "utf8");
const asset = read("src/pages/TradeAsset.tsx");
const mobile = read("src/components/trading/MobileOrderDrawer.tsx");
const trade = read("src/pages/Trade.tsx");
const learn = read("src/pages/Learn.tsx");
const telemetry = read("src/lib/learningTelemetry.ts");

assert.equal((asset.match(/<MobileOrderDrawer/g) ?? []).length, 1,
  "Exactly one mobile order drawer should exist on an asset page");
assert.match(asset, /data-testid="asset-mobile-order-launcher"/,
  "Expose a stable accessibility and automation target");
assert.ok(asset.indexOf('data-testid="asset-mobile-order-launcher"') <
  asset.indexOf("Trading Terminal Grid"),
  "Mobile order launcher must precede the chart");
assert.ok(asset.indexOf('data-testid="asset-mobile-order-launcher"') <
  asset.indexOf("GEO Key Takeaways"),
  "Long-form SEO/GEO explanations must not bury the mobile product action");
assert.match(asset, /data-testid="asset-chart" className="[^"]*h-\[520px\]/,
  "Retain previously tested chart dimensions so tiny-price axis labels remain visible");
assert.match(asset, /onClick=\{\(\) => trackLearningMilestone\("Bitcoin Guide Selected"\)\}/);
assert.match(asset, /onClick=\{\(\) => trackLearningMilestone\("Bitcoin Glossary Selected"\)\}/);
assert.match(asset, /if \(selectedAsset\?\.id === "btc"\) trackLearningMilestone\("Bitcoin Simulator Viewed"\)/);

assert.match(mobile, /Promise<boolean \| void> \| boolean \| void/,
  "Mobile order callback must accept an explicit confirmed/rejected result");
assert.match(mobile, /if \(confirmed === false\)/,
  "Explicit rejection must prevent the drawer from closing");
const start = mobile.indexOf("const confirmed = await onTrade(");
const reject = mobile.indexOf("if (confirmed === false)", start);
const reset = mobile.indexOf('setAmount("");', reject);
const close = mobile.indexOf("setIsOpen(false);", reset);
assert.ok(start > 0 && reject > start && reset > reject && close > reset,
  "User input may be cleared and drawer closed only after a confirmed outcome");
assert.match(mobile, /role="alert"/, "A failed order must explain that it was not confirmed");
assert.match(mobile, /setConfirmationFailed\(true\)/);
assert.match(mobile, /submittingRef\.current/, "Rapid taps must not duplicate in-flight orders");
assert.match(mobile, /\[asset\?\.id\]/, "Switching assets resets stale inputs and drawer");
assert.match(mobile, /Open \$\{asset\.symbol\} virtual practice order/,
  "Accessible label states it is a virtual order");
assert.match(mobile, /trackLearningMilestone\("Mobile Order Panel Opened"\)/);
assert.match(mobile, /<RevengeTradingBlocker/, "Existing risk guardrails remain in place");

for (const [name, file] of [["asset",asset],["terminal",trade]] as const) {
  assert.match(file, /trackLearningMilestone\("Virtual Practice Order Confirmed"\)/, name + " must measure confirmed practice orders");
  assert.match(file, /trackLearningMilestone\("Virtual Practice Order Rejected"\)/, name + " must measure rejected practice orders");
  assert.match(file, /if \(!portfolioOwnerIs\(result\.ownerId \?\? null\)\) return false;/,
    name + " owner mismatch must not be treated as successful");
  assert.match(file, /return true;/, name + " returns true only after confirmed order");
  assert.match(file, /return false;/, name + " returns false when not confirmed");
}

assert.match(learn, /recordConsentedLearningVisit\(\)/, "Learning hub is counted as a meaningful landing");
assert.match(learn, /trackLearningMilestone\("Learning Hub Viewed"\)/);
assert.doesNotMatch(telemetry, /track\([^\n]+(email|userId|symbol|quantity|totalValue|portfolio)/,
  "Learning analytics must not include private account or trading data");

const previousWindow = (globalThis as {window?: unknown}).window;
const store = new Map<string,string>();
const emitted: string[] = [];
(globalThis as {window?: unknown}).window = {
  localStorage: {
    getItem: (k:string) => store.get(k) ?? null,
    setItem: (k:string,v:string) => {store.set(k,v);}
  },
  __tradehqAmplitudeStarted: true,
  amplitude: {track: (name:string, props?:Record<string,number>) => {
    assert.ok(!props || Object.keys(props).every(k => k === "days_since_learning_visit"));
    emitted.push(name);
  }}
};
trackLearningMilestone("Bitcoin Simulator Viewed");
trackLearningMilestone("Mobile Order Panel Opened");
trackLearningMilestone("Virtual Practice Order Confirmed");
recordConsentedLearningVisit(new Date("2026-11-21T06:00:00Z"));
assert.equal(emitted.length, 0, "No funnel events may be tracked before consent");

store.set(ARENA_ANALYTICS_CONSENT_KEY, "accepted");
trackLearningMilestone("Bitcoin Simulator Viewed");
trackLearningMilestone("Mobile Order Panel Opened");
trackLearningMilestone("Virtual Practice Order Rejected");
trackLearningMilestone("Learning Hub Viewed");
recordConsentedLearningVisit(new Date("2026-11-21T06:00:00Z"));
assert.equal(emitted.length, 0, "v3 consent is insufficient for newly introduced mobile/learning funnel events");
store.set(ARENA_ANALYTICS_CONSENT_KEY, "rejected");
trackLearningMilestone("Virtual Practice Order Confirmed");
assert.equal(emitted.length,0,"Consent withdrawal cannot enable new funnel tracking");
(globalThis as {window?: unknown}).window = previousWindow;

console.log("PASS mobile activation: accessible early CTA, failed-order recovery, out-of-scope funnel tracking suspended");
