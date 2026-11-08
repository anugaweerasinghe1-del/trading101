import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { convergeLearningProgress } from "../src/lib/learningCloudConvergence.ts";
import { parseCourseProgress } from "../src/lib/courseProgress.ts";
import { journeyStage, parseJourneyProgress } from "../src/lib/beginnerJourney.ts";
const state = (slug: string) => ({
  courses: parseCourseProgress(JSON.stringify({
    v: 1, tracks: { [slug]: { lessons: { intro: { status: "completed", score: 4 } } } },
    updatedAt: "2026-11-02T11:00:00Z",
  })),
  journey: parseJourneyProgress({ version: 1, lessonCompleted: true, tradeId: null,
    portfolioExplained: false, reflection: "", updatedAt: "2026-11-02T11:00:00Z" }),
});
const a = state("course-a"), b = state("course-b");
let remote = { ...state("baseline"), updated_at: "2026-11-02T10:00:00Z" };
let conflict = false, writes = 0;
const copy = () => JSON.parse(JSON.stringify(remote));
const io = {
  read: async () => copy(),
  insert: async () => { throw Error("Unexpected insert"); return false; },
  updateIfUnchanged: async (merged: typeof a, version: string) => {
    if (!conflict) {
      remote = { ...b, updated_at: "2026-11-02T11:01:00Z" };
      conflict = true;
      return false;
    }
    assert.equal(version, remote.updated_at);
    remote = { ...merged, updated_at: "2026-11-02T11:02:00Z" };
    writes++;
    return true;
  },
};
const result = await convergeLearningProgress(() => a, io, () => true);
for (const name of ["course-a", "course-b"]) {
  assert.equal(result.courses.tracks[name].lessons.intro.status, "completed");
  assert.equal(remote.courses.tracks[name].lessons.intro.status, "completed");
}
assert.equal(writes, 1);
await assert.rejects(
  convergeLearningProgress(() => state("course-c"), { ...io, updateIfUnchanged: async () => false }, () => true, 2),
  /changed on another device/,
);
assert.equal(writes, 1, "A failed write must never overwrite server data");

const newNote = "A newly written reflection belongs on this device.";
const legacyNote = "A reflection saved by an earlier client.";
const complete = {
  ...a,
  journey: {
    ...a.journey,
    tradeId: "recorded-test-order",
    portfolioExplained: true,
    completedAt: "2026-11-02T11:00:00Z",
    reflection: newNote,
  },
};
const newAccount = await convergeLearningProgress(() => complete, {
  read: async () => null,
  insert: async snapshot => {
    assert.equal(snapshot.journey.reflection, "");
    assert.equal(journeyStage(snapshot.journey), 4);
    return true;
  },
  updateIfUnchanged: async () => false,
}, () => true);
assert.equal(newAccount.journey.reflection, newNote);
const oldAccount = await convergeLearningProgress(() => complete, {
  read: async () => ({
    ...b,
    journey: { ...b.journey, reflection: legacyNote, updatedAt: "2026-11-03T11:00:00Z" },
    updated_at: "2026-11-03T11:00:00Z",
  }),
  insert: async () => false,
  updateIfUnchanged: async snapshot => {
    assert.equal(snapshot.journey.reflection, legacyNote);
    assert.equal(journeyStage(snapshot.journey), 4);
    return true;
  },
}, () => true);
assert.equal(oldAccount.journey.reflection, newNote, "Legacy account data cannot replace the current device's note");

const db = new PGlite();
try {
  const prior = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const fresh = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE SCHEMA tradehq_private;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ SELECT current_setting('request.jwt.claim.sub', true)::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    CREATE PUBLICATION supabase_realtime;
    INSERT INTO auth.users(id) VALUES ('${prior}'), ('${fresh}');
  `);
  await db.exec(readFileSync("supabase/migrations/20261101120000_private_user_learning_progress.sql", "utf8"));
  await db.query("INSERT INTO public.user_learning_progress(user_id,journey) VALUES ($1,jsonb_build_object('reflection',$2::text))", [prior, legacyNote]);
  await db.exec(readFileSync("supabase/migrations/20261108104047_keep_beginner_reflection_on_device.sql", "utf8"));
  const useAccount = async (account: string) => {
    await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [account]);
    await db.exec("SET ROLE authenticated");
  };
  await useAccount(fresh);
  await db.query("INSERT INTO public.user_learning_progress(user_id,journey) VALUES ($1,$2)", [fresh, JSON.stringify(complete.journey)]);
  const read = () => db.query<{ journey: typeof complete.journey }>("SELECT journey FROM public.user_learning_progress");
  const own = (await read()).rows;
  assert.equal(own.length, 1, "RLS still hides the other account");
  assert.equal(own[0].journey.reflection, undefined);
  assert.equal(journeyStage(parseJourneyProgress(own[0].journey)), 4);
  await db.query("UPDATE public.user_learning_progress SET journey=$1 WHERE user_id=$2", [JSON.stringify(complete.journey), fresh]);
  assert.equal((await read()).rows[0].journey.reflection, undefined, "Old app versions cannot upload new text by updating");
  await db.exec("RESET ROLE");
  await useAccount(prior);
  await db.query("UPDATE public.user_learning_progress SET journey=$1 WHERE user_id=$2", [JSON.stringify(complete.journey), prior]);
  assert.equal((await read()).rows[0].journey.reflection, legacyNote, "Old account notes are preserved exactly");
  assert.equal(journeyStage(parseJourneyProgress((await read()).rows[0].journey)), 4);
} finally {
  await db.close();
}
console.log("PASS beginner journey reflection stays on-device, completion syncs, and the database protects new and legacy records");
console.log("PASS concurrent account lesson progress: retry merges both devices and fails closed");
