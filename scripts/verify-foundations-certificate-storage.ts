import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  FOUNDATIONS_COURSES,
  FOUNDATIONS_FINAL_CASE,
  FOUNDATIONS_VERSION,
  getFoundationsEligibility,
  type GradedFoundationsAttempt,
} from "../supabase/functions/_shared/foundationsProgramme.ts";
import { FOUNDATIONS_CERTIFICATE_TEMPLATE } from "../supabase/functions/_shared/foundationsCertificate.ts";

const db = new PGlite();
const learner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const milestones = ["first-course", "core-studies", "foundations"] as const;
const migration = readdirSync("supabase/migrations").filter(name => name.endsWith("_foundations_private_certificate_records.sql"));
assert.equal(migration.length, 1);

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    insert into auth.users values ('${learner}'), ('${other}');
  `);
  await db.exec(readFileSync("supabase/migrations/" + migration[0], "utf8"));
  const record = (account: string, assessment: string, points: number, possible = 5) =>
    db.query("select public.record_foundations_assessment($1,$2,$3,$4,$5)",
      [account, FOUNDATIONS_VERSION, assessment, points, possible]);
  const issue = (account: string, milestone: string, name: string) =>
    db.query<{ id: string; user_id: string; recipient_name: string; issued_at: Date }>(
      "select * from public.create_or_read_foundations_certificate($1,$2,$3,$4,$5)",
      [account, FOUNDATIONS_VERSION, milestone, name, FOUNDATIONS_CERTIFICATE_TEMPLATE]);

  for (const role of ["anon", "authenticated"]) {
    await db.exec("set role " + role);
    await assert.rejects(record(learner, "quotes", 5), /permission denied/);
    await assert.rejects(issue(learner, "first-course", "Fictional Learner"), /permission denied/);
    for (const table of ["foundations_assessment_items", "foundations_assessment_results", "foundations_private_certificates", "foundations_certificate_name_revisions", "foundations_certificate_verification", "foundations_learning_days"]) {
      await assert.rejects(db.query("select * from public." + table), /permission denied/);
    }
    await db.exec("reset role");
  }

  await db.exec("set role service_role");
  await assert.rejects(db.query("insert into public.foundations_assessment_items values ('foundations-v1', 'markets', '{}')"), /permission denied/);
  assert.deepEqual((await issue(learner, "first-course", "Fictional Learner")).rows, []);
  await assert.rejects(record(learner, "unknown", 5), /check constraint/);
  await assert.rejects(record(learner, "quotes", 5, 10), /check constraint/);
  await assert.rejects(record(learner, "quotes", 6), /check constraint/);
  const days = (account: string) => db.query(
    "select learning_day from public.foundations_learning_days where user_id = $1", [account]);
  await record(other, "quotes", 3);
  assert.equal((await days(other)).rows.length, 0, "Failed scores do not earn a learning day");
  const scores: GradedFoundationsAttempt[] = [];
  const assessments = FOUNDATIONS_COURSES.flatMap(course => course.checkpoints.map(id =>
    ({ assessmentId: id, points: 4, possible: 5, programmeVersion: FOUNDATIONS_VERSION })));
  assessments.push({ assessmentId: FOUNDATIONS_FINAL_CASE, points: 7, possible: 10, programmeVersion: FOUNDATIONS_VERSION });
  assessments.push({ assessmentId: FOUNDATIONS_FINAL_CASE, points: 8, possible: 10, programmeVersion: FOUNDATIONS_VERSION });

  for (const score of assessments) {
    await record(learner, score.assessmentId, score.points, score.possible);
    scores.push(score);
    const eligible = getFoundationsEligibility(scores).milestones;
    for (const milestone of milestones) {
      const result = await issue(learner, milestone, "මායා පෙරේරා");
      assert.equal(result.rows.length, Number(eligible.includes(milestone)), milestone);
    }
  }
  assert.equal((await days(learner)).rows.length, 1, "Multiple passing scores on one calendar day count once");
  await db.query(`insert into public.foundations_learning_days
    select $1, 'foundations-v1', (statement_timestamp() at time zone 'Asia/Colombo')::date - n
    from generate_series(1, 6) n`, [learner]);
  await record(learner, "quotes", 4);
  assert.equal((await days(learner)).rows.length, 7);
  assert.equal((await days(other)).rows.length, 0, "Learning days stay account scoped");
  await record(learner, "quotes", 1);
  const best = await db.query<{ points: number }>(
    "select points from public.foundations_assessment_results where user_id = $1 and assessment_id = 'quotes'", [learner]);
  assert.equal(best.rows[0].points, 4);

  const original = await issue(learner, "foundations", "Different Name");
  const repeated = await issue(learner, "foundations", "Another Name");
  assert.equal(original.rows[0].recipient_name, "මායා පෙරේරා");
  assert.equal(original.rows[0].user_id, learner);
  assert.deepEqual(repeated.rows, original.rows);
  assert.deepEqual((await issue(other, "foundations", "Other Learner")).rows, []);
  const saved = await db.query<{ evidence: { assessment_id: string }[] }>(
    "select evidence from public.foundations_private_certificates where id = $1", [original.rows[0].id]);
  assert.equal(saved.rows[0].evidence.length, 7);
  assert.ok(saved.rows[0].evidence.some(item => item.assessment_id === FOUNDATIONS_FINAL_CASE));
  assert.equal((await db.query("select * from public.foundations_private_certificates")).rows.length, 3);
  await assert.rejects(db.query("update public.foundations_private_certificates set recipient_name = 'Replacement'"), /permission denied/);

  const correct = (account: string, expected: number, name: string) => db.query<{ corrected: boolean }>(
    "select public.correct_foundations_certificate_name($1, 'foundations-v1', 'foundations', $2, $3) corrected",
    [account, expected, name]);
  const share = (account: string, revision: number, hash: string | null) => db.query<{ shared: boolean }>(
    "select public.set_foundations_certificate_verification($1, 'foundations-v1', 'foundations', $2, $3) shared",
    [account, revision, hash]);
  const verify = (hash: string) => db.query("select * from public.verify_foundations_certificate($1)", [hash]);
  const firstHash = "a".repeat(64), replacementHash = "b".repeat(64);
  assert.equal((await verify(firstHash)).rows.length, 0);
  assert.equal((await share(other, 0, firstHash)).rows[0].shared, false);
  assert.equal((await share(learner, 0, firstHash)).rows[0].shared, true);
  const proof = (await verify(firstHash)).rows[0];
  assert.deepEqual(Object.keys(proof).sort(), ["issued_on", "milestone", "programme_version"]);
  assert.equal((await correct(other, 0, "Forged Name")).rows[0].corrected, false);
  assert.equal((await correct(learner, 0, "Maya Corrected")).rows[0].corrected, true);
  assert.equal((await correct(learner, 0, "Maya Corrected")).rows[0].corrected, true);
  assert.equal((await correct(learner, 0, "Stale Name")).rows[0].corrected, false);
  const corrected = await issue(learner, "foundations", "Ignored replacement");
  assert.equal(corrected.rows[0].id, original.rows[0].id);
  assert.deepEqual(corrected.rows[0].issued_at, original.rows[0].issued_at);
  assert.equal(corrected.rows[0].recipient_name, "Maya Corrected");
  assert.equal((await verify(firstHash)).rows.length, 0, "Name correction invalidates the prior link");
  assert.equal((await share(learner, 0, replacementHash)).rows[0].shared, false, "Stale share revision");
  assert.equal((await share(learner, 1, firstHash)).rows[0].shared, true);
  assert.equal((await share(learner, 1, replacementHash)).rows[0].shared, true);
  assert.equal((await verify(firstHash)).rows.length, 0, "Rotating invalidates the prior token");
  assert.equal((await verify(replacementHash)).rows.length, 1);
  assert.equal((await share(learner, 1, null)).rows[0].shared, true);
  assert.equal((await verify(replacementHash)).rows.length, 0, "Withdrawal invalidates the replacement token");

  assert.equal((await db.query("select * from public.foundations_certificate_name_revisions")).rows.length, 1);
  const baseline = await db.query<{ recipient_name: string }>(
    "select recipient_name from public.foundations_private_certificates where id = $1", [original.rows[0].id]);
  assert.equal(baseline.rows[0].recipient_name, "මායා පෙරේරා");
  await db.exec("reset role");
  await db.query("delete from auth.users where id = $1", [learner]);
  assert.equal((await db.query("select * from public.foundations_certificate_name_revisions")).rows.length, 0);
  assert.equal((await db.query("select * from public.foundations_private_certificates")).rows.length, 0);
  assert.equal((await db.query("select * from public.foundations_learning_days")).rows.length, 0);
  assert.equal((await db.query("select * from public.foundations_assessment_results where user_id = $1", [learner])).rows.length, 0);
  console.log("FOUNDATIONS_STORAGE_PASS: disposable PostgreSQL, role denial, scoring bounds, policy parity, immutable retry, isolation, evidence and account erasure.");
  const sample = Array.from({ length: 200 }, () => crypto.randomUUID());
  await db.query("insert into auth.users select unnest($1::uuid[])", [sample]);
  await db.exec("set role service_role");
  await db.query("insert into public.foundations_assessment_results select unnest($1::uuid[]), 'foundations-v1', 'quotes', 4, 5", [sample]);
  const bulk = `select cert.id from unnest($1::uuid[]) learner
    cross join lateral public.create_or_read_foundations_certificate(
      learner, 'foundations-v1', 'first-course', 'Fictional Capacity Learner', 'trade-hq-white-teal-v1'
    ) cert`;
  const started = performance.now();
  const issuedSample = await db.query<{ id: string }>(bulk, [sample]);
  const retriedSample = await db.query<{ id: string }>(bulk, [sample]);
  assert.equal(new Set(issuedSample.rows.map(row => row.id)).size, sample.length);
  assert.deepEqual(retriedSample.rows, issuedSample.rows);
  console.log(`FOUNDATIONS_STORAGE_CAPACITY_FIXTURE: ${sample.length} isolated issuances and ${sample.length} repeat reads in ${Math.round(performance.now() - started)}ms; no hosted capacity claim.`);

} finally {
  await db.close();
}
