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
    for (const table of ["foundations_assessment_results", "foundations_private_certificates"]) {
      await assert.rejects(db.query("select * from public." + table), /permission denied/);
    }
    await db.exec("reset role");
  }

  await db.exec("set role service_role");
  assert.deepEqual((await issue(learner, "first-course", "Fictional Learner")).rows, []);
  await assert.rejects(record(learner, "unknown", 5), /check constraint/);
  await assert.rejects(record(learner, "quotes", 5, 10), /check constraint/);
  await assert.rejects(record(learner, "quotes", 6), /check constraint/);
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

  await db.exec("reset role");
  await db.query("delete from auth.users where id = $1", [learner]);
  assert.equal((await db.query("select * from public.foundations_private_certificates")).rows.length, 0);
  assert.equal((await db.query("select * from public.foundations_assessment_results")).rows.length, 0);
  console.log("FOUNDATIONS_STORAGE_PASS: disposable PostgreSQL, role denial, scoring bounds, policy parity, immutable retry, isolation, evidence and account erasure.");
} finally {
  await db.close();
}
