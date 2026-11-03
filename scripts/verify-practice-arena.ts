import assert from "node:assert/strict";
import { arenaAnalyticsAllowed, utcDayGap, recordConsentedArenaVisit, trackArenaMilestone, ARENA_READY_EVENT, ARENA_VISIT_KEY } from "../src/lib/arenaTelemetry.ts";
import { readFileSync } from "node:fs";
import {
  ARENA_SCENARIOS, ARENA_SIZES, ARENA_FEE_RATE, ARENA_START_CASH,
  arenaOutcome, beginArena, completeArena, continueArena, currentMark, markedEquity,
  parseArena, recordArenaDecision, roundMoney, scenarioById,
  type ArenaSession,
} from "../src/lib/practiceArena.ts";

assert.equal(ARENA_SCENARIOS.length, 3, "Three distinct, authored learning paths are available.");
assert.deepEqual(ARENA_SIZES, [1, 5, 10]);
assert.equal(new Set(ARENA_SCENARIOS.map(s => s.id)).size, 3, "Scenario IDs must be unique.");
for (const scenario of ARENA_SCENARIOS) {
  assert.ok(scenario.scenes.length >= 6, scenario.id + ": no five-round learning path");
  assert.ok(scenario.intro.length > 70 && scenario.completion.length > 80, scenario.id + ": need meaningful educational copy");
  assert.ok(scenario.scenes.every(s => s.price > 0 && Number.isFinite(s.price) && s.context.length > 65 && s.insight.length > 65), scenario.id + ": authored pricing and explanation");
  assert.ok(["/daily","/start","/learn/article/risk-management-in-trading"].includes(scenario.nextHref));
  let session = beginArena(scenario.id);
  assert.equal(currentMark(session), scenario.scenes[0].price);
  assert.equal(markedEquity(session), ARENA_START_CASH);
  assert.throws(() => recordArenaDecision(session, "sell", 1), /cannot sell/);
  const first = recordArenaDecision(session, "buy", 1, "Test only; private journal.");
  assert.equal(first.pendingReview, true);
  assert.equal(first.holdings, 1);
  const expectedFee = roundMoney(scenario.scenes[0].price * ARENA_FEE_RATE);
  assert.equal(first.fees, expectedFee, "A virtual buy must charge exactly 0.1% with cent rounding.");
  assert.equal(first.cash, roundMoney(ARENA_START_CASH - scenario.scenes[0].price - expectedFee));
  assert.equal(first.decisions[0].markedEquity, roundMoney(first.cash + scenario.scenes[1].price));
  assert.throws(() => recordArenaDecision(first, "hold", 1), /not available/, "A new choice requires reviewing the revealed round.");
  session = continueArena(first, "2026-11-03T10:00:00.000Z");
  assert.equal(session.finishedAt, null);
  const sale = recordArenaDecision(session, "sell", 1);
  assert.equal(sale.holdings, 0);
  assert.equal(sale.cash, roundMoney(first.cash + scenario.scenes[1].price - roundMoney(scenario.scenes[1].price * ARENA_FEE_RATE)));
  assert.equal(sale.fees, roundMoney(first.fees + sale.decisions[1].fee));
  session = continueArena(sale);
  for (let i = 2; i < scenario.scenes.length - 1; i++) {
    const beforeCash = session.cash;
    const beforeShares = session.holdings;
    const beforeFee = session.fees;
    const next = recordArenaDecision(session, "hold", 1, "Waiting is also a decision.");
    assert.equal(next.cash, beforeCash, "Observing must never spend virtual cash.");
    assert.equal(next.holdings, beforeShares);
    assert.equal(next.fees, beforeFee, "Observing has zero fee.");
    session = continueArena(next, "2026-11-03T10:00:00.000Z");
  }
  assert.equal(session.finishedAt, "2026-11-03T10:00:00.000Z");
  assert.equal(session.decisions.length, scenario.scenes.length - 1);
  assert.equal(markedEquity(session), roundMoney(session.cash + session.holdings * scenario.scenes.at(-1)!.price));
  const stored = completeArena({ version: 1, active: session, completions: {} }, session);
  assert.equal(stored.completions[scenario.id].count, 1);
  const duplicate = completeArena(stored, session);
  assert.equal(duplicate.completions[scenario.id].count, 1, "Final review must not increment completion twice.");
  const recovered = parseArena(JSON.stringify(stored));
  assert.equal(recovered.active?.scenarioId, scenario.id);
  assert.equal(recovered.active?.decisions.length, scenario.scenes.length - 1);
  assert.equal(recovered.completions[scenario.id].count, 1);
}
for (const raw of [null, "", "[]", "null", "true", "99", "{bad", JSON.stringify({ version: 12, active: beginArena("first-order") }), "a".repeat(130_000)]) {
  assert.deepEqual(Object.keys(parseArena(raw).completions), [], "Bad local storage must recover without a crash.");
}
assert.equal(scenarioById("not-a-real-scenario"), undefined);
let s: ArenaSession = beginArena("first-order");
s = recordArenaDecision(s, "buy", 5);
assert.equal(s.holdings, 5);
assert.equal(s.decisions[0].units, 5);

// Exact browser-observed beginner trade: $100 buy, observe, $99 sale, then two observes.
// The $1.20 exercise loss consists of $1.00 price movement and $0.20 in fees.
let feeExample = beginArena("first-order");
feeExample = continueArena(recordArenaDecision(feeExample, "buy", 1, "Testing an initial order."));
feeExample = continueArena(recordArenaDecision(feeExample, "hold", 1));
feeExample = continueArena(recordArenaDecision(feeExample, "sell", 1));
feeExample = continueArena(recordArenaDecision(feeExample, "hold", 1));
feeExample = continueArena(recordArenaDecision(feeExample, "hold", 1), "2026-11-03T10:00:00.000Z");
const result = arenaOutcome(feeExample);
assert.deepEqual(result, { equity: 9998.8, totalChange: -1.2, fees: 0.2, priceEffect: -1 },
  "The completed debrief must separate price effect from fees, not call a sale a $1.20 price loss.");
const withReflection = parseArena(JSON.stringify({
  version: 1, active: { ...feeExample, finalReflection: "Next time I will compare sizes." }, completions: {},
}));
assert.equal(withReflection.active?.finalReflection, "Next time I will compare sizes.",
  "Closing notes should survive a browser reload.");
const invalidReflection = parseArena(JSON.stringify({
  version: 1, active: { ...feeExample, finalReflection: "x".repeat(401) }, completions: {},
}));
assert.equal(invalidReflection.active, null, "Unreasonably long local notes must not be trusted.");
// No milestone or research state is created when analytics are rejected.
assert.equal(arenaAnalyticsAllowed(null), false);
assert.equal(arenaAnalyticsAllowed("rejected"), false);
assert.equal(arenaAnalyticsAllowed("accepted"), true);
assert.equal(utcDayGap("2026-11-03", "2026-11-03"), 0);
assert.equal(utcDayGap("2026-11-03", "2026-11-04"), 1);
assert.equal(utcDayGap("2026-11-03", "2026-11-10"), 7);
assert.equal(utcDayGap("not-a-date", "2026-11-04"), null);
assert.equal(utcDayGap("2026-11-05", "2026-11-04"), null);
const fakeStorage = new Map<string, string>();
const sent: {event:string; props:Record<string,string|number>}[] = [];
const fakeListeners: (() => void)[] = [];
const fakeWindow = {
  localStorage: {
    getItem: (key: string) => fakeStorage.get(key) ?? null,
    setItem: (key: string, val: string) => { fakeStorage.set(key, val); },
    removeItem: (key: string) => { fakeStorage.delete(key); },
  },
  __tradehqAmplitudeStarted: true,
  amplitude: {
    track: (event: string, props: Record<string,string|number> = {}) => { sent.push({event,props}); },
  },
  addEventListener: (type: string, callback: () => void) => {
    if (type === ARENA_READY_EVENT) fakeListeners.push(callback);
  },
};
Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
assert.equal(recordConsentedArenaVisit(new Date("2026-11-03T09:00:00.000Z")), false);
assert.equal(fakeStorage.get(ARENA_VISIT_KEY), undefined);
assert.equal(sent.length, 0);
fakeStorage.set("tradehq_consent_v1", "accepted");
assert.equal(recordConsentedArenaVisit(new Date("2026-11-03T09:00:00.000Z")), true);
assert.equal(fakeStorage.get(ARENA_VISIT_KEY), "2026-11-03");
assert.deepEqual(sent.at(-1), {event:"TradeHQ Arena Viewed",props:{}});
assert.equal(recordConsentedArenaVisit(new Date("2026-11-03T20:00:00.000Z")), true);
assert.equal(sent.some(e => e.event === "TradeHQ Arena Returned"), false, "Same day should not count as return.");
assert.equal(recordConsentedArenaVisit(new Date("2026-11-04T09:00:00.000Z")), true);
assert.deepEqual(sent.at(-1), {
  event:"TradeHQ Arena Returned",props:{days_since_last_arena_visit:1},
});
trackArenaMilestone("Arena Started", "first-order");
assert.deepEqual(sent.at(-1), {
  event:"TradeHQ Arena Started", props:{scenario_id:"first-order",difficulty:"Beginner"},
});
assert.deepEqual(Object.keys(sent.at(-1)!.props).sort(), ["difficulty","scenario_id"]);
const beforeRevoke = sent.length;
fakeStorage.set("tradehq_consent_v1", "rejected");
trackArenaMilestone("Arena Completed", "first-order");
assert.equal(sent.length, beforeRevoke, "Rejected consent cannot generate a milestone.");
fakeStorage.set("tradehq_consent_v1", "accepted");
fakeWindow.__tradehqAmplitudeStarted = false;
trackArenaMilestone("Arena Completed", "first-order");
assert.equal(sent.length, beforeRevoke, "SDK-not-ready events cannot send immediately.");
fakeStorage.set("tradehq_consent_v1", "rejected");
fakeWindow.__tradehqAmplitudeStarted = true;
for (const callback of fakeListeners) callback();
assert.equal(sent.length, beforeRevoke, "Consent revoked while loading must prevent queued events.");
Reflect.deleteProperty(globalThis, "window");

const page = readFileSync("src/pages/PracticeArena.tsx", "utf8");
const study = readFileSync("src/components/arena/ArenaStudy.tsx", "utf8");
const telemetry = readFileSync("src/lib/arenaTelemetry.ts", "utf8");
const consent = readFileSync("src/components/ConsentBanner.tsx", "utf8");
const privacy = readFileSync("src/lib/privacyCopy.ts", "utf8");
const protocol = readFileSync("docs/practice-arena-usability-pilot-2026-11-03.md", "utf8");
const review = readFileSync("src/components/arena/ArenaSessionReview.tsx", "utf8");
const contact = readFileSync("src/pages/Contact.tsx", "utf8");
const engine = readFileSync("src/lib/practiceArena.ts", "utf8");
const styles = readFileSync("src/pages/PracticeArena.css", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const nav = readFileSync("src/components/Navigation.tsx", "utf8");
const daily = readFileSync("src/pages/Daily.tsx", "utf8");
const journey = readFileSync("src/pages/BeginnerJourney.tsx", "utf8");
const hero = readFileSync("src/components/PremiumHero.tsx", "utf8");
const routes = readFileSync("scripts/routes.ts", "utf8");
assert.match(app, /path="\/practice" element=\{<PracticeArena \/>\}/, "Practice route must load.");
assert.match(routes, /path: "\/practice"/, "Arena must be in the prerender route manifest.");
assert.match(nav, /to: "\/newsletter", label: "Newsletter"/, "Weekly label must be Newsletter.");
assert.match(nav, /to: "\/practice", label: "Practice Arena"/, "Discover Arena in navigation.");
assert.match(daily, /to="\/practice"/);
assert.match(journey, /to="\/practice"/);
assert.match(hero, /to="\/practice"/);
for (const source of [engine, page]) {
  assert.doesNotMatch(source, /(?:from\(["'](?:practice_portfolios|practice_trades)|startRankedPractice\(|placeTrade\(|savePortfolio\()/,
    "Arena must not write to a user's actual simulated trading balance or ranked history.");
}
assert.match(page, /prefers-reduced-motion|useReducedMotion/, "Animations respect user motion preferences.");
assert.match(styles, /prefers-reduced-motion: reduce/, "CSS transitions respect reduced motion.");
assert.match(page, /role="group" aria-label="Select an exercise action"/);
assert.match(page, /disabled=\{\(action === "sell"/);
assert.match(page, /No historical or live market data/);
assert.match(page, /recordConsentedArenaVisit\(\)/, "Arena view events must be consented.");
assert.match(page, /trackArenaMilestone\("Arena Started", id\)/);
assert.match(page, /trackArenaMilestone\("Arena Completed", next.scenarioId\)/);
assert.match(page, /ArenaStudy completedScenario=/, "The voluntary study must be discoverable.");
assert.match(page, /amp-block mt-5/, "Private exercise notes must be masked in consented replay.");
assert.match(page, /className="amp-block"/, "Private session reviews must be masked.");
assert.match(study, /className="amp-block/, "Study answers must be masked from replay.");
assert.match(study, /function prepareEmail\(\)/, "Email body should be composed only on click.");
assert.doesNotMatch(study, /href=\{.*report|emailHref/, "Participant answers must not be stored in DOM href attributes.");
assert.doesNotMatch(study, /(?:fetch\(|sendBeacon\(|supabase|\.insert\()/,
  "No automatic survey submission or database write is permitted.");
assert.match(study, /Date.parse\(completedAt\) >= pageOpenedAt/, "A previous completed session is not a valid current study.");
assert.match(telemetry, /ARENA_ANALYTICS_CONSENT_KEY/, "Telemetry must consult existing opt-in choice.");
assert.doesNotMatch(telemetry, /(?:user_id|email|note|cash|amount|portfolio_id|trade_action)/,
  "Custom event payloads must not include private values or user identity.");
assert.match(consent, /tradehq:analytics-ready/, "The SDK must signal when consented tracking is ready.");
assert.match(consent, /localStorage.removeItem\("tradehq:arena-analytics-last-seen:v1"\)/,
  "Withdrawal must clear the optional Arena return-day marker.");
assert.match(privacy, /Practice Arena research:/, "Privacy page must explain this new data flow.");
assert.match(protocol, /no real participant results have been collected/i,
  "A study implementation must not claim participant evidence already exists.");
assert.match(page, /ArenaSessionReview session=\{active\}/, "Completed lessons must contain an expanded review.");
assert.match(page, /order-1 lg:order-2/, "The exercise panel must be first on mobile.");
assert.match(page, /scrollIntoView/, "Advancing a round should keep the next action in view.");
assert.match(styles, /scroll-margin-top/, "Action panel scrolling must leave room for the fixed navbar.");
assert.match(review, /arenaOutcome\(session\)/, "Fee and price effects must be based on the recorded ledger.");
assert.match(review, /Review all five decisions and my reasons/, "Learners should see their own earlier reasoning.");
assert.match(review, /Saved in this browser only/, "Private closing note storage must be explicit.");
assert.match(review, /Your choice has <strong>not<\/strong> been sent/, "Feedback must never pretend to have been submitted.");
assert.match(review, /\/contact\?source=practice-arena&rating=/, "Feedback requires voluntary navigation.");
assert.match(contact, /source.*practice-arena/, "Contact page must offer a prefilled feedback draft.");
assert.match(contact, /mailto:/, "Feedback must remain a user-initiated email draft, not an automatic send.");
assert.match(page, /Review last session/, "Completed review must remain accessible after reloading the catalog.");
assert.match(page, /Resume unfinished session/, "Browsing the scenario catalog must offer a non-destructive resume control.");
assert.match(page, /setShowCatalog\(true\)/, "Browsing scenarios must not clear the active session.");
assert.match(page, /Not added to your real TradeHQ portfolio or public profile/);
assert.doesNotMatch(page, /localStorage\.clear\(/, "Never erase the user's other browser data.");
console.log("PASS Practice Arena: fictional data integrity, fees, no short sells, completed-state persistence, idempotence, privacy, route discovery, Newsletter rename, accessible UI, reduced motion.");
