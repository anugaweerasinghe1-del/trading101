// Offline recommendation experiment. This module grants no operational authority.
export const MEMORY_LIMITS = Object.freeze({ records: 100, bytes: 65_536, retentionDays: 30, cooldownHours: 24 });
const DAY = 86_400_000;
const routes = new Set(['/', '/about', '/learn', '/markets', '/trade', '/portfolio', '/courses', '/daily', '/leaderboard', '/reviews', '/auth', '/admin', '/admin/ai']);
const advice = Object.freeze({
  VERCEL_STATUS_MISSING: ['INSPECT_PROVIDER_COMMIT_BINDING', 'INSPECT_GITHUB_INTEGRATION'],
  CI_RETAINED_JOB_TIME: ['COMPARE_EFFECTIVE_RUN_JOBS', 'INSPECT_CHECK_TIMESTAMP_BINDING'],
  HTTP_429: ['INSPECT_EXISTING_REQUEST_LIMITS', 'COMPARE_PROVIDER_RESPONSE_EVIDENCE'],
  REQUEST_OR_RENDER_FAILED: ['COMPARE_HTTP_AND_BROWSER_EVIDENCE', 'INSPECT_PUBLIC_DELIVERY_EVIDENCE'],
  BLANK_ROOT: ['INSPECT_BROWSER_RENDER_EVIDENCE', 'INSPECT_PUBLIC_ASSET_EVIDENCE'],
  BUNDLE_UNAVAILABLE: ['INSPECT_PUBLIC_ASSET_EVIDENCE', 'COMPARE_PROVIDER_COMMIT_BINDING'],
});
const categories = new Set([...Object.keys(advice), 'UNKNOWN']);
const actions = new Set(Object.values(advice).flat());
const outcomes = new Set(['reported_failed', 'reported_rejected', 'reported_success']);
const error = () => { throw new Error('Invalid incident-memory input'); };
function exactKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) error();
  if (Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) error();
  // Accessors are not JSON data; never execute an imported getter.
  if (Object.values(Object.getOwnPropertyDescriptors(value)).some(d => !Object.hasOwn(d, 'value'))) error();
}
function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) error();
  const n = Date.parse(value);
  if (!Number.isFinite(n) || new Date(n).toISOString() !== value) error();
  return n;
}
function incident(value) {
  exactKeys(value, ['runId', 'sha', 'category', 'route']);
  if (typeof value.runId !== 'string' || !/^[1-9]\d{0,19}$/.test(value.runId)) error();
  if (typeof value.sha !== 'string' || !/^[a-f0-9]{40}$/.test(value.sha)) error();
  if (!categories.has(value.category) || !routes.has(value.route)) error();
  return { runId: value.runId, sha: value.sha, category: value.category, route: value.route };
}
function record(value, now) {
  exactKeys(value, ['runId', 'sha', 'category', 'route', 'action', 'outcome', 'observedAt']);
  const safe = incident(Object.fromEntries(['runId', 'sha', 'category', 'route'].map(k => [k, value[k]])));
  if (!actions.has(value.action) || !advice[safe.category]?.includes(value.action) || !outcomes.has(value.outcome)) error();
  if (time(value.observedAt) > now) error();
  return Object.freeze({ ...safe, action: value.action, outcome: value.outcome, observedAt: value.observedAt });
}
// A JSON export cannot assert verification, root cause, approval, or permissions.
export function parseIncidentMemory(json) {
  if (typeof json !== 'string' || Buffer.byteLength(json, 'utf8') > MEMORY_LIMITS.bytes) error();
  try {
    const parsed = JSON.parse(json);
    exactKeys(parsed, ['version', 'records']);
    if (parsed.version !== 1 || !Array.isArray(parsed.records) || parsed.records.length > MEMORY_LIMITS.records) error();
    // Validate the record schema at import too; the recommender additionally
    // checks future timestamps against its explicit evaluation clock.
    return { version: 1, records: parsed.records.map(r => record(r, Number.MAX_SAFE_INTEGER)) };
  } catch { error(); }
}
export function recommendIncidentInvestigation({ incident: current, memory, now }) {
  const observed = time(now);
  const target = incident(current);
  exactKeys(memory, ['version', 'records']);
  if (memory.version !== 1 || !Array.isArray(memory.records) || memory.records.length > MEMORY_LIMITS.records) error();
  if (Object.getPrototypeOf(memory.records) !== Array.prototype || Object.keys(memory.records).length !== memory.records.length) error();
  if (Object.values(Object.getOwnPropertyDescriptors(memory.records)).some(d => !Object.hasOwn(d, 'value'))) error();
  // Validate before serializing to avoid getters/toJSON being executed.
  const records = memory.records.map(r => record(r, observed));
  if (Buffer.byteLength(JSON.stringify(records), 'utf8') > MEMORY_LIMITS.bytes) error();
  const unique = new Map();
  for (const r of records) {
    const key = `${r.runId}:${r.action}`;
    if (unique.has(key) && JSON.stringify(unique.get(key)) !== JSON.stringify(r)) error();
    unique.set(key, r);
  }
  const retained = [...unique.values()].filter(r => observed - time(r.observedAt) <= MEMORY_LIMITS.retentionDays * DAY);
  const relevant = retained.filter(r => r.category === target.category && r.route === target.route);
  const suppressed = [];
  const recommendations = [];
  for (const action of advice[target.category] ?? []) {
    const prior = relevant.filter(r => r.action === action);
    const failed = prior.some(r => r.outcome !== 'reported_success');
    const cooling = prior.some(r => observed - time(r.observedAt) < MEMORY_LIMITS.cooldownHours * DAY / 24);
    if (failed || cooling) suppressed.push(Object.freeze({ action, reason: failed ? 'REPORTED_UNSUCCESSFUL' : 'COOLDOWN' }));
    else recommendations.push(Object.freeze({ action, claim: 'INVESTIGATION_SUGGESTION', rootCauseVerified: false }));
  }
  return Object.freeze({
    schemaVersion: 1,
    mode: 'OFFLINE_EXPERIMENT',
    incident: Object.freeze(target),
    historyTrust: 'UNVERIFIED_IMPORT',
    historyRecords: retained.length,
    status: recommendations.length ? 'NEEDS_INDEPENDENT_INVESTIGATION' : target.category === 'UNKNOWN' ? 'ABSTAIN_UNKNOWN' : 'ABSTAIN_HISTORY_SUPPRESSED',
    risk: 'HIGH_UNTIL_INDEPENDENTLY_SCOPED',
    rootCauseVerified: false,
    recommendations: Object.freeze(recommendations),
    suppressed: Object.freeze(suppressed),
    authorization: Object.freeze({ modelCallAllowed: false, codeProposalAllowed: false, productionWriteAllowed: false, mergeAllowed: false, releaseAllowed: false }),
  });
}
