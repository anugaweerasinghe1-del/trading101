import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LEADERBOARD_FUNNEL_CONSENT_KEY, LEADERBOARD_FUNNEL_MARKER_KEY, LEADERBOARD_FUNNEL_WINDOW_MS,
  LEADERBOARD_VISIT_EVENT, LEADERBOARD_REGISTRATION_EVENT,
  isNewAccountFromLeaderboard, withinConsentedFunnelWindow,
  recordConsentedLeaderboardVisit, recordConsentedLeaderboardRegistration,
} from "../src/lib/leaderboardFunnelTelemetry.ts";

const instant = Date.parse("2026-11-04T10:00:00.000Z");
assert.equal(withinConsentedFunnelWindow(instant, instant), true);
assert.equal(withinConsentedFunnelWindow(instant, instant + LEADERBOARD_FUNNEL_WINDOW_MS), true);
assert.equal(withinConsentedFunnelWindow(instant, instant + LEADERBOARD_FUNNEL_WINDOW_MS + 1), false);
assert.equal(withinConsentedFunnelWindow(instant + 1, instant), false);
assert.equal(isNewAccountFromLeaderboard(instant, "2026-11-04T09:59:59.000Z", instant + 1000), false);
assert.equal(isNewAccountFromLeaderboard(instant, "2026-11-04T10:00:01.000Z", instant + 3000), true);
assert.equal(isNewAccountFromLeaderboard(instant, "bad-date", instant + 3000), false);
assert.equal(isNewAccountFromLeaderboard(instant, "2026-11-11T10:00:02.000Z", instant + LEADERBOARD_FUNNEL_WINDOW_MS + 2), false);

const store = new Map<string, string>();
const calls: {event:string; fields?:unknown}[] = [];
const fakeWindow = {
  localStorage: {
    getItem: (key:string)=>store.get(key)??null,
    setItem: (key:string,value:string)=>{store.set(key,value);},
    removeItem: (key:string)=>{store.delete(key);},
  },
  __tradehqAmplitudeStarted: true,
  amplitude: {
    track: (event:string, fields?:unknown)=>{calls.push({event,fields});},
  },
};
Object.defineProperty(globalThis, "window", {configurable:true, value:fakeWindow});
try {
  assert.equal(recordConsentedLeaderboardVisit(instant), false, "No consent means no event and no marker");
  assert.equal(store.has(LEADERBOARD_FUNNEL_MARKER_KEY), false);
  store.set("tradehq_consent_v1","accepted");
  store.set("tradehq_consent_v2","accepted");
  assert.equal(recordConsentedLeaderboardVisit(instant), false, "Prior Arena/replay consents are never enough");
  assert.equal(calls.length,0);
  store.set(LEADERBOARD_FUNNEL_CONSENT_KEY,"accepted");
  fakeWindow.__tradehqAmplitudeStarted=false;
  assert.equal(recordConsentedLeaderboardVisit(instant),false,"SDK-not-ready must not store unpairable visit");
  assert.equal(store.has(LEADERBOARD_FUNNEL_MARKER_KEY), false);
  fakeWindow.__tradehqAmplitudeStarted=true;

  assert.equal(recordConsentedLeaderboardVisit(instant),true);
  assert.equal(recordConsentedLeaderboardVisit(instant+120000),false,"Return/reload does not duplicate eligible visitor");
  assert.deepEqual(calls,[{event:LEADERBOARD_VISIT_EVENT,fields:undefined}]);
  assert.deepEqual(JSON.parse(store.get(LEADERBOARD_FUNNEL_MARKER_KEY)!),{visitedAt:instant},
    "Attribution marker may store only one numeric timestamp");
  assert.equal(recordConsentedLeaderboardRegistration("2026-10-01T00:00:00.000Z", instant+1000), false,
    "Existing login, even just after the visit, is not a new registration");
  assert.equal(store.has(LEADERBOARD_FUNNEL_MARKER_KEY),false,"Existing login clears attribution to prevent later false positives");

  assert.equal(recordConsentedLeaderboardVisit(instant+10000),true);
  assert.equal(recordConsentedLeaderboardRegistration("2026-11-04T10:00:11.000Z", instant+15000),true);
  assert.equal(recordConsentedLeaderboardRegistration("2026-11-04T10:00:11.000Z", instant+16000),false,"Auth refresh cannot double count");
  assert.deepEqual(calls.map(x=>x.event),[
    LEADERBOARD_VISIT_EVENT,LEADERBOARD_VISIT_EVENT,LEADERBOARD_REGISTRATION_EVENT
  ]);
  assert.equal(calls.every(x=>x.fields===undefined),true,"No email, userID or profile properties may enter custom events");

  store.set(LEADERBOARD_FUNNEL_CONSENT_KEY,"rejected");
  assert.equal(recordConsentedLeaderboardVisit(instant+20000),false);
  assert.equal(recordConsentedLeaderboardRegistration("2026-11-04T10:00:22Z", instant+23000),false);
  assert.equal(calls.length,3);

  store.set(LEADERBOARD_FUNNEL_CONSENT_KEY,"accepted");
  assert.equal(recordConsentedLeaderboardVisit(instant+30000),true);
  store.set(LEADERBOARD_FUNNEL_CONSENT_KEY,"rejected");
  assert.equal(recordConsentedLeaderboardRegistration("2026-11-04T10:00:32Z", instant+33000),false,"Withdrawn consent forbids conversion");
  assert.equal(calls.filter(x=>x.event===LEADERBOARD_REGISTRATION_EVENT).length,1);
  store.delete(LEADERBOARD_FUNNEL_MARKER_KEY);
  store.set(LEADERBOARD_FUNNEL_CONSENT_KEY,"accepted");
  assert.equal(recordConsentedLeaderboardVisit(instant+LEADERBOARD_FUNNEL_WINDOW_MS+40000),true,
    "New legitimate consented cohort may start after earlier expiry");

  fakeWindow.amplitude.track=()=>{throw Error("SDK unavailable");};
  store.delete(LEADERBOARD_FUNNEL_MARKER_KEY);
  assert.equal(recordConsentedLeaderboardVisit(instant+LEADERBOARD_FUNNEL_WINDOW_MS+41000),false,
    "SDK error does not leave a denominator that can be spuriously converted");
  assert.equal(store.has(LEADERBOARD_FUNNEL_MARKER_KEY),false);
} finally {Reflect.deleteProperty(globalThis,"window");}

const leaderboard = readFileSync("src/pages/Leaderboard.tsx","utf8");
const authProvider = readFileSync("src/hooks/useAuth.tsx","utf8");
const authPage = readFileSync("src/pages/Auth.tsx","utf8");
const consent = readFileSync("src/components/ConsentBanner.tsx","utf8");
const arena = readFileSync("src/lib/arenaTelemetry.ts","utf8");
const privacy = readFileSync("src/lib/privacyCopy.ts","utf8");
assert.match(leaderboard,/recordConsentedLeaderboardVisit/);
assert.match(leaderboard,/authLoading/,"Wait for account session initialization before labeling a visit signed out");
assert.match(leaderboard,/tradehq:analytics-ready/);
assert.match(authProvider,/recordConsentedLeaderboardRegistration\(user\.created_at\)/,
  "New account confirmation is measured from the persistent auth provider, including OAuth redirects");
assert.match(authPage,/mode=signup/,"The leaderboard should offer a direct signup path");
assert.match(consent,/tradehq_consent_v3/,"Fresh consent required for the broader measured purpose");
assert.match(arena,/ARENA_ANALYTICS_CONSENT_KEY = "tradehq_consent_v3"/,
  "Practice Arena must follow the same freshly scoped adult consent");
assert.match(consent,/localStorage\.removeItem\(LEADERBOARD_FUNNEL_MARKER_KEY\)/,
  "Withdrawing consent clears pending leaderboard attribution");
assert.match(consent,/autocapture: false/);
assert.match(consent,/fetchRemoteConfig: false/);
assert.match(privacy,/leaderboard.*new-account|leaderboard.*registration/i,"Policy must name new optional tracking");
const telemetry = readFileSync("src/lib/leaderboardFunnelTelemetry.ts","utf8");
assert.doesNotMatch(telemetry,/\.setUserId\(|\.identify\(|deviceFingerprint|user_metadata/);
assert.doesNotMatch(telemetry,/\.track\([^)]*,\s*\{/,"No custom user attributes may be sent");
console.log("PASS consented leaderboard funnel: renewed adult opt-in, no old consent, no PII properties, verified new account only, same-browser TTL, dedupe, rejection, and auth wiring");
