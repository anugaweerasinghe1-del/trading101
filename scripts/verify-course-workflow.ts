import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { courseCovers, lessonWordCount, validateCourseDocument, type CourseDocument } from "../supabase/functions/_shared/courseDocument.ts";
import { createCourseAdminHandler } from "../supabase/functions/_shared/courseAdmin.ts";
import { generateCourse, courseReferences, GENERATION_READ_LIMITS } from "../supabase/functions/_shared/courseGenerator.ts";
import { checkCourseDemand } from "../supabase/functions/_shared/courseDemandCheck.ts";
import { renderApprovedCourse } from "../src/lib/courseHtml.ts";
import { sharedQuote } from "../supabase/functions/_shared/sharedQuote.ts";
import { readCoursePublicationHistory } from "../src/lib/coursePublicationHistory.ts";
import { parseCourseProgress } from "../src/lib/courseProgress.ts";

for (const raw of [null, 'null', '[]', '42', '{broken', '{"v":2,"tracks":{}}', '{"v":1,"tracks":null}', '{"v":1,"tracks":[]}']) {
  assert.equal(Object.keys(parseCourseProgress(raw).tracks).length, 0, 'Malformed progress must recover without a render crash');
}
const completedLesson = { status: 'completed', score: 4, completedAt: '2026-10-09T15:45:01Z', scrolledPct: 100 };
const recovered = parseCourseProgress(JSON.stringify({ v: 1, updatedAt: 'bad date', tracks: {
  good: { lessons: { completed: completedLesson, broken: null, badStatus: { status: 'unknown' }, arrayStatus: { status: ['completed'] }, objectStatus: { status: { toString: 'completed' } }, badScore: { status: 'in-progress', score: '4', scrolledPct: -1 } }, badgeEarnedAt: '2026-10-09T15:46:01Z' },
  broken: null, noLessons: { lessons: null }, arrayLessons: { lessons: [] },
}, lastLesson: { track: 'good', lesson: 'completed', at: '2026-10-09T15:45:01Z' } }));
assert.deepEqual(recovered.tracks.good.lessons.completed, completedLesson, 'Valid saved score and completion survive nearby corruption');
assert.equal(recovered.tracks.good.badgeEarnedAt, '2026-10-09T15:46:01Z');
assert.deepEqual(recovered.lastLesson, { track: 'good', lesson: 'completed', at: '2026-10-09T15:45:01Z' });
assert.equal(recovered.tracks.good.lessons.broken, undefined);
assert.equal(recovered.tracks.good.lessons.badStatus, undefined);
assert.equal(recovered.tracks.good.lessons.arrayStatus, undefined);
assert.equal(recovered.tracks.good.lessons.objectStatus, undefined);
assert.deepEqual(recovered.tracks.good.lessons.badScore, { status: 'in-progress' });
assert.equal(Object.keys(recovered.tracks.noLessons.lessons).length, 0);
assert.equal(Object.keys(recovered.tracks.arrayLessons.lessons).length, 0);
assert.equal(recovered.updatedAt, new Date(0).toISOString());
const reserved = parseCourseProgress('{"v":1,"tracks":{"__proto__":{"lessons":{"constructor":{"status":"completed","score":4}}}}}');
assert.equal(Object.getPrototypeOf(reserved.tracks), null, 'Stored track keys cannot inherit prototype properties');
assert.equal(Object.getPrototypeOf(reserved.tracks.__proto__.lessons), null);
assert.equal(reserved.tracks.__proto__.lessons.constructor.status, 'completed');
assert.equal(Object.hasOwn(parseCourseProgress('{"v":1,"tracks":{}}').tracks, 'constructor'), false);

const noticeNow = Date.parse('2026-10-14T00:00:00Z');
const seenPublication = 'published-course:2026-10-09T15:45:01.003475+00:00';
for (const raw of [null, 'null', '[]', 'true', '42', '"stored string"', '{broken']) {
  assert.deepEqual(readCoursePublicationHistory(raw, noticeNow), {}, 'Malformed browser history must recover');
}
assert.deepEqual(readCoursePublicationHistory(JSON.stringify({
  [seenPublication]: true,
  'not-a-publication': true,
  'stale-course:2026-09-01T00:00:00Z': true,
  'future-course:2027-01-01T00:00:00Z': true,
  'unseen-course:2026-10-09T00:00:00Z': false,
  'invalid-value:2026-10-09T00:00:00Z': 'true',
}), noticeNow), { [seenPublication]: true }, 'Valid revision markers survive alongside corrupt entries');
assert.equal(Object.keys(readCoursePublicationHistory(JSON.stringify(Object.fromEntries(
  Array.from({ length: 180 }, (_, i) => ['course-' + i + ':2026-10-09T00:00:00Z', true])
)), noticeNow)).length, 150, 'Stored announcement history stays bounded');

// Test-only fixture; never inserted into production or published.
const document: CourseDocument = {
  slug: "test-course", title: "Test Course", tagline: "A test-only fixture.", description: "Private verification data.",
  hero: courseCovers[0].path, level: "Beginner", badge: { name: "Completion", description: "Complete the lessons." },
  outcomes: ["Understand snapshots", "Calculate returns", "Check source timestamps"], prerequisites: "Arithmetic.",
  progression: "Definition, example, exercise.", notFor: "Real-money recommendations.",
  lessons: Array.from({ length: 3 }, (_, i) => ({
    slug: "lesson-" + i, title: "Test lesson " + i, summary: "Test-only lesson.", readingMinutes: 6,
    body: [Array.from({ length: 600 }, (_, n) => "word" + i + "x" + n).join(" ")],
    keyTakeaways: ["One", "Two", "Three"],
    sources: courseReferences.slice(0, 2),
    quiz: Array.from({ length: 3 }, () => ({ question: "Which is two?", options: ["One", "Two", "Three", "Four"], correctAnswer: 1, explanation: "Two is the second option." })),
  })),
};
assert.deepEqual(validateCourseDocument(document, true), []);
const boundary = structuredClone(document);
boundary.lessons[0].body = [Array(550).fill("word").join(" "), "## Heading words do not make a short lesson long enough"];
assert.equal(lessonWordCount(boundary.lessons[0].body), 550);
assert.ok(validateCourseDocument(boundary, true).some(e => e.includes("over 550")));
const enough = structuredClone(boundary); enough.lessons[0].body[0] += " extra";
assert.equal(lessonWordCount(enough.lessons[0].body), 551);
assert.deepEqual(validateCourseDocument(enough, true), []);
const incomplete = structuredClone(document); incomplete.lessons[0].body = [];
assert.ok(validateCourseDocument(incomplete, true).length > 0);
const unsafe = structuredClone(document); unsafe.lessons[0].sources[0].url = "javascript:alert(1)";
assert.ok(validateCourseDocument(unsafe).length > 0);
const invalidQuiz = structuredClone(document); invalidQuiz.lessons[0].quiz[0].correctAnswer = 4;
assert.ok(validateCourseDocument(invalidQuiz).length > 0);

let writes = 0;
const summaryReads: boolean[] = [];
const handler = createCourseAdminHandler({
  getKey: () => "test-owner-key", rateLimit: async () => true,
  store: {
    list: async (summary = false) => { summaryReads.push(summary); return []; }, save: async () => { writes++; return {}; }, publish: async () => { writes++; return {}; },
    reject: async () => { writes++; return {}; }, settings: async () => ({}), configure: async () => ({}), run: async () => 1,
  },
});
const request = (body: unknown, key = "test-owner-key") => new Request("https://example.test", {
  method: "POST", headers: { "x-admin-key": key }, body: JSON.stringify(body),
});
assert.equal((await handler(request({ action: "save", document }, "wrong"))).status, 401);
assert.equal(writes, 0);
assert.equal((await handler(request({ action: "list", summary: true }, "wrong"))).status, 401);
assert.deepEqual(summaryReads, [], 'Summary reads use the same verified master key');
assert.equal((await handler(request({ action: "list", summary: true }))).status, 200);
assert.equal((await handler(request({ action: "list" }))).status, 200);
assert.deepEqual(summaryReads, [true, false], 'Dashboard metadata and full editor reads stay distinct');
assert.equal((await handler(request({ action: "publish", id: "12345678-1234-1234-1234-123456789012", revision: 1, reviewer: "Owner", reviewed: false }))).status, 400);
assert.equal(writes, 0);
assert.equal((await handler(request({ action: "save", document }))).status, 200);
assert.equal(writes, 1);

const shell = '<html><head><title>Shell</title><meta name="robots" content="noindex, follow"></head><body><div id="root"></div></body></html>';
const hostile = structuredClone(document); hostile.title = "</script><script>alert(1)</script>";
const html = renderApprovedCourse(shell, hostile)!;
assert.ok(html.includes('content="index, follow"'));
assert.ok(!html.includes('content="noindex'));
assert.ok(html.includes("&lt;/script&gt;"));
assert.ok(!html.includes("<script>alert(1)</script>"));
assert.ok(html.includes("approved-course-bootstrap"));
assert.ok(html.includes('src="' + document.hero + '"'));
assert.equal(renderApprovedCourse(shell, document, "missing"), null);

const now = Date.now();
const row = { price: "100", source: "CoinGecko", updated_at: new Date(now - 60000).toISOString(),
  observed_at: new Date(now - 10 * 86400000).toISOString(), quote_data: null };
assert.equal(sharedQuote(row, now)?.provenance.status, "delayed");
assert.equal(sharedQuote(row, now)?.change24h, null);
assert.equal(sharedQuote({ ...row, updated_at: new Date(now - 7 * 60000).toISOString() }, now), null);
const current = new Date(now - 30000).toISOString();
const quote = { price: 100, change24h: 2, changePercent24h: 2, volume24h: 1234, provenance: { observedAt: current } };
assert.equal(sharedQuote({ ...row, observed_at: current.replace("Z", "+00:00"), quote_data: quote }, now)?.change24h, 2);
assert.equal(sharedQuote({ ...row, observed_at: current, price: 101, quote_data: quote }, now)?.change24h, null);

let aiCalls = 0;
const claim = { lease: "test", period: "2026-10", slot: 1, apiKey: "test-free-key", model: "gemini-3.8-flash",
  gscProperty: "", gscCredentials: null, topicRequests: ["Price snapshots"], existing: [] };
const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
  if (String(url).includes("generativelanguage")) {
    assert.equal(init?.redirect, 'error');
    aiCalls++; assert.ok(!String(url).includes(claim.apiKey));
    const request = JSON.parse(String(init!.body));
    assert.equal(request.generationConfig.thinkingConfig.thinkingLevel, 'LOW');
    const prompt = JSON.parse(request.contents[0].parts[0].text);
    assert.equal(prompt.covers.length, 4);
    assert.ok(prompt.style.some((s: string) => s.includes("TradeHQ")));
    assert.equal((init!.headers as Record<string, string>)["x-goog-api-key"], claim.apiKey);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(document) }] } }] }));
  }
  return new Response("<main>" + "Trusted test-only reference. ".repeat(100) + "</main>", { headers: { "Content-Type": "text/html" } });
}) as typeof fetch;
const generated = await generateCourse(claim, fetcher);
assert.equal(generated.research.method, "Owner topic requests"); assert.equal(aiCalls, 1);
await assert.rejects(generateCourse({ ...claim, topicRequests: [] }, fetcher), /Connect Search Console/);
assert.equal(aiCalls, 1);
const limited = (async (url: string | URL | Request, init?: RequestInit) => String(url).includes("generativelanguage")
  ? new Response("", { status: 429 }) : fetcher(url, init)) as typeof fetch;
await assert.rejects(generateCourse(claim, limited), /Free AI quota exhausted/);
for (const bad of [new Response(new Uint8Array(GENERATION_READ_LIMITS.providerBytes+1)), new Response('{provider-private-fixture'), new Response('', {status:302})]) {
  let providerAttempts=0;
  await assert.rejects(generateCourse(claim, (async (url, init) => {
    if(String(url).includes('generativelanguage')) {providerAttempts++;assert.equal(init?.redirect,'error');return bad;}
    return fetcher(url,init);
  }) as typeof fetch), /byte limit|invalid response|HTTP 302/);
  assert.equal(providerAttempts,1,'Rejected response must not retry or fall back');
}

const testKeys = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const privateBytes = new Uint8Array(await crypto.subtle.exportKey("pkcs8", testKeys.privateKey));
const testCredentials = { client_email: "test@example.test", private_key: "-----BEGIN PRIVATE KEY-----\n" +
  Buffer.from(privateBytes).toString("base64") + "\n-----END PRIVATE KEY-----", token_uri: "https://untrusted.example.test" };
const checkFetcher = (async (url: string | URL | Request) => {
  const value = String(url);
  if (value === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token: "test-only-token" }));
  assert.equal(value, "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.thetradehq.com%2F/searchAnalytics/query");
  return new Response(JSON.stringify({ rows: [] }));
}) as typeof fetch;
const demandCheck = await checkCourseDemand(testCredentials, "https://www.thetradehq.com/", checkFetcher);
assert.equal(demandCheck.ok, true); assert.equal(demandCheck.queryHttpStatus, 200); assert.equal(demandCheck.matchingQueries, 0);
assert.ok(!JSON.stringify(demandCheck).includes("test-only-token"));
const deniedFetcher = (async (url: string | URL | Request, init?: RequestInit) => {
  if (String(url) === "https://www.googleapis.com/webmasters/v3/sites") return new Response(JSON.stringify({ siteEntry: [
    { siteUrl: "sc-domain:thetradehq.com" }, { siteUrl: "sc-domain:unrelated.example" } ] }));
  if (String(url).includes("searchAnalytics")) return new Response("Sensitive provider response must not be echoed", { status: 403 });
  return checkFetcher(url, init);
}) as typeof fetch;
const deniedCheck = await checkCourseDemand(testCredentials, "https://www.thetradehq.com/", deniedFetcher);
assert.equal(deniedCheck.error, "property_access_denied");
assert.deepEqual(deniedCheck.availableProperties, ["sc-domain:thetradehq.com"]);
assert.ok(!JSON.stringify(deniedCheck).includes("Sensitive provider response"));

const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA tradehq_private; GRANT USAGE ON SCHEMA tradehq_private TO service_role;
    CREATE SCHEMA vault;
    CREATE TABLE vault.secrets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text UNIQUE,secret text);
    CREATE VIEW vault.decrypted_secrets AS SELECT id,name,secret AS decrypted_secret FROM vault.secrets;
    CREATE FUNCTION vault.create_secret(s text,n text) RETURNS uuid LANGUAGE plpgsql AS $$
      DECLARE k uuid; BEGIN INSERT INTO vault.secrets(name,secret) VALUES(n,s) RETURNING id INTO k; RETURN k; END; $$;
    CREATE FUNCTION vault.update_secret(k uuid,s text) RETURNS void LANGUAGE sql AS $$ UPDATE vault.secrets SET secret=s WHERE id=k $$;
    CREATE SCHEMA net; CREATE FUNCTION net.http_post(url text,body jsonb,headers jsonb,timeout_milliseconds integer) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;
    CREATE SCHEMA cron; CREATE FUNCTION cron.schedule(name text,schedule text,command text) RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;`);
  for (const file of readdirSync("supabase/migrations").filter(f => /course_draft_approval|course_generation_schedule|support_gemini_auth_keys|validate_gemini_auth_key_length|course_lesson_quality_floor|course_generation_model_choice|course_demand_connection_check/.test(f)).sort()) {
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  }
  for (const [fixture, valid] of [[boundary, false], [enough, true]] as const) {
    const result = await db.query<{ valid: boolean }>("select tradehq_private.course_document_valid($1::jsonb,true) as valid", [JSON.stringify(fixture)]);
    assert.equal(result.rows[0].valid, valid);
  }
  const doc = JSON.stringify(document);
  const added = await db.query<{ id: string }>("select public.ingest_course_draft('2026-10',1,$1::jsonb,'{}'::jsonb) as id", [doc]);
  const id = added.rows[0].id;
  const same = await db.query<{ id: string }>("select public.ingest_course_draft('2026-10',1,$1::jsonb,'{}'::jsonb) as id", [doc]);
  assert.equal(same.rows[0].id, id);
  await db.exec("SET ROLE anon");
  assert.equal((await db.query("select * from public.published_courses")).rows.length, 0);
  await assert.rejects(db.query("select * from public.course_drafts"), /permission denied/);
  await assert.rejects(db.query("select public.publish_course_draft($1,1,'Owner')", [id]), /permission denied/);
  await assert.rejects(db.query("select public.course_generation_status()"), /permission denied/);
  await db.exec("RESET ROLE");
  await assert.rejects(db.query("select public.publish_course_draft($1,2,'Owner')", [id]), /Course changed/);
  await db.query("select public.publish_course_draft($1,1,'Owner')", [id]);
  await db.exec("SET ROLE anon");
  const approved = await db.query<{ document: CourseDocument }>("select document from public.published_courses");
  assert.equal(approved.rows[0].document.editorial?.reviewer, "Owner");
  const catalog = await db.query<{ doc: CourseDocument }>("select public.get_published_course_catalog() as doc");
  assert.deepEqual(catalog.rows[0].doc.lessons[0].body, []);
  await db.exec("RESET ROLE");
  const edited = structuredClone(document); edited.title = "Revised draft";
  await db.query("select public.save_course_draft($1,1,$2::jsonb)", [id, JSON.stringify(edited)]);
  const stillLive = await db.query<{ document: CourseDocument }>("select document from public.published_courses");
  assert.equal(stillLive.rows[0].document.title, "Test Course");
  await assert.rejects(db.query("select public.save_course_draft($1,1,$2::jsonb)", [id, doc]), /Course changed/);
  await db.query("select public.publish_course_draft($1,2,'Owner')", [id]);
  const afterApproval = await db.query<{ document: CourseDocument }>("select document from public.published_courses");
  assert.equal(afterApproval.rows[0].document.title, "Revised draft");
  const empty = await db.query<{ valid: boolean }>("select tradehq_private.course_document_valid($1::jsonb,true) as valid", [JSON.stringify(incomplete)]);
  assert.equal(empty.rows[0].valid, false);
  const settings = { enabled: true, freeConfirmed: false, model: "gemini-3.8-flash", topicRequests: [] };
  await assert.rejects(db.query("select public.configure_course_generation($1::jsonb)", [JSON.stringify(settings)]), /billing disabled/);
  const meta = await db.query<{ value: Record<string, unknown> }>("select public.course_generation_status() as value");
  assert.equal(meta.rows[0].value.hasApiKey, false);
  assert.ok(!Object.keys(meta.rows[0].value).includes("apiKey"));
  assert.equal((await db.query<{ value: number | null }>("select public.request_course_generation() as value")).rows[0].value, null);
  const ready = { ...settings, enabled: true, freeConfirmed: true, model: "gemini-3.5-flash", apiKey: "AQ.test-free-provider-key-123456", topicRequests: ["Price snapshots"] };
  await db.query("select public.configure_course_generation($1::jsonb)", [JSON.stringify(ready)]);
  await assert.rejects(db.query("select public.configure_course_generation($1::jsonb)", [JSON.stringify({ ...ready, model: "unapproved-model" })]), /Invalid generation settings/);
  await assert.rejects(db.query("select public.configure_course_generation($1::jsonb)", [JSON.stringify({ ...ready, apiKey: "x".repeat(257) })]), /Invalid API key/);
  await assert.rejects(db.query("select public.configure_course_generation($1::jsonb)", [JSON.stringify({ ...ready, apiKey: "AQ.invalid key with spaces" })]), /Invalid API key/);
  await db.exec("DELETE FROM public.course_drafts WHERE id <> '" + id + "'");
  // Use a different period from the current clock for the existing fixture.
  await db.query("UPDATE public.course_drafts SET generation_period='2000-01' WHERE id=$1", [id]);
  assert.equal((await db.query<{ value: number }>("select public.request_course_generation(true) as value")).rows[0].value, 1);
  assert.equal((await db.query<{ value: number | null }>("select public.request_course_generation(true) as value")).rows[0].value, null);
  await db.exec("SET ROLE anon");
  await assert.rejects(db.query("select public.request_course_demand_check()"), /permission denied/);
  await assert.rejects(db.query("select public.claim_course_demand_check('" + "a".repeat(64) + "')"), /permission denied/);
  await db.exec("RESET ROLE");
  await db.query("INSERT INTO vault.secrets(name,secret) VALUES('tradehq_course_gsc_credentials',$1)", [JSON.stringify({ type: "service_account", client_email: "test@example.test", private_key: "test-only" })]);
  await db.query("UPDATE tradehq_private.course_generation_settings SET gsc_property='https://www.thetradehq.com/' WHERE id");
  const beforeCheck = JSON.stringify((await db.query("select * from tradehq_private.course_generation_runs order by period,slot")).rows);
  assert.equal((await db.query<{ value: number }>("select public.request_course_demand_check() as value")).rows[0].value, 1);
  assert.equal((await db.query<{ value: unknown }>("select public.claim_course_demand_check($1) as value", ["f".repeat(64)])).rows[0].value, null);
  // Only a matching stored hash can authorize a check. Test-only token never leaves this local DB.
  const checkToken = "c".repeat(64);
  await db.query("UPDATE tradehq_private.course_demand_check SET token_hash=encode(sha256(convert_to($1,'UTF8')),'hex') WHERE id", [checkToken]);
  const checked = (await db.query<{ value: { lease: string; credentials: { client_email: string } } }>("select public.claim_course_demand_check($1) as value", [checkToken])).rows[0].value;
  assert.equal(checked.credentials.client_email, "test@example.test");
  assert.equal((await db.query<{ value: unknown }>("select public.claim_course_demand_check($1) as value", [checkToken])).rows[0].value, null);
  await db.query("select public.finish_course_demand_check($1,$2::jsonb)", [checked.lease, JSON.stringify({ ok: true, matchingQueries: 0, secret: "must-not-be-saved" })]);
  assert.ok(!JSON.stringify((await db.query("select result from tradehq_private.course_demand_check")).rows).includes("must-not-be-saved"));
  assert.equal(JSON.stringify((await db.query("select * from tradehq_private.course_generation_runs order by period,slot")).rows), beforeCheck);
  await db.query("UPDATE tradehq_private.course_demand_check SET token_hash=encode(sha256(convert_to($1,'UTF8')),'hex'),expires_at=clock_timestamp()-interval '1 second' WHERE id", [checkToken]);
  assert.equal((await db.query<{ value: unknown }>("select public.claim_course_demand_check($1) as value", [checkToken])).rows[0].value, null);
  const token = (await db.query<{ token: string }>("select pending_token as token from tradehq_private.course_generation_state")).rows[0].token;
  assert.equal((await db.query<{ value: unknown }>("select public.claim_course_generation($1) as value", ["x".repeat(64)])).rows[0].value, null);
  const lease = (await db.query<{ value: { lease: string; slot: number; apiKey: string } }>("select public.claim_course_generation($1) as value", [token])).rows[0].value;
  assert.equal(lease.slot, 1); assert.equal(lease.apiKey, ready.apiKey);
  assert.equal((await db.query<{ value: unknown }>("select public.claim_course_generation($1) as value", [token])).rows[0].value, null);
  await db.query("select public.finish_course_generation($1,NULL,NULL,'Free AI quota exhausted')", [lease.lease]);
  // The pause is per slot. On/after the 15th the independent second slot is
  // eligible, so isolate slot 1's cooldown by exhausting slot 2 in a rollback-
  // only fixture transaction. Do not change production scheduling or its clock.
  await db.exec('BEGIN');
  await db.exec("INSERT INTO tradehq_private.course_generation_runs(period,slot,attempts,status) SELECT to_char(clock_timestamp() AT TIME ZONE 'Asia/Colombo','YYYY-MM'),2,3,'paused'");
  assert.equal((await db.query<{ value: number | null }>("select public.request_course_generation() as value")).rows[0].value, null);
  await db.exec('ROLLBACK');
  // Separately check the scheduler's real second-slot boundary, then undo only
  // this disposable observation so the existing manual-retry lifecycle follows.
  await db.exec('BEGIN');
  const day = (await db.query<{ day: number }>("select extract(day FROM clock_timestamp() AT TIME ZONE 'Asia/Colombo')::int as day")).rows[0].day;
  const automatic = (await db.query<{ value: number | null }>("select public.request_course_generation() as value")).rows[0].value;
  assert.equal(automatic, day >= 15 ? 1 : null);
  if (day >= 15) assert.equal((await db.query<{ slot: number }>("select pending_slot as slot from tradehq_private.course_generation_state")).rows[0].slot, 2);
  assert.equal((await db.query<{ attempts: number }>("select attempts from tradehq_private.course_generation_runs where slot=1")).rows[0].attempts, 1);
  await db.exec('ROLLBACK');
  await db.query("select public.request_course_generation(true)");
  const retryToken = (await db.query<{ token: string }>("select pending_token as token from tradehq_private.course_generation_state")).rows[0].token;
  const retry = (await db.query<{ value: { lease: string } }>("select public.claim_course_generation($1) as value", [retryToken])).rows[0].value;
  const nextDoc = { ...document, slug: "monthly-generated-course", title: "Monthly draft" };
  await db.query("select public.finish_course_generation($1,$2::jsonb,'{}'::jsonb,NULL)", [retry.lease, JSON.stringify(nextDoc)]);
  assert.equal((await db.query("select * from public.published_courses")).rows.length, 1);
  assert.equal((await db.query("select * from public.course_drafts where status='draft'")).rows.length, 1);
  assert.equal((await db.query<{ value: boolean }>("select public.finish_course_generation($1,$2::jsonb,'{}'::jsonb,NULL) as value", [retry.lease, JSON.stringify(nextDoc)])).rows[0].value, false);
  await db.query("select public.request_course_generation(true)");
  const secondToken = (await db.query<{ token: string }>("select pending_token as token from tradehq_private.course_generation_state")).rows[0].token;
  const second = (await db.query<{ value: { lease: string; slot: number } }>("select public.claim_course_generation($1) as value", [secondToken])).rows[0].value;
  assert.equal(second.slot, 2);
  await db.query("select public.finish_course_generation($1,$2::jsonb,'{}'::jsonb,NULL)", [second.lease, JSON.stringify({ ...nextDoc, slug: "second-monthly-course" })]);
  assert.equal((await db.query<{ value: number | null }>("select public.request_course_generation(true) as value")).rows[0].value, null);
} finally { await db.close(); }
console.log("PASS course workflow: owner authorization, private drafts, review gate, revision conflicts, published snapshots, compact catalog, safe SEO HTML, free-quota pause, secret-free status and idempotent monthly slots.");
