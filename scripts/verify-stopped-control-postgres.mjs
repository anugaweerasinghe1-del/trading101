/** New fixed-name, empty database on the already guarded disposable PostgreSQL 17 service. */
import assert from 'node:assert/strict';
import postgres from 'postgres';
import { disposableControlUrl } from './verify-repair-control-postgres.mjs';
import { verifyStoppedControlDatabase } from './verify-stopped-control-installation.mjs';
const original=disposableControlUrl(process.env),opts={max:1,prepare:false,connect_timeout:5,idle_timeout:0,onnotice:()=>{}};
const admin=postgres(original,opts);let created=false,a,b,observer;
try {
  const identity=(await admin.unsafe("SELECT current_database() AS db,current_user AS owner,current_setting('server_version_num')::int AS version"))[0];
  assert.ok(identity.db==='tradehq_control_test' && identity.owner==='tradehq_test' && identity.version>=170000 && identity.version<180000);
  assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM pg_database WHERE datname='tradehq_owner_test'"))[0].n,0,'Refuse an existing database');
  await admin.unsafe('CREATE DATABASE tradehq_owner_test');created=true;
  const url=new URL(original);url.pathname='/tradehq_owner_test';
  a=postgres(url.href,opts);b=postgres(url.href,opts);observer=postgres(url.href,opts);
  for(const client of [a,b,observer])await client.unsafe("SET statement_timeout='10s'; SET lock_timeout='8s';");
  await verifyStoppedControlDatabase({exec:sql=>a.unsafe(sql),query:async(sql,params)=>({rows:await a.unsafe(sql,params)})});
  const owner='c1700000-1111-4111-8111-000000000001';
  await a.unsafe('SELECT tradehq_repair_control.set_stop(false)');
  await a.unsafe('BEGIN');await a.unsafe('SET LOCAL ROLE service_role');
  assert.equal((await a.unsafe('SELECT public.tradehq_repair_owner_stop($1::uuid) AS r',[owner]))[0].r.stopped,true);
  const pid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
  const waiting=b.unsafe('SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,clock_timestamp(),$6) AS r',
    ['repair-v1-'+'b'.repeat(24),'manual','LAYOUT_OVERFLOW','a'.repeat(40),'b'.repeat(64),'LOW'])
    .then(rows=>({rows}),error=>({error}));
  let blocked=false;const deadline=Date.now()+4000;
  while(Date.now()<deadline) {
    if((await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid]))[0]?.wait_event_type==='Lock') {blocked=true;break;}
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert.equal(blocked,true,'An independent candidate claim must wait on the endpoint stop lock');
  await a.unsafe('COMMIT');const result=await waiting;
  assert.equal(result.error,undefined,'Independent claim failed before the expected stop denial');
  assert.equal(result.rows[0].r.reason,'STOPPED');
  console.log('OWNER_STOP_POSTGRES_PASS: service-only endpoint stop holds the actual policy lock; an independent concurrent claim waits and is refused after stop commits.');
} finally {
  await Promise.allSettled([a,b,observer].filter(Boolean).map(async client=>{await client.unsafe('ROLLBACK');await client.end({timeout:1});}));
  if(created)await admin.unsafe('DROP DATABASE tradehq_owner_test');
  await admin.end({timeout:1});
}
