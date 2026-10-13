import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { pathToFileURL } from 'node:url';
import { generateStoppedControlInstallation } from './agent-stopped-control-installation.mjs';
const owner='c1700000-1111-4111-8111-000000000001',other='c1700000-1111-4111-8111-000000000002';
const sql=generateStoppedControlInstallation(owner);
assert.doesNotMatch(sql,/tradehq\.offline_control_prototype|explicit-local-test/);
assert.throws(()=>generateStoppedControlInstallation('person@example.invalid'));
assert.throws(()=>generateStoppedControlInstallation(owner+"';DROP SCHEMA public;--"));
export async function verifyStoppedControlDatabase(db) {
await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email_confirmed_at timestamptz,is_anonymous boolean);
 INSERT INTO auth.users VALUES('${owner}',clock_timestamp(),false),('${other}',NULL,false);`);
async function installationFails(statement) {
  await assert.rejects(db.exec(statement));await db.exec('ROLLBACK');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_namespace WHERE nspname='tradehq_repair_control'")).rows[0].n,0);
}
await installationFails(sql);
await db.exec("SET tradehq.repair_control_install='owner-approved-stopped-v1'");
await installationFails(generateStoppedControlInstallation(other));
await db.exec(sql);
async function status(role,selected=owner) {
  await db.exec('SET ROLE '+role);
  try { return (await db.query('SELECT public.tradehq_repair_owner_status($1::uuid) AS r',[selected])).rows[0].r; }
  finally { await db.exec('RESET ROLE'); }
}
assert.deepEqual(await status('service_role'),{stopped:true,generation:0,activeCandidates:0});
await assert.rejects(()=>status('service_role',other),/Registered owner required/);
for(const role of ['anon','authenticated']) {
  await assert.rejects(()=>status(role),/permission denied/);
  await db.exec('SET ROLE '+role);await assert.rejects(db.query('SELECT public.tradehq_repair_owner_stop($1::uuid)',[owner]),/permission denied/);await db.exec('RESET ROLE');
  await db.exec('SET ROLE '+role);await assert.rejects(db.query('SELECT public.tradehq_repair_registered_owner()'),/permission denied/);await db.exec('RESET ROLE');
}
await db.exec('SET ROLE service_role');
assert.equal((await db.query('SELECT public.tradehq_repair_registered_owner() AS id')).rows[0].id,owner);
await db.exec('RESET ROLE');
for(const role of ['anon','authenticated','service_role']) {
  await db.exec('SET ROLE '+role);
  await assert.rejects(db.query('SELECT * FROM tradehq_repair_control.registered_owner'),/permission denied/);
  await assert.rejects(db.query('SELECT tradehq_repair_control.set_stop(false)'),/permission denied/);
  await assert.rejects(db.query('SELECT * FROM tradehq_repair_control.approval_receipts'),/permission denied/);
  await db.exec('RESET ROLE');
}
// Fixture DB owner models a subsequently authorized active candidate. The new service
// role endpoint itself has no resume/claim/approval permission.
await db.query('SELECT tradehq_repair_control.set_stop(false)');
const id='repair-v1-'+'a'.repeat(24),base='a'.repeat(40),digest='b'.repeat(64);
assert.equal((await db.query('SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,clock_timestamp(),$6) AS r',
 [id,'browser','HEADING_READABILITY',base,digest,'LOW'])).rows[0].r.reason,'CLAIMED');
assert.equal((await status('service_role')).activeCandidates,1);
await db.exec('SET ROLE service_role');
const stop=async()=> (await db.query('SELECT public.tradehq_repair_owner_stop($1::uuid) AS r',[owner])).rows[0].r;
assert.deepEqual(await stop(),{stopped:true,generation:2,activeCandidates:0});
assert.deepEqual(await stop(),{stopped:true,generation:2,activeCandidates:0},'A repeated/lost-response stop is idempotent');
await db.exec('RESET ROLE');
assert.equal((await db.query('SELECT attempts FROM tradehq_repair_control.candidates')).rows[0].attempts,1);
assert.equal((await db.query('SELECT count(*)::int AS n FROM tradehq_repair_control.policy_log')).rows[0].n,3);
// A failure writing the existing durable audit rolls back the entire stop transaction.
await db.query('SELECT tradehq_repair_control.set_stop(false)');
await db.exec(`CREATE FUNCTION tradehq_repair_control.fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture-audit-failure'; END $$;
 CREATE TRIGGER fail_audit BEFORE INSERT OR UPDATE ON tradehq_repair_control.audit FOR EACH ROW EXECUTE FUNCTION tradehq_repair_control.fail_audit();`);
await db.exec('SET ROLE service_role');await assert.rejects(stop(),/fixture-audit-failure/);await db.exec('RESET ROLE');
assert.deepEqual(await status('service_role'),{stopped:false,generation:3,activeCandidates:0});
await db.exec('DROP TRIGGER fail_audit ON tradehq_repair_control.audit');
await db.exec('SET ROLE service_role');assert.equal((await stop()).stopped,true);await db.exec('RESET ROLE');
console.log('STOPPED_INSTALLATION_SQL_PASS: approved-context/confirmed-account guards, rollback on invalid registration, stopped default, private app-role denial, service stop-only access, candidate invalidation, repeated-stop idempotency, preserved attempt history and atomic audit failure. Disposable SQL only.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const db=new PGlite();
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    await verifyStoppedControlDatabase(db);
  } finally { await db.close(); }
}
