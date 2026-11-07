import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDailyProbeHandler } from '../supabase/functions/_shared/dailyPracticeProbe';
import { providerDiagnostics, validationDiagnostics, validProbeDiagnostics } from '../supabase/functions/_shared/dailyProbeDiagnostics';
import { starterPracticeBank } from '../src/lib/dailyPracticeBank';
const KEY = 'PRIVATE_KEY_FIXTURE_SENTINEL';
const req = (body: unknown = { confirmFreeTier: true }, key = KEY, token = 'owner-fixture') => new Request('https://example.test', {
  method: 'POST', headers: { 'x-admin-key': key, Authorization: 'Bearer ' + token }, body: JSON.stringify(body),
});
const reports: unknown[] = [];
let reads = 0, admissions = 0, provider = 0, sourceReads = 0;
const exercises = structuredClone(starterPracticeBank.exercises.slice(0, 10));
const upstream: typeof fetch = async (input, init) => {
  const url = String(input);
  assert.ok(!url.includes(KEY));
  if (url.startsWith('https://generativelanguage.googleapis.com/')) {
    provider++;
    assert.equal(init?.method, 'POST');
    const body = JSON.parse(String(init.body));
    assert.equal(body.generationConfig.maxOutputTokens, 32768);
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'LOW');
    const prompt = JSON.parse(body.contents[0].parts[0].text);
    assert.deepEqual(prompt.previous, [], 'Test uses no user data or live private drafts');
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ exercises }) }] } }],
      usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 10000, totalTokenCount: 11000 } });
  }
  sourceReads++;
  return new Response('<main>' + 'Trusted fixture source text. '.repeat(150) + '</main>', { headers: { 'Content-Type': 'text/html' } });
};
const options = {
  report: (value: unknown) => { reports.push(value); },
  getKey: () => KEY, authLimit: async () => true,
  owner: async (request: Request) => request.headers.get('authorization') === 'Bearer owner-fixture',
  config: async () => { reads++; return { freeConfirmed: true, apiKey: KEY, model: 'gemini-3.5-flash-lite' }; },
  admit: async () => ++admissions === 1, fetcher: upstream, now: () => Date.parse('2026-11-06T20:00:00Z'),
};
const handle = createDailyProbeHandler(options);
assert.equal((await handle(new Request('https://example.test'))).status, 405);
assert.equal((await handle(req({}, 'incorrect'))).status, 401);
assert.equal((await handle(req({}, KEY, 'another-user'))).status, 403);
for (const body of [{}, [], { confirmFreeTier: false }, { confirmFreeTier: true, model: 'paid-model' }, { confirmFreeTier: true, url: 'https://evil.invalid' }])
  assert.equal((await handle(req(body))).status, 400);
assert.equal(reads, 0); assert.equal(admissions, 0); assert.equal(provider, 0);
assert.equal((await createDailyProbeHandler({ ...options, authLimit: async () => false })(req())).status, 429);
for (const config of [null, { freeConfirmed: false, apiKey: KEY, model: 'gemini-3.5-flash-lite' }, { freeConfirmed: true, apiKey: '', model: 'gemini-3.5-flash-lite' }, { freeConfirmed: true, apiKey: KEY, model: 'gemini-3.6-flash' }])
  assert.equal((await createDailyProbeHandler({ ...options, config: async () => config })(req())).status, 409);
assert.equal(admissions, 0);
const results = await Promise.all(Array.from({ length: 12 }, () => handle(req())));
assert.equal(results.filter(r => r.status === 200).length, 1, 'Durable atomic admission permits one caller only');
assert.equal(provider, 1); assert.equal(sourceReads, 8);
const passed = await results.find(r => r.status === 200)!.json();
assert.equal(passed.data.outcome, 'passed'); assert.equal(passed.data.exercises, 10); assert.equal(passed.data.questions, 100);
assert.equal(passed.data.productionCycleChanged, false); assert.equal(passed.data.saved, false); assert.equal(passed.data.published, false);
assert.equal(passed.data.providerGenerationAttempted, true);
assert.ok(passed.data.usage.inputTokens === 1000);
assert.ok(!JSON.stringify(passed).includes(KEY));
assert.ok(!JSON.stringify(passed).includes(exercises[0].scenario), 'Generated content never leaves the private test handler');
assert.equal((await handle(req())).status, 429); assert.equal(provider, 1, 'No repeat after success');
for (const [kind, response] of [
  ['PROVIDER_REJECTED', () => Response.json({ error: { status: 'INVALID_ARGUMENT', message: 'PRIVATE_DETAIL_SENTINEL responseJsonSchema' } }, { status: 400 })],
  ['PROVIDER_RATE_LIMIT', () => new Response(null, { status: 429 })],
  ['OUTPUT_VALIDATION_FAILED', () => Response.json({ candidates: [{ content: { parts: [{ text: '{"exercises":[]}' }] } }] })],
  ['TEST_UNCONFIRMED', () => { throw Error('PRIVATE_DETAIL_SENTINEL'); }],
] as const) {
  let admitted = 0, attempts = 0;
  const failed = createDailyProbeHandler({ ...options, admit: async () => ++admitted === 1,
    fetcher: async (input, init) => String(input).includes('generativelanguage') ? (attempts++, response()) : upstream(input, init) });
  const value = await (await failed(req())).json();
  assert.equal(value.data.outcome, 'failed'); assert.equal(value.data.code, kind); assert.equal(attempts, 1);
  assert.equal(value.data.providerGenerationAttempted, true); assert.ok(!JSON.stringify(value).includes('PRIVATE_'));
  assert.equal((await failed(req())).status, 429); assert.equal(attempts, 1, 'Failure consumes admission; no retry');
}
let oversizedCalls = 0;
const oversized = createDailyProbeHandler({ ...options, admit: async () => true, fetcher: async input => {
  if (String(input).includes('generativelanguage')) { oversizedCalls++; throw Error('Must not reach provider'); }
  return new Response('<main>' + '信 '.repeat(4500) + '</main>', { headers: { 'Content-Type': 'text/html' } });
} });
const bounded = await (await oversized(req())).json();
assert.equal(bounded.data.code, 'REQUEST_BOUND_EXCEEDED'); assert.equal(oversizedCalls, 0); assert.equal(bounded.data.providerGenerationAttempted, false);
const noSources = await (await createDailyProbeHandler({ ...options, admit: async () => true, fetcher: async () => new Response(null, { status: 503 }) })(req())).json();
assert.equal(noSources.data.code, 'SOURCES_UNAVAILABLE'); assert.equal(noSources.data.providerGenerationAttempted, false);
assert.equal((await createDailyProbeHandler({ ...options, admit: async () => { throw Error('PRIVATE_DB_DETAIL'); } })(req())).status, 503);
const runtime = readFileSync('supabase/functions/daily-practice-test/index.ts', 'utf8');
assert.ok(runtime.includes('verifyCoursePublicationOwner'));
assert.match(runtime, /86400, 1/);
assert.doesNotMatch(runtime, /claim_daily_practice|finish_daily_practice|request_daily_practice|configure_daily_practice|\.from\(/);
assert.ok(readFileSync('supabase/config.toml', 'utf8').includes('[functions.daily-practice-test]'));
console.log('PASS private Daily test: real generator/source/schema checks, master+owner gates, explicit free-tier confirmation, one-call admission under racing callers, request byte cap, errors consume budget, no raw data/key disclosure or production-cycle writes; fixture network only.');

assert.equal(passed.data.diagnostics.provider.finishReason, 'STOP');
assert.equal(passed.data.diagnostics.structure.exerciseCount, 10);
assert.ok(validProbeDiagnostics(passed.data.diagnostics));
const stages = [
  ['RESPONSE_ENVELOPE', () => new Response('not JSON')],
  ['MODEL_JSON', () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"exercises":[' }] } }], usageMetadata: { candidatesTokenCount: 32768 } })],
  ['EXERCISE_STRUCTURE', () => { const items = structuredClone(exercises); items[2].questions[4].explanation = 'PRIVATE'; return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ exercises: items }) }] } }] }); }],
  ['SOURCE_ALLOWLIST', () => { const items = structuredClone(exercises); items[0].sources[0].url = 'https://www.investor.gov/not-supplied-reference'; return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ exercises: items }) }] } }] }); }],
  ['CATEGORY_COVERAGE', () => { const items = structuredClone(exercises); items[0].category = items[0].category === 'Price data' ? 'Decision habits' : 'Price data'; return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ exercises: items }) }] } }] }); }],
  ['REPETITION', () => { const items = structuredClone(exercises); items[1].scenario = items[0].scenario; return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ exercises: items }) }] } }] }); }],
] as const;
for (const [stage, response] of stages) {
  let attempts = 0;
  const diagnostic = createDailyProbeHandler({ ...options, admit: async () => true,
    fetcher: async (input, init) => String(input).includes('generativelanguage') ? (attempts++, response()) : upstream(input, init) });
  const result = await (await diagnostic(req())).json();
  assert.equal(result.data.outcome, 'failed'); assert.equal(result.data.code, 'OUTPUT_VALIDATION_FAILED');
  assert.equal(result.data.diagnostics.validation.stage, stage); assert.equal(attempts, 1);
  assert.ok(validProbeDiagnostics(result.data.diagnostics));
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|Trusted fixture source text/);
  if (stage === 'MODEL_JSON') { assert.equal(result.data.diagnostics.provider.finishReason, 'MAX_TOKENS'); assert.equal(result.data.diagnostics.provider.outputTokens, 32768); }
  if (stage === 'EXERCISE_STRUCTURE') {
    assert.deepEqual(result.data.diagnostics.validation.rules, ['QUESTION_FIELDS']);
    assert.equal(result.data.diagnostics.validation.exercise, 3); assert.equal(result.data.diagnostics.validation.question, 5);
    assert.equal(result.data.diagnostics.structure.minExplanationChars, 7);
  }
}
assert.equal(validationDiagnostics('PRIVATE unknown failure'), undefined);
assert.equal(providerDiagnostics(JSON.stringify({ candidates: [{ finishReason: KEY }] })).provider?.finishReason, 'UNRECOGNIZED');
for (const invalid of [{ provider: { finishReason: KEY } }, { validation: { stage: KEY } }, { rawText: KEY }]) assert.equal(validProbeDiagnostics(invalid), false);
assert.doesNotMatch(JSON.stringify(reports), /PRIVATE|Trusted fixture source text/);
assert.ok(reports.every(record => JSON.stringify(record).length < 2000), 'Logs retain bounded metadata only');
const reportFailure = createDailyProbeHandler({ ...options, admit: async () => true, report: () => { throw Error('PRIVATE_LOG_FAILURE'); } });
assert.equal((await (await reportFailure(req())).json()).data.outcome, 'passed', 'Logging failure cannot change validation outcome');
assert.equal((await createDailyProbeHandler(options)(req())).status, 429, 'New handler instance cannot bypass existing admission');
assert.match(runtime, /daily-practice-test-one-per-utc-day-v1/);
console.log('PASS private Daily diagnostics: envelope/JSON/schema/source/category/repetition stages, truncation/token metadata, no prose/keys in logs or UI data, unchanged allowance and validation gates.');
