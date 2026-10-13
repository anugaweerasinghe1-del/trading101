import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createAdminAgentChat } from '../supabase/functions/_shared/adminAgentChat.ts';

const now = Date.parse('2026-10-13T01:00:00.000Z');
const key = 'owner-fixture-key'; const provider = 'provider-fixture-key';
const prompt = 'Help me draft a mobile spacing improvement for the About page.';
const request = (body: unknown = { message: prompt }, adminKey = key) => new Request('https://local.invalid/', { method: 'POST', headers: { 'x-admin-key': adminKey }, body: JSON.stringify(body) });
const upstream = (value: unknown = { reply: 'Review a narrow spacing request before proposing changes.', draftRequest: 'Improve the mobile spacing of the About page while preserving all content and links.' }, signature = false) => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value), ...(signature ? { thoughtSignature: 'opaque-fixture-signature' } : {}) }] } }] }));
function fixture({ status = 200, value, review = '2026-10-13T00:00:00.000Z', availableKey = provider, throws = false } = {} as { status?: number; value?: unknown; review?: string; availableKey?: string; throws?: boolean }) {
  let calls = 0, attempts = 0; const admissions: unknown[] = [];
  const handler = createAdminAgentChat({ getAdminKey: () => key, getGeminiKey: () => availableKey, getFreeReviewAt: () => review, now: () => now,
    allow: async (...args) => { admissions.push(args); if (args[1] === 'admin-chat-pilot-day') return ++attempts <= 1; return true; },
    fetcher: async (url, init) => { calls++; assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'); assert.equal(init?.redirect, 'manual'); assert.equal(new Headers(init?.headers).get('x-goog-api-key'), provider); assert.ok(!String(url).includes(provider)); const body = JSON.parse(String(init?.body)); assert.equal(body.generationConfig.maxOutputTokens, 1024); assert.equal(body.tools, undefined); assert.ok(!String(init?.body).includes(key)); if (throws) throw Error('private-sentinel'); return status === 200 ? upstream(value) : new Response('private-sentinel', { status }); },
  });
  return { handler, calls: () => calls, attempts: () => attempts, admissions };
}
const happy = fixture(); const success = await happy.handler(request()); assert.equal(success.status, 200);
const data = await success.json(); assert.equal(data.rootCauseVerified, false); assert.equal(data.historyAvailable, false); assert.equal(data.claim, 'UNVERIFIED_SUGGESTION'); assert.ok(Object.values(data.authorization).every(x => x === false));
const signed = createAdminAgentChat({ getAdminKey: () => key, getGeminiKey: () => provider, getFreeReviewAt: () => '2026-10-13T00:00:00.000Z', now: () => now, allow: async () => true, fetcher: async () => upstream(undefined, true) });
const signedResponse = await signed(request()); assert.equal(signedResponse.status, 200); assert.ok(!(await signedResponse.text()).includes('opaque-fixture-signature'));
assert.equal((await happy.handler(request())).status, 429); assert.equal(happy.calls(), 1);
const badKey = fixture(); assert.equal((await badKey.handler(request(undefined, 'wrong'))).status, 401); assert.equal(badKey.calls(), 0); assert.equal(badKey.attempts(), 0);
for (const options of [{ review: '' }, { review: '2026-10-01T00:00:00.000Z' }, { review: '2026-10-14T00:00:00.000Z' }, { review: 'not-a-date' }, { availableKey: '' }]) { const f = fixture(options); assert.equal((await f.handler(request())).status, 503); assert.equal(f.calls(), 0); assert.equal(f.attempts(), 0); }
for (const body of [{ message: prompt, tools: ['merge'] }, { message: 'AIza' + 'a'.repeat(25) }, { message: 'Use password=private-sentinel please' }, { message: 'Contact person@example.com about this' }, { message: 'Inspect https://private.invalid/account' }, { message: 'x'.repeat(1201) }, { message: prompt + '\nnew line' }, null]) { const f = fixture(); assert.equal((await f.handler(request(body))).status, 400); assert.equal(f.calls(), 0); assert.equal(f.attempts(), 0); }
const huge = fixture(); assert.equal((await huge.handler(request({ message: 'x'.repeat(7000) }))).status, 400); assert.equal(huge.calls(), 0);
for (const status of [302, 400, 401, 403, 404, 429, 500, 503]) { const f = fixture({ status }); const response = await f.handler(request()); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('private-sentinel')); assert.equal((await f.handler(request())).status, 429); assert.equal(f.calls(), 1); }
for (const value of [{ reply: 'Hello', draftRequest: null, tools: [] }, { reply: provider, draftRequest: null }, { reply: key, draftRequest: null }, { reply: 'x'.repeat(2401), draftRequest: null }, { reply: 'Unsafe API key=private-sentinel', draftRequest: null }, { reply: 'Hello', draftRequest: 'tiny' }]) { const f = fixture({ value }); assert.equal((await f.handler(request())).status, 503); assert.equal(f.calls(), 1); }
const broken = fixture({ throws: true }); const unavailable = await broken.handler(request()); assert.equal(unavailable.status, 503); assert.ok(!(await unavailable.text()).includes('private-sentinel')); assert.equal((await broken.handler(request())).status, 429); assert.equal(broken.calls(), 1);
const noCounter = createAdminAgentChat({ getAdminKey: () => key, getGeminiKey: () => provider, getFreeReviewAt: () => '2026-10-13T00:00:00.000Z', allow: async () => { throw Error('private-sentinel'); }, fetcher: async () => { throw Error('provider must not run'); }, now: () => now });
const failedCounter = await noCounter(request()); assert.equal(failedCounter.status, 503); assert.ok(!(await failedCounter.text()).includes('private-sentinel'));

// Exercise the EXISTING durable SQL primitive with racing authenticated requests.
const db = new PGlite(); await db.exec('CREATE ROLE service_role; CREATE ROLE anon; CREATE ROLE authenticated;');
await db.exec(readFileSync('drizzle/migrations/0000_api_rate_limits.sql', 'utf8'));
let providerCalls = 0;
const durable = createAdminAgentChat({ getAdminKey: () => key, getGeminiKey: () => provider, getFreeReviewAt: () => '2026-10-13T00:00:00.000Z', now: () => now,
  allow: async (subject, bucket, seconds, max) => { const r = await db.query<{ allowed: boolean }>('SELECT public.hit_rate_limit($1,$2,$3,$4) AS allowed', [subject, bucket, seconds, max]); return r.rows[0].allowed; },
  fetcher: async () => { providerCalls++; return upstream(); },
});
const raced = await Promise.all(Array.from({ length: 12 }, () => durable(request())));
assert.equal(raced.filter(r => r.status === 200).length, 1); assert.equal(raced.filter(r => r.status === 429).length, 11); assert.equal(providerCalls, 1);
const budget = await db.query<{ request_count: number }>("SELECT request_count FROM public.api_rate_limits WHERE bucket='admin-chat-pilot-day'"); assert.equal(budget.rows[0].request_count, 12);
await db.close();
const source = readFileSync('supabase/functions/_shared/adminAgentChat.ts', 'utf8'); assert.doesNotMatch(source, /console\.|\.from\(|rpc\(|writeFile|exec\(/);
const ui = readFileSync('src/components/AdminChatPilot.tsx', 'utf8'); assert.doesNotMatch(ui, /localStorage|sessionStorage|dangerouslySetInnerHTML|GEMINI.*KEY/); assert.match(ui, /active\.current/); assert.match(ui, /UNVERIFIED_SUGGESTION/);
console.log('ADMIN_CHAT_PILOT_PASS: owner key, paused/stale configuration, existing durable global one-attempt budget under racing requests, bounded private input/output, fixed provider, no fallback/retry/tools, escaped UI and zero real model calls.');
