import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {createAdminCodeQueue} from '../supabase/functions/_shared/adminCodeQueue.ts';
const owner='a1700000-1111-4111-8111-000000000001',other='b1700000-1111-4111-8111-000000000001';
const key='fixture-admin-only',sha='a'.repeat(40),head='b'.repeat(40),runId=388900001;
const db=new PGlite();
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${owner}');
 CREATE FUNCTION public.tradehq_repair_registered_owner() RETURNS uuid LANGUAGE sql AS $$SELECT '${owner}'::uuid$$;`);
await db.exec(readFileSync('supabase/migrations/20261016092040_admin_code_queue.sql','utf8'));
let userId=owner,jobName='Admin code queue worker',worker=true,rpcs=0;
let validation='success';
const rpc=async(action:string,who:string|null,data:Record<string,unknown>)=>{
 rpcs++;const r=await db.query<{data:unknown}>('SELECT public.tradehq_admin_code_queue($1,$2,$3::jsonb) AS data',[action,who,JSON.stringify(data)]);return r.rows[0].data;
};
const handler=createAdminCodeQueue({getKey:()=>key,getOwner:async()=>owner,
 getUser:async token=>token==='fixture-owner-session'?{id:userId,aud:'authenticated',email_confirmed_at:'2026-10-01'}:null,
 verifyWorker:async token=>{if(!worker||token!=='signed-fixture')throw Error();return {runId,mainSha:sha,jobName};},rpc,allow:async()=>true,
 readGitHub:async path=>path.startsWith('/pulls/')?{user:{login:'github-actions[bot]',id:41898282},state:'open',draft:true,base:{ref:'main'},head:{ref:'ai/admin-'+request.id,sha:head,repo:{id:1130435580}}}
 :{total_count:1,jobs:[{name:'Admin code independent validation',status:'completed',conclusion:validation}]},
});
async function call(data:unknown,{admin=key,token='fixture-owner-session',oidc=''}={}){
 const r=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{'content-type':'application/json','x-admin-key':admin,authorization:'Bearer '+token,'x-github-oidc':oidc},body:JSON.stringify(data)}));
 return {status:r.status,body:await r.json()};
}
assert.equal((await call({action:'list'},{admin:'wrong'})).status,401);assert.equal(rpcs,0);
userId=other;assert.equal((await call({action:'list'})).status,403);assert.equal(rpcs,0);userId=owner;
assert.equal((await call({action:'submit',requestKey:crypto.randomUUID(),prompt:'Here is my api_key=privatefixturevalue'})).status,400);
const requestKey=crypto.randomUUID(),payload={action:'submit',requestKey,prompt:'Improve the About heading spacing on narrow screens while preserving all content.'};
const submitted=await call(payload);assert.equal(submitted.status,200);const request=submitted.body.data;assert.equal(request.status,'queued');
assert.equal((await call(payload)).body.data.id,request.id,'Lost-response retry is idempotent');
assert.equal((await call({...payload,requestKey:crypto.randomUUID()})).body.code,'REQUEST_ALREADY_ACTIVE');
assert.equal((await call({action:'worker-claim'},{oidc:'wrong'})).status,401);
const race=await Promise.all([call({action:'worker-claim'},{oidc:'signed-fixture'}),call({action:'worker-claim'},{oidc:'signed-fixture'})]);
assert.equal(race.filter(x=>x.body.data!==null).length,1,'One durable claim per run');
assert.equal((await call({action:'cancel',id:request.id})).body.code,'REQUEST_NOT_QUEUED');
const completion={action:'worker-finish',id:request.id,status:'proposed',headSha:head,prNumber:165,resultCode:'PROPOSAL_CREATED'};
assert.equal((await call(completion,{oidc:'signed-fixture'})).body.data.status,'proposed');
assert.equal((await call(completion,{oidc:'signed-fixture'})).body.code,'INVALID_TRANSITION');
jobName='Admin code queue result';
assert.equal((await call({action:'worker-claim'},{oidc:'signed-fixture'})).status,400);
assert.equal((await call({action:'worker-validation',id:request.id,headSha:'c'.repeat(40)},{oidc:'signed-fixture'})).body.code,'INVALID_TRANSITION');
assert.equal((await call({action:'worker-validation',id:request.id,headSha:head},{oidc:'signed-fixture'})).body.data.status,'verified');
assert.equal((await call({...payload,requestKey:crypto.randomUUID()})).body.code,'DAILY_CODE_LIMIT');
const listed=(await call({action:'list'})).body.data;
assert.deepEqual(listed.events.map((x:{event:string})=>x.event).reverse(),['OWNER_REQUEST_QUEUED','WORKER_CLAIMED','PROPOSAL_CREATED','INDEPENDENT_CHECKS_PASSED']);
assert.ok(!JSON.stringify(listed).includes('fixture-owner-session'));assert.ok(!JSON.stringify(listed).includes(key));
for(const role of ['anon','authenticated','service_role']){
 await db.exec('SET ROLE '+role);
 await assert.rejects(db.query('SELECT * FROM tradehq_automation.code_requests'));
 await db.exec('RESET ROLE');
}
await db.exec('SET ROLE anon');await assert.rejects(db.query("SELECT public.tradehq_admin_code_queue('list',NULL,'{}')"));await db.exec('RESET ROLE');
await db.close();
console.log('ADMIN_CODE_QUEUE_PASS: real SQL lifecycle, duplicate/lost-response idempotency, concurrent claim replay denial, owner/session denial, independent native-result binding and durable event history. Provider/job identities are fixtures; no live model or GitHub write.');
