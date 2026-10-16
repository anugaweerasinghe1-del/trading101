/** Fixed empty disposable PostgreSQL database only; never a production URL. */
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {readFileSync} from 'node:fs';
import {disposableControlUrl} from './verify-repair-control-postgres.mjs';
const original=disposableControlUrl(process.env),opts={max:1,prepare:false,connect_timeout:5,idle_timeout:0,onnotice:()=>{}};
const admin=postgres(original,opts);let created=false,a,b,observer;
const owner='a1700000-1111-4111-8111-000000000001',base='a'.repeat(40);
try{
 const identity=(await admin.unsafe("SELECT current_database() AS db,current_user AS owner,current_setting('server_version_num')::int AS version"))[0];
 assert.ok(identity.db==='tradehq_control_test'&&identity.owner==='tradehq_test'&&identity.version>=170000&&identity.version<180000);
 assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM pg_database WHERE datname='tradehq_code_queue_test'"))[0].n,0);
 await admin.unsafe('CREATE DATABASE tradehq_code_queue_test');created=true;
 const url=new URL(original);url.pathname='/tradehq_code_queue_test';
 a=postgres(url.href,opts);b=postgres(url.href,opts);observer=postgres(url.href,opts);
 for(const client of[a,b,observer])await client.unsafe("SET statement_timeout='10s';SET lock_timeout='8s';");
 await a.unsafe(`CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${owner}');
 CREATE FUNCTION public.tradehq_repair_registered_owner() RETURNS uuid LANGUAGE sql AS $$SELECT '${owner}'::uuid$$;`);
 await a.unsafe(readFileSync('supabase/migrations/20261016092040_admin_code_queue.sql','utf8'));
 const rpc=async(client,action,who,data)=>(await client.unsafe('SELECT public.tradehq_admin_code_queue($1,$2,$3::jsonb) AS r',[action,who,JSON.stringify(data)]))[0].r;
 const item=await rpc(a,'submit',owner,{requestKey:'b1700000-1111-4111-8111-000000000001',prompt:'Improve the About heading spacing while preserving every sentence and link.'});
 await a.unsafe('BEGIN');const claimed=await rpc(a,'claim',null,{runId:1,baseSha:base});assert.equal(claimed.id,item.id);
 const pid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
 const waiting=rpc(b,'claim',null,{runId:2,baseSha:base});
 let blocked=false;const deadline=Date.now()+4000;
 while(Date.now()<deadline){if((await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid]))[0]?.wait_event_type==='Lock'){blocked=true;break;}await new Promise(r=>setTimeout(r,25));}
 assert.ok(blocked,'Independent worker must wait on the actual queue lock');
 await a.unsafe('COMMIT');assert.equal(await waiting,null);
 await b.end();b=postgres(url.href,opts);assert.equal(await rpc(b,'claim',null,{runId:1,baseSha:base}),null,'Restart/replay cannot reclaim');
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_events WHERE event='WORKER_CLAIMED'"))[0].n,1);
 // An audit write failure rolls back the request as well, without consuming a phantom row.
 await a.unsafe("UPDATE tradehq_automation.code_requests SET status='failed',created_at=created_at-interval '25 hours';");
 await a.unsafe("CREATE FUNCTION tradehq_automation.fixture_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture audit fault'; END$$;CREATE TRIGGER fixture_audit_fault BEFORE INSERT ON tradehq_automation.code_events FOR EACH ROW EXECUTE FUNCTION tradehq_automation.fixture_audit_failure();");
 await assert.rejects(rpc(a,'submit',owner,{requestKey:'c1700000-1111-4111-8111-000000000001',prompt:'Preserve all content and improve the existing heading layout.'}),/fixture audit fault/);
 assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_automation.code_requests'))[0].n,1);
 console.log('ADMIN_CODE_QUEUE_POSTGRES_PASS: actual independent worker lock wait, one committed claim/event, reconnect replay denial and atomic request/audit rollback. Disposable database; no provider call.');
}finally{
 await Promise.allSettled([a,b,observer].filter(Boolean).map(async client=>{await client.unsafe('ROLLBACK');await client.end({timeout:1});}));
 if(created)await admin.unsafe('DROP DATABASE tradehq_code_queue_test');await admin.end({timeout:1});
}
