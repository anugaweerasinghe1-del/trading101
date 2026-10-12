import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { starterPracticeBank as bank } from '../src/lib/dailyPracticeBank.ts';
import { exerciseForDate, validateBatch, validateExercises, type DailyExercise } from '../supabase/functions/_shared/dailyPractice.ts';
import { recordChallenge, getStreak, hasPlayedQuickToday, getTodayChallenge } from '../src/lib/dailyChallenge.ts';
import { newPractice, readPractice, savePractice, upgradePractice } from '../src/lib/dailyPracticeProgress.ts';
import { createCourseAdminHandler } from '../supabase/functions/_shared/courseAdmin.ts';
import { generatePractice } from '../supabase/functions/_shared/dailyPracticeGenerator.ts';
assert.ok(validateBatch(bank)); assert.equal(new Set(bank.exercises.map(e => e.id)).size, 50);
assert.equal(new Set(bank.exercises.flatMap(e => e.questions.map(q => q.prompt))).size, 500);
for (const bad of [null, {}, { ...bank, effectiveFrom: '2026-02-30' }, { ...bank, exercises: [null] }, { ...bank, exercises: bank.exercises.map((e, i) => i ? e : { ...e, title: 23 }) }]) assert.equal(validateBatch(bad), false);
const invalid = structuredClone(bank); (invalid.exercises[0].questions[0].options as unknown[])[0] = {}; assert.ok(validateExercises(invalid.exercises).length);
for (let i = 0; i < 50; i++) assert.equal(exerciseForDate(bank, new Date(Date.UTC(2026, 9, 9 + i)).toISOString().slice(0, 10)).id, bank.exercises[i].id);
assert.equal(exerciseForDate(bank, '2026-11-28').id, bank.exercises[0].id);
assert.equal(exerciseForDate(bank, '2026-10-08').id, bank.exercises[49].id);
const memory = new Map<string, string>(), storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); } };
let progress = newPractice(bank, '2026-10-09'); progress.answers = [1, 2, 0]; savePractice(progress, storage);
assert.equal(savePractice({ ...progress, answers: [1] }, storage).progress.answers.length, 3);
assert.equal(savePractice({ ...progress, bankId: 'another', exercise: bank.exercises[1] }, storage).progress.bankId, bank.id);
assert.equal(readPractice('2026-10-10', storage), null);
assert.equal(readPractice('2026-10-09', { getItem: () => '{broken' }), null);
assert.equal(savePractice(progress, { ...storage, setItem: () => { throw new Error('blocked'); } }).saved, false);
// Only an exact preserved three-question prefix may be extended, with old answers retained.
const legacy = { ...progress, bankId: 'authored-2026-10', exercise: { ...bank.exercises[0], questions: bank.exercises[0].questions.slice(0,3) } };
const upgraded = upgradePractice(legacy, bank);
assert.equal(upgraded.exercise.questions.length, 10); assert.deepEqual(upgraded.answers, legacy.answers);
memory.clear(); savePractice(legacy, storage); assert.equal(savePractice(upgraded, storage).progress.exercise.questions.length, 10);
const changedBank = structuredClone(bank); changedBank.exercises[0].questions[0].prompt += ' changed';
assert.equal(upgradePractice(legacy, changedBank), legacy);
memory.clear();
// Real streak engine: deeper-first, quick-first and reload share one completion.
const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window'), oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
try {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  const deeper = recordChallenge(0, 'hold'); assert.equal(deeper.totalCompleted, 1); assert.equal(hasPlayedQuickToday(), false);
  const quick = recordChallenge(getTodayChallenge().id, 'long'); assert.equal(quick.totalCompleted, 1); assert.equal(quick.current, 1);
  assert.equal(hasPlayedQuickToday(), true); assert.equal(getStreak().history[0].decision, 'long');
  assert.equal(recordChallenge(0, 'hold').totalCompleted, 1); assert.equal(recordChallenge(getTodayChallenge().id, 'short').history[0].decision, 'long');
} finally {
  if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window');
  if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
}
let writes = 0;
const handler = createCourseAdminHandler({ getKey: () => 'test-key', rateLimit: async () => true, store: {
 list: async () => [], save: async () => null, publish: async () => null, reject: async () => null, settings: async () => null, configure: async () => null, run: async () => null,
 daily: async () => { writes++; return {}; },
} });
const req = (body: unknown, key = 'test-key') => new Request('https://example.test', { method: 'POST', headers: { 'x-admin-key': key }, body: JSON.stringify(body) });
const id = '12345678-1234-1234-1234-123456789012';
assert.equal((await handler(req({ action: 'daily-list' }, 'wrong'))).status, 401);
assert.equal((await handler(req({ action: 'daily-publish', id, revision: 1, reviewer: 'Owner', reviewed: false }))).status, 400);
assert.equal((await handler(req({ action: 'daily-save', id, revision: 1, document: invalid }))).status, 400); assert.equal(writes, 0);
assert.equal((await handler(req({ action: 'daily-save', id, revision: 1, document: bank }))).status, 200); assert.equal(writes, 1);

const chunk = (part: number) => bank.exercises.slice(0, 10).map((e, i) => ({ ...structuredClone(e), id: `test-part-${part}-${i}`, title: `Private test part ${part} case ${i}`, questions: e.questions.map((q, n) => ({ ...q, prompt: `Part ${part} case ${i} question ${n}: ${q.prompt}` })) }));
let calls = 0;
const claim = { lease: id, effectiveFrom: '2026-12-09', apiKey: 'test-only', model: 'gemini-3.5-flash', exercises: [], existing: [] };
const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
 if (String(url).includes('generativelanguage')) { calls++; assert.ok(!String(url).includes(claim.apiKey));
  const b = JSON.parse(String(init?.body)); assert.ok(b.generationConfig.responseJsonSchema); assert.equal(b.contents.length, 1);
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ exercises: chunk(0) }) }] } }] })); }
 return new Response('<main>' + 'Trusted test reference. '.repeat(120) + '</main>', { headers: { 'Content-Type': 'text/html' } });
}) as typeof fetch;
assert.equal((await generatePractice(claim, fetcher)).exercises.length, 10); assert.equal(calls, 1);
await assert.rejects(generatePractice({ ...claim, existing: chunk(0) }, fetcher), /repeats/);
let limitedCalls = 0;
await assert.rejects(generatePractice(claim, (async (url, init) => { if (String(url).includes('generativelanguage')) { limitedCalls++; return new Response('', { status: 429 }); } return fetcher(url, init); }) as typeof fetch), /Free Gemini quota/);
assert.equal(limitedCalls, 1);
await assert.rejects(generatePractice(claim, (async () => new Response('', { status: 503 })) as typeof fetch), /No AI request/);

const db = process.env.TRADEHQ_DAILY_POSTGRES_TEST === 'explicit-ci-fixture'
 ? await (await import('./daily-postgres-fixture.mjs')).createDailyPostgresFixture()
 : new PGlite();
try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA tradehq_private; GRANT USAGE ON SCHEMA tradehq_private TO service_role;
 CREATE TABLE public.market_articles(id uuid DEFAULT gen_random_uuid(),slug text,title text,content text,focus_asset text);
 GRANT SELECT ON public.market_articles TO anon,authenticated; ALTER TABLE public.market_articles ENABLE ROW LEVEL SECURITY;
 CREATE POLICY "Articles are publicly readable" ON public.market_articles FOR SELECT TO anon,authenticated USING(true);
 INSERT INTO public.market_articles(slug,title,content,focus_asset) VALUES('tsest','Tsest','test123','btc'),('real','Real article','Substantial authored content','btc');
 CREATE TABLE tradehq_private.course_generation_settings(id boolean PRIMARY KEY,free_confirmed boolean,model text);
 INSERT INTO tradehq_private.course_generation_settings VALUES(true,true,'gemini-3.5-flash');
 CREATE SCHEMA vault; CREATE TABLE vault.secrets(name text,secret text); CREATE VIEW vault.decrypted_secrets AS SELECT name,secret AS decrypted_secret FROM vault.secrets;
 INSERT INTO vault.secrets VALUES('tradehq_course_gemini_key','test-only-secret');
 CREATE SCHEMA net; CREATE TABLE net.requests(headers jsonb);
 CREATE FUNCTION net.http_post(url text,body jsonb,headers jsonb,timeout_milliseconds integer) RETURNS bigint LANGUAGE plpgsql AS $$ BEGIN INSERT INTO net.requests VALUES(headers); RETURN 1; END; $$;
 CREATE SCHEMA cron; CREATE FUNCTION cron.schedule(name text,schedule text,command text) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;`);
 await db.exec(readFileSync('supabase/migrations/20261009125658_daily_practice_and_content_cleanup.sql', 'utf8'));
 await db.exec(readFileSync('supabase/migrations/20261009135016_daily_practice_cycle_recovery.sql', 'utf8'));
 await db.exec(readFileSync('supabase/migrations/20261009142312_daily_depth_and_scored_cases.sql', 'utf8'));
 const query = async <T>(sql: string, args: unknown[] = []) => (await db.query<{ v: T }>(sql, args)).rows[0]?.v;
 assert.equal(await query('SELECT tradehq_private.daily_exercises_valid($1::jsonb) AS v', [JSON.stringify(bank.exercises)]), true);
 await db.exec('SET ROLE anon');
 assert.equal((await db.query('SELECT * FROM public.market_articles')).rows.length, 1);
 const live = await query< typeof bank>('SELECT public.get_daily_practice_bank() AS v'); assert.equal(live.exercises.length, 50);
 await assert.rejects(db.query('SELECT * FROM public.daily_practice_drafts'), /permission denied/);
 await assert.rejects(db.query('SELECT public.claim_daily_practice($1)', ['a'.repeat(64)]), /permission denied/);
 await db.exec('RESET ROLE');
 const row = (await db.query<{ id: string }>("SELECT id FROM public.daily_practice_drafts WHERE document->>'id'='authored-2026-10-depth'")).rows[0];
 const edited = { ...bank, exercises: bank.exercises.map((e, i) => i ? e : { ...e, title: 'Edited private starter case' }) };
 await db.query('SELECT public.save_daily_practice($1,1,$2::jsonb)', [row.id, JSON.stringify(edited)]);
 assert.equal((await query<typeof bank>('SELECT public.get_daily_practice_bank() AS v')).exercises[0].title, bank.exercises[0].title);
 await assert.rejects(db.query('SELECT public.publish_daily_practice($1,1,$2)', [row.id, 'Owner']), /changed/);
 await db.query('SELECT public.publish_daily_practice($1,2,$2)', [row.id, 'Owner']);
 assert.equal((await query<typeof bank>('SELECT public.get_daily_practice_bank() AS v')).reviewer, 'Owner');
 const due = await query<string>('SELECT next_due::text AS v FROM tradehq_private.daily_practice_state');
 await db.query('SELECT public.request_daily_practice(false)'); assert.equal((await db.query('SELECT * FROM net.requests')).rows.length, 0);
 for (let part = 0; part < 5; part++) {
  await db.exec("UPDATE tradehq_private.daily_practice_state SET last_started=NULL");
  await db.query('SELECT public.request_daily_practice(true)');
  const token = (await db.query<{ headers: Record<string, string> }>('SELECT headers FROM net.requests ORDER BY ctid DESC LIMIT 1')).rows[0].headers['x-generation-token'];
  assert.equal(await query('SELECT public.claim_daily_practice($1) AS v', ['b'.repeat(64)]), null);
  const lease = await query<{ lease: string; apiKey: string }>('SELECT public.claim_daily_practice($1) AS v', [token]); assert.equal(lease.apiKey, 'test-only-secret');
  assert.equal(await query('SELECT public.claim_daily_practice($1) AS v', [token]), null);
  assert.equal(await query('SELECT public.finish_daily_practice($1,$2::jsonb,$3::jsonb,NULL) AS v', [lease.lease, JSON.stringify(chunk(part)), '{}']), true);
  assert.equal(await query('SELECT public.finish_daily_practice($1,$2::jsonb,$3::jsonb,NULL) AS v', [lease.lease, JSON.stringify(chunk(part)), '{}']), false);
 }
 assert.equal((await db.query('SELECT * FROM public.daily_practice_drafts')).rows.length, 3);
 assert.equal((await db.query('SELECT * FROM public.daily_practice_batches')).rows.length, 2);
 assert.equal(await query('SELECT next_due::text AS v FROM tradehq_private.daily_practice_state'), '2027-02-09');
 assert.equal(due, '2026-12-09');
 // A quota failure cannot be bypassed by an owner/manual request.
 await db.exec("UPDATE tradehq_private.daily_practice_state SET last_started=NULL");
 await db.query('SELECT public.request_daily_practice(true)');
 const token = (await db.query<{ headers: Record<string, string> }>('SELECT headers FROM net.requests ORDER BY ctid DESC LIMIT 1')).rows[0].headers['x-generation-token'];
 const lease = await query<{ lease: string }>('SELECT public.claim_daily_practice($1) AS v', [token]);
 await db.query('SELECT public.finish_daily_practice($1,NULL,NULL,$2)', [lease.lease, 'Free quota exhausted']);
 assert.equal(await query('SELECT public.request_daily_practice(true) AS v'), null);
 const status = await query<Record<string, unknown>>('SELECT public.daily_practice_status() AS v'); assert.ok(!JSON.stringify(status).includes('test-only-secret'));
 await db.exec("UPDATE tradehq_private.daily_practice_state SET attempts=3,retry_after=NULL,last_started=NULL");
 assert.equal(await query('SELECT public.request_daily_practice(true) AS v'), null);
 // Exhausted past cycles reset only when the next two-month preparation window opens.
 await db.exec("UPDATE tradehq_private.daily_practice_state SET next_due=((clock_timestamp() AT TIME ZONE 'Asia/Colombo')::date-interval '2 months')::date,retry_after=clock_timestamp()+interval '1 day',last_started=NULL");
 assert.equal(await query('SELECT public.request_daily_practice(false) AS v'), 1);
 assert.equal(await query('SELECT attempts AS v FROM tradehq_private.daily_practice_state'), 0);
 assert.equal((await db.query('SELECT * FROM public.daily_practice_batches')).rows.length, 2);
 console.log((process.env.TRADEHQ_DAILY_POSTGRES_TEST === 'explicit-ci-fixture' ? 'REAL_POSTGRES_DAILY_PASS: ' : '') + 'PASS Daily: 50 unique cases/500 questions, date rotation, frozen attempts, storage failures, owner review/revision guards, private drafts, future banks, five resumable parts, token replay rejection, cooldown, attempt cap and no paid fallback.');
} finally { await db.close(); }
