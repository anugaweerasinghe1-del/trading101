import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  TROPHY_CHALLENGES, TROPHY_CHALLENGE_VERSION, publicTrophyChallenge,
  gradeTrophyChallenge, trophyChallenge,
} from "../supabase/functions/_shared/trophyChallengeBank.ts";

assert.equal(TROPHY_CHALLENGES.length,10);
assert.equal(new Set(TROPHY_CHALLENGES.map(x=>x.id)).size,10);
const ids=new Set<string>();
for (const exercise of TROPHY_CHALLENGES) {
  ids.add(exercise.id);
  assert.ok(exercise.detail.length>40 && exercise.detail.length<600);
  assert.ok(exercise.questions.length>=1 && exercise.questions.length<=10);
  for (const item of exercise.questions) {
    assert.ok(item.prompt.length>25);
    assert.equal(item.options.length,3);
    assert.equal(new Set(item.options).size,3);
    assert.ok(Number.isInteger(item.correct) && item.correct>=0 && item.correct<3);
    assert.ok(item.explanation.length>20);
  }
  const publicCopy=publicTrophyChallenge(exercise);
  assert.ok(!JSON.stringify(publicCopy).includes('"correct"'),"Never include answer keys in the public challenge payload");
  assert.ok(!JSON.stringify(publicCopy).includes('"explanation"'),"Explanation sent only after scoring");
  const correct=exercise.questions.map(q=>q.correct);
  const result=gradeTrophyChallenge(exercise,correct);
  assert.ok(result);
  assert.equal(result!.points,correct.length);
  assert.equal(result!.possible,correct.length);
  assert.equal(result!.passed, exercise.id!=="second-look-initial");
  assert.equal(gradeTrophyChallenge(exercise,correct.slice(1)),null);
  assert.equal(gradeTrophyChallenge(exercise,[...correct.slice(0,-1),99]),null);
  if (exercise.id==="second-look-initial") {
    const missed=gradeTrophyChallenge(exercise,[(correct[0]+1)%3]);
    assert.ok(missed?.passed,"A recorded initial miss enables the different follow-up only");
  }
}
assert.equal(trophyChallenge("no-such-case"),null);
assert.equal(trophyChallenge("__proto__"),null);
assert.ok(TROPHY_CHALLENGE_VERSION.includes("v1"));
for(const id of ["exit-planning","fees-and-spreads","allocation-exposure","arena-first-order",
  "arena-size-matters","arena-plan-under-pressure","arena-pause","arena-decision-review",
  "second-look-initial","second-look-followup"])assert.ok(ids.has(id));

const db=new PGlite();
const a="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", b="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key,confirmed_at timestamptz);
    create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,username text unique,is_public boolean not null default false);
    insert into auth.users values ('${a}',now()),('${b}',now());
    insert into public.profiles values ('${a}','verified-learner',true),('${b}','private-learner',false);
    grant select, update on public.profiles, auth.users to service_role;
    grant usage on schema auth to service_role;`);
  await db.exec(readFileSync("supabase/migrations/20261108110000_verified_trophy_evidence_and_sharing.sql","utf8"));
  for(const role of ["anon","authenticated"]) {
    await db.exec("set role "+role);
    await assert.rejects(db.query("select * from public.list_verified_trophy_flairs_v1()"),/permission denied/);
    await db.exec("reset role");
  }
  for(const role of ["anon","authenticated"]) {
    await db.exec("set role "+role);
    for(const table of ["trophy_activity_v1","trophy_awards_v1","trophy_share_v1","trophy_attempt_v1"]) {
      await assert.rejects(db.query("select * from public."+table),/permission denied/);
    }
    await assert.rejects(db.query(`insert into public.trophy_awards_v1(user_id,trophy_id) values ('${a}','first-light')`),/permission denied/);
    await db.exec("reset role");
  }
  await db.exec("set role service_role");
  const attempt="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  await db.query("insert into public.trophy_attempt_v1(user_id,challenge_id,attempt_id,evidence_version,issued_at,expires_at) values ($1,'exit-planning',$2,$3,now(),now()+interval '15 minutes')",[a,attempt,TROPHY_CHALLENGE_VERSION]);
  const consume=() => db.query("update public.trophy_attempt_v1 set consumed_at=now() where user_id=$1 and attempt_id=$2 and consumed_at is null and expires_at>now() returning attempt_id",[a,attempt]);
  assert.equal((await consume()).rows.length,1,"First account-bound claim succeeds");
  assert.equal((await consume()).rows.length,0,"A replay cannot consume the attempt twice");
  assert.equal((await db.query("select * from public.trophy_attempt_v1 where user_id=$1",[b])).rows.length,0,"No cross-account attempt disclosure");
  await db.query("update public.trophy_attempt_v1 set attempt_id=$2,consumed_at=null where user_id=$1",[a,"dddddddd-dddd-4ddd-8ddd-dddddddddddd"]);
  assert.equal((await consume()).rows.length,0,"Superseded attempt cannot be replayed");
    await db.query("insert into public.trophy_activity_v1(user_id,source,source_key,programme_version,result,points,possible) values ($1,'challenge','exit-planning',$2,'pass',3,3)",[a,TROPHY_CHALLENGE_VERSION]);
  await assert.rejects(db.query("insert into public.trophy_activity_v1(user_id,source,source_key,programme_version,result,points,possible) values ($1,'daily','practice-01','daily:v1','pass',11,10)",[a]),/check constraint/);
  await assert.rejects(db.query("insert into public.trophy_awards_v1(user_id,trophy_id) values ($1,'fake-trophy')",[a]),/check constraint/);
  await db.query("insert into public.trophy_awards_v1(user_id,trophy_id) values ($1,'exit-planner') on conflict do nothing",[a]);
  await db.query("insert into public.trophy_awards_v1(user_id,trophy_id) values ($1,'exit-planner') on conflict do nothing",[a]);
  const earned=await db.query<{trophy_id:string}>("select trophy_id from public.trophy_awards_v1 where user_id=$1",[a]);
  assert.deepEqual(earned.rows.map(x=>x.trophy_id),["exit-planner"],"Durable issuance is idempotent");
  await db.query("insert into public.trophy_share_v1(user_id) values ($1)",[a]);
  const initial=await db.query<{enabled:boolean;flair:string|null;pins:string[]}>("select enabled,flair,pins from public.trophy_share_v1 where user_id=$1",[a]);
  assert.equal(initial.rows[0].enabled,false,"Private by default");
  assert.equal(initial.rows[0].flair,null);
  await assert.rejects(db.query("update public.trophy_share_v1 set pins=array['one'] where user_id=$1",[a]),/check constraint/);
  await assert.rejects(db.query("update public.trophy_share_v1 set enabled=true,pins=array['a','b','c','d'] where user_id=$1",[a]),/check constraint/);
  await db.query("update public.trophy_share_v1 set enabled=true,flair='exit-planner',pins=array['exit-planner'] where user_id=$1",[a]);
  const publicChoice=await db.query<{enabled:boolean}>("select enabled from public.trophy_share_v1 where user_id=$1",[a]);
  const visible=await db.query<{username:string;trophy_id:string}>("select * from public.list_verified_trophy_flairs_v1()");
  assert.deepEqual(visible.rows,[{username:"verified-learner",trophy_id:"exit-planner"}],
    "Only separately opted-in confirmed public account shows a genuinely earned flair");
  await db.query("update public.profiles set is_public=false where id=$1",[a]);
  assert.equal((await db.query("select * from public.list_verified_trophy_flairs_v1()")).rows.length,0,
    "Profile privacy revokes flair immediately");
  await db.query("update public.profiles set is_public=true where id=$1",[a]);
  await db.query("update auth.users set confirmed_at=null where id=$1",[a]);
  assert.equal((await db.query("select * from public.list_verified_trophy_flairs_v1()")).rows.length,0,
    "An unconfirmed account cannot expose trophies despite its public flag");
  await db.query("update auth.users set confirmed_at=now() where id=$1",[a]);
  assert.equal(publicChoice.rows[0].enabled,true);
  await db.query("update public.trophy_share_v1 set enabled=false,flair=null,pins='{}'::text[] where user_id=$1",[a]);
  const withdrawn=await db.query<{enabled:boolean;flair:string|null;pins:string[]}>("select enabled,flair,pins from public.trophy_share_v1 where user_id=$1",[a]);
  assert.equal(withdrawn.rows[0].enabled,false);
  assert.equal(withdrawn.rows[0].flair,null);
  assert.equal((await db.query("select * from public.list_verified_trophy_flairs_v1()")).rows.length,0,
    "Revoking separate trophy permission immediately removes leaderboard flair");
  assert.deepEqual(withdrawn.rows[0].pins,[]);
  assert.equal((await db.query("select * from public.trophy_awards_v1 where user_id=$1",[b])).rows.length,0,"Other accounts cannot inherit awards");
  await db.exec("reset role");
  await db.query("delete from auth.users where id=$1",[a]);
  for(const table of ["trophy_activity_v1","trophy_awards_v1","trophy_share_v1","trophy_attempt_v1"])
    assert.equal((await db.query("select * from public."+table+" where user_id=$1",[a])).rows.length,0,"Account erasure cascades");
}finally{await db.close();}
const backend=readFileSync("supabase/functions/trophy-evidence/index.ts","utf8");
assert.match(backend,/getUser\(match\[1\]\)/);
assert.match(backend,/confirmed_at/);
assert.match(backend,/\.eq\("is_public"|profile\.is_public/);
assert.match(backend,/pref\?\.enabled/);
assert.match(backend,/award_not_earned/);
assert.match(backend,/ignoreDuplicates:true/);
assert.doesNotMatch(backend,/localStorage|sessionStorage/);
console.log("TROPHY_EVIDENCE_PASS: ten original case banks, safe scoring, privacy grants, durable idempotency, consent withdrawal, erasure and isolation.");
