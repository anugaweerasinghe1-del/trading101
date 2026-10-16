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
 await a.unsafe(readFileSync('supabase/migrations/20261016100921_native_code_learning.sql','utf8'));
await a.unsafe(readFileSync('supabase/migrations/20261016102258_code_worker_recovery.sql','utf8'));
await a.unsafe(readFileSync('supabase/migrations/20261016110754_admin_proposal_review.sql','utf8'));
await a.unsafe(readFileSync('supabase/migrations/20261016135218_admin_code_publication.sql','utf8'));
 const rpc=async(client,action,who,data)=>(await client.unsafe('SELECT public.tradehq_admin_code_queue($1,$2,$3::jsonb) AS r',[action,who,data]))[0].r;
 const item=await rpc(a,'submit',owner,{requestKey:'b1700000-1111-4111-8111-000000000001',prompt:'Improve the About heading spacing while preserving every sentence and link.'});
 await a.unsafe('BEGIN');const claimed=await rpc(a,'claim',null,{runId:1,baseSha:base});assert.equal(claimed.id,item.id);assert.equal(claimed.learning.outcomes,0);
 const pid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
 const waiting=rpc(b,'claim',null,{runId:2,baseSha:base});
 let blocked=false;const deadline=Date.now()+4000;
 while(Date.now()<deadline){if((await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid]))[0]?.wait_event_type==='Lock'){blocked=true;break;}await new Promise(r=>setTimeout(r,25));}
 assert.ok(blocked,'Independent worker must wait on the actual queue lock');
 await a.unsafe('COMMIT');assert.equal(await waiting,null);
 await b.end();b=postgres(url.href,opts);assert.equal(await rpc(b,'claim',null,{runId:1,baseSha:base}),null,'Restart/replay cannot reclaim');
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_events WHERE event='WORKER_CLAIMED'"))[0].n,1);
 assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_automation.code_learning_decisions'))[0].n,1);
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_worker_runs WHERE status='claimed'"))[0].n,1);
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_worker_runs WHERE status='idle'"))[0].n,1);
 await rpc(a,'finish',null,{id:item.id,runId:1,baseSha:base,headSha:'b'.repeat(40),prNumber:168,status:'proposed',resultCode:'PROPOSAL_CREATED',verifiedFiles:['src/pages/About.tsx']});
 await rpc(a,'validation',null,{id:item.id,runId:1,baseSha:base,headSha:'b'.repeat(40),status:'verified',nativeConclusion:'success'});
 const viewed=await rpc(a,'review-view',owner,{id:item.id,headSha:'b'.repeat(40),patchDigest:'f'.repeat(64)});
 await rpc(a,'reject-proposal',owner,{id:item.id,headSha:'b'.repeat(40),viewId:viewed.view_id});
 await a.unsafe('BEGIN');assert.equal((await rpc(a,'close-claim',null,{runId:100})).request_id,item.id);
 const closePid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
 const closeWaiting=rpc(b,'close-claim',null,{runId:101});
 let closeBlocked=false;const closeDeadline=Date.now()+4000;
 while(Date.now()<closeDeadline){if((await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[closePid]))[0]?.wait_event_type==='Lock'){closeBlocked=true;break;}await new Promise(r=>setTimeout(r,25));}
 assert.ok(closeBlocked,'Actual independent rejection workers must serialize');await a.unsafe('COMMIT');assert.equal(await closeWaiting,null);
 await rpc(a,'close-finish',null,{id:item.id,runId:100,headSha:'b'.repeat(40),closeState:'closed',closeCode:'GITHUB_CLOSED_CONFIRMED'});
 assert.equal(await rpc(b,'close-claim',null,{runId:100}),null);
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_events WHERE event='GITHUB_CLOSED_CONFIRMED'"))[0].n,1);
 console.log('ADMIN_PROPOSAL_REVIEW_POSTGRES_PASS: actual separate-session close-claim lock, one closure receipt/event and replay denial. Disposable database, no real GitHub action.');
 // Distinct-session approval and publication claims use the same real database lock.
 const publishId='d1700000-1111-4111-8111-000000000001',publishHead='c'.repeat(40);
 await a.unsafe(`INSERT INTO tradehq_automation.code_requests(id,owner_id,request_key,prompt,status,run_id,base_sha,head_sha,pr_number) VALUES($1,$2,$3,'Disposable publication concurrency fixture','verified',300,$4,$5,999)`,[publishId,owner,'e1700000-1111-4111-8111-000000000001',base,publishHead]);
 const publishView=await rpc(a,'review-view',owner,{id:publishId,headSha:publishHead,patchDigest:'e'.repeat(64)});
 const approve={id:publishId,headSha:publishHead,baseSha:base,viewId:publishView.view_id};
 await a.unsafe('BEGIN');assert.equal((await rpc(a,'approve-proposal',owner,approve)).state,'approved');
 const approveWaiting=rpc(b,'approve-proposal',owner,approve);await a.unsafe('COMMIT');assert.equal((await approveWaiting).state,'approved');
 await a.unsafe('BEGIN');assert.equal((await rpc(a,'publication-claim',null,{runId:301,baseSha:base})).request_id,publishId);
 const publicationPid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
 const publicationWaiting=rpc(b,'publication-claim',null,{runId:302,baseSha:base});
 let publicationBlocked=false;const publicationDeadline=Date.now()+4000;
 while(Date.now()<publicationDeadline){if((await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[publicationPid]))[0]?.wait_event_type==='Lock'){publicationBlocked=true;break;}await new Promise(r=>setTimeout(r,25));}
 assert.ok(publicationBlocked,'Publication workers must really serialize');await a.unsafe('COMMIT');assert.equal(await publicationWaiting,null);
 const authorization={id:publishId,headSha:publishHead,baseSha:base,runId:301};
 assert.equal((await rpc(a,'publication-authorize',null,authorization)).state,'merging');
 await assert.rejects(rpc(b,'publication-authorize',null,authorization),/WORKER_BINDING/);
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_events WHERE event='OWNER_PUBLICATION_APPROVED'"))[0].n,1);
 assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_automation.code_events WHERE event='PUBLICATION_GATES_CONFIRMED'"))[0].n,1);
 console.log('ADMIN_CODE_PUBLICATION_POSTGRES_PASS: independent-session approval idempotency and actual publication claim lock; one consumed merge authorization and one audit event. Disposable SQL only.');
 // An audit write failure rolls back the request as well, without consuming a phantom row.
 await a.unsafe("UPDATE tradehq_automation.code_requests SET status='failed',created_at=created_at-interval '25 hours';");
 await a.unsafe("CREATE FUNCTION tradehq_automation.fixture_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture audit fault'; END$$;CREATE TRIGGER fixture_audit_fault BEFORE INSERT ON tradehq_automation.code_events FOR EACH ROW EXECUTE FUNCTION tradehq_automation.fixture_audit_failure();");
 await assert.rejects(rpc(a,'submit',owner,{requestKey:'c1700000-1111-4111-8111-000000000001',prompt:'Preserve all content and improve the existing heading layout.'}),/fixture audit fault/);
 assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_automation.code_requests'))[0].n,2);
 console.log('ADMIN_CODE_QUEUE_POSTGRES_PASS: actual independent worker lock wait, one committed claim/event, reconnect replay denial and atomic request/audit rollback. Disposable database; no provider call.');
}finally{
 await Promise.allSettled([a,b,observer].filter(Boolean).map(async client=>{await client.unsafe('ROLLBACK');await client.end({timeout:1});}));
 if(created)await admin.unsafe('DROP DATABASE tradehq_code_queue_test');await admin.end({timeout:1});
}
