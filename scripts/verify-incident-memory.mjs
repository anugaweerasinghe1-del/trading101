import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MEMORY_LIMITS, parseIncidentMemory, recommendIncidentInvestigation } from './agent-incident-memory.mjs';

const now = '2026-10-12T18:00:00.000Z';
const sha = 'a'.repeat(40);
const incident = { runId: '100', sha, category: 'VERCEL_STATUS_MISSING', route: '/' };
const empty = { version: 1, records: [] };
const event = (overrides = {}) => ({ ...incident, action: 'INSPECT_PROVIDER_COMMIT_BINDING', outcome: 'reported_failed', observedAt: '2026-10-11T18:00:00.000Z', ...overrides });
const check = (records, target = incident) => recommendIncidentInvestigation({ incident: target, memory: { version: 1, records }, now });
const denied = result => {
  assert.equal(result.rootCauseVerified, false);
  assert.equal(result.historyTrust, 'UNVERIFIED_IMPORT');
  assert.ok(Object.values(result.authorization).every(v => v === false));
  assert.ok(result.recommendations.every(r => r.rootCauseVerified === false));
};
const baseline = check([]);
assert.equal(baseline.recommendations[0].action, 'INSPECT_PROVIDER_COMMIT_BINDING');
const adapted = check([event()]);
assert.equal(adapted.recommendations[0].action, 'INSPECT_GITHUB_INTEGRATION');
assert.equal(adapted.suppressed[0].reason, 'REPORTED_UNSUCCESSFUL');
denied(adapted);
assert.equal(check([event({ outcome: 'reported_rejected' })]).recommendations[0].action, 'INSPECT_GITHUB_INTEGRATION');
const allFailed = check([event(), event({ action: 'INSPECT_GITHUB_INTEGRATION' })]);
assert.equal(allFailed.status, 'ABSTAIN_HISTORY_SUPPRESSED');
assert.equal(allFailed.recommendations.length, 0);
denied(allFailed);
assert.deepEqual(check([event(), event()]), adapted, 'Duplicate evidence cannot amplify feedback');
assert.throws(() => check([event(), event({ outcome: 'reported_success' })]), /Invalid/);
assert.throws(() => check([event(), event({ sha: 'b'.repeat(40) })]), /Invalid/);
const recentSuccess = check([event({ outcome: 'reported_success', observedAt: '2026-10-12T17:59:00.000Z' })]);
assert.equal(recentSuccess.suppressed[0].reason, 'COOLDOWN');
denied(recentSuccess);
assert.deepEqual(check([event({ outcome: 'reported_success' })]).recommendations, baseline.recommendations, 'Reported success is not independently verified success and earns no promotion');
assert.deepEqual(check([event({ observedAt: '2026-09-11T18:00:00.000Z' })]).recommendations, baseline.recommendations);
assert.deepEqual(check([event({ route: '/markets' })]).recommendations, baseline.recommendations);
assert.equal(check([], { ...incident, category: 'UNKNOWN' }).status, 'ABSTAIN_UNKNOWN');
for (const route of ['/auth', '/trade', '/portfolio', '/courses', '/daily', '/leaderboard', '/reviews', '/admin', '/admin/ai']) denied(check([], { ...incident, route }));
for (const field of ['verified', 'rootCauseVerified', 'releaseAllowed', 'modelPrompt', 'notes', 'token']) {
  assert.throws(() => check([event({ [field]: 'private-sentinel' })]), /Invalid incident-memory input/);
}
for (const patch of [{ route: '/auth?email=private-sentinel' }, { route: 'https://evil.test/' }, { sha: 'private-sentinel' }, { runId: '../secret' }, { category: 'SECRET' }, { action: 'MERGE' }, { outcome: 'verified_success' }, { observedAt: '2026-10-12T18:00:01.000Z' }, { observedAt: '2026-02-30T00:00:00.000Z' }]) assert.throws(() => check([event(patch)]), /Invalid/);
assert.throws(() => check(Array.from({ length: MEMORY_LIMITS.records + 1 }, () => event())), /Invalid/);
assert.throws(() => parseIncidentMemory(' '.repeat(MEMORY_LIMITS.bytes + 1)), /Invalid/);
assert.throws(() => parseIncidentMemory('{"private-sentinel":'), /Invalid/);
assert.throws(() => parseIncidentMemory('{"version":1,"records":[],"verified":true}'), /Invalid/);
assert.throws(() => parseIncidentMemory(JSON.stringify({ version: 1, records: [event({ verified: true })] })), /Invalid/);
assert.throws(() => parseIncidentMemory(JSON.stringify({ version: 1, records: [event({ route: '/auth?email=private-sentinel' })] })), /Invalid/);
assert.throws(() => check([Object.assign(Object.create({ verified: true }), event())]), /Invalid/);
const getter = event();
Object.defineProperty(getter, 'outcome', { enumerable: true, get() { throw new Error('private-sentinel'); } });
assert.throws(() => check([getter]), /^Error: Invalid incident-memory input$/);
const arrayGetter = [event()];
Object.defineProperty(arrayGetter, '0', { enumerable: true, get() { throw new Error('private-sentinel'); } });
assert.throws(() => check(arrayGetter), /^Error: Invalid incident-memory input$/);
assert.throws(() => check(new Array(1)), /Invalid/);
assert.deepEqual(parseIncidentMemory(JSON.stringify(empty)), empty);
assert.ok(Object.isFrozen(adapted) && Object.isFrozen(adapted.authorization) && Object.isFrozen(adapted.recommendations));
assert.throws(() => { adapted.authorization.releaseAllowed = true; }, TypeError);
const source = readFileSync(new URL('./agent-incident-memory.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(source, /\b(?:fetch|spawn|exec|writeFile|process\.env|setInterval|setTimeout)\b/, 'Offline experiment cannot use providers, secrets, writes, processes or schedules');

// Synthetic regression replays: outcomes are scenario labels, never production evidence.
let baselineRepeated = 0, memoryRepeated = 0, falseVerified = 0;
const categories = ['VERCEL_STATUS_MISSING', 'CI_RETAINED_JOB_TIME', 'HTTP_429', 'REQUEST_OR_RENDER_FAILED', 'BLANK_ROOT', 'BUNDLE_UNAVAILABLE'];
for (const [index, category] of categories.entries()) {
  const target = { ...incident, runId: String(200 + index), category };
  const first = check([], target);
  const failedAction = first.recommendations[0].action;
  const history = [{ ...event(), ...target, action: failedAction }];
  const repeat = check(history, target);
  baselineRepeated += Number(check([], target).recommendations[0].action === failedAction);
  memoryRepeated += Number(repeat.recommendations.some(r => r.action === failedAction));
  falseVerified += Number(repeat.rootCauseVerified || repeat.historyTrust !== 'UNVERIFIED_IMPORT');
  assert.equal(repeat.recommendations.length, 1);
  denied(repeat);
}
assert.equal(baselineRepeated, 6);
assert.equal(memoryRepeated, 0);
assert.equal(falseVerified, 0);
console.log(JSON.stringify({ dataset: 'SYNTHETIC_OFFLINE_ONLY', replayScenarios: 6, repeatedFailedSuggestions: { stateless: baselineRepeated, memory: memoryRepeated }, falseVerifiedClaims: falseVerified, modelCalls: 0, productionWrites: 0, caveat: 'No production accuracy, root-cause identification or repair success established' }));
console.log('Incident memory bounds, imported-evidence distrust, cooldowns, replay conflicts, privacy schema and authority separation passed.');
