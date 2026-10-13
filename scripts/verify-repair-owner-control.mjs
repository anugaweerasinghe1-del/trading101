import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRepairOwnerControl } from '../supabase/functions/_shared/repairOwnerControl.ts';
const owner='c1700000-1111-4111-8111-000000000001',other='c1700000-1111-4111-8111-000000000002';
const key='disposable-owner-master-key-0123456789',token='disposable-session-token-0123456789';
const req=(action='status',extra={},admin=key,bearer=token)=>new Request('https://fixture.invalid/',{
  method:'POST',headers:{'x-admin-key':admin,authorization:'Bearer '+bearer},body:JSON.stringify({action,...extra})});
function fixture(changes={}) {
  const calls={auth:0,status:0,stop:0,limit:0};
  const options={getMode:()=> 'owner-stop-only-v1',getOwnerId:()=>owner,getAdminKey:()=>key,
    getUser:async value=>{calls.auth++;assert.equal(value,token);return {data:{user:{id:owner,aud:'authenticated',is_anonymous:false,email_confirmed_at:'2026-10-13T00:00:00Z'}}};},
    status:async value=>{calls.status++;assert.equal(value,owner);return {stopped:false,generation:2,activeCandidates:1};},
    stop:async value=>{calls.stop++;assert.equal(value,owner);return {stopped:true,generation:3,activeCandidates:0};},
    allowStatus:async value=>{calls.limit++;assert.equal(value,owner);return true;},...changes};
  return {calls,handler:createRepairOwnerControl(options)};
}
const happy=fixture(); const status=await happy.handler(req());assert.equal(status.status,200);
const data=await status.json();assert.equal(data.stopped,false);assert.equal(data.activeCandidates,1);
assert.ok(Object.values(data.authorization).every(value=>value===false));
assert.equal(status.headers.get('cache-control'),'no-store');assert.equal(status.headers.get('access-control-allow-origin'),'https://www.thetradehq.com');
const stopped=await happy.handler(req('stop'));assert.equal(stopped.status,200);assert.equal((await stopped.json()).code,'DURABLE_STOP_CONFIRMED');
assert.deepEqual(happy.calls,{auth:2,status:1,stop:1,limit:1});
for(const mode of [undefined,'disabled','low-risk-draft-only']) {
  const f=fixture({getMode:()=>mode});assert.equal((await f.handler(req('stop'))).status,503);assert.equal(f.calls.auth,0);assert.equal(f.calls.stop,0);
}
for(const config of [{getOwnerId:()=>undefined},{getOwnerId:()=> 'person@example.invalid'},{getAdminKey:()=>undefined}]) {
  const f=fixture(config);assert.equal((await f.handler(req())).status,503);assert.equal(f.calls.auth,0);
}
const wrong=fixture();assert.equal((await wrong.handler(req('stop',{},'wrong'))).status,401);assert.equal(wrong.calls.auth,0);
assert.equal((await wrong.handler(req('stop',{},key,'tiny'))).status,401);
for(const user of [{id:other,aud:'authenticated',email_confirmed_at:'yes'},
  {id:owner,aud:'anon',email_confirmed_at:'yes'},{id:owner,aud:'authenticated',is_anonymous:true,email_confirmed_at:'yes'},
  {id:owner,aud:'authenticated'},null]) {
  const f=fixture({getUser:async()=>({data:{user}})});assert.equal((await f.handler(req('stop'))).status,401);assert.equal(f.calls.stop,0);
}
const invalidAuth=fixture({getUser:async()=>({data:{user:{id:owner,aud:'authenticated',email_confirmed_at:'yes'}},error:Error('private-sentinel')})});
assert.equal((await invalidAuth.handler(req('stop'))).status,401);assert.equal(invalidAuth.calls.stop,0);
for(const action of ['resume','approve','reset','merge','deploy']) {
  const f=fixture();assert.equal((await f.handler(req(action))).status,400);assert.equal(f.calls.auth,0);assert.equal(f.calls.stop,0);
}
for(const extra of [{ownerId:other},{stopped:false},{signature:'fake'},{x:'x'.repeat(200)}]) {
  const f=fixture();assert.equal((await f.handler(req('stop',extra))).status,400);assert.equal(f.calls.auth,0);
}
const noLimit=fixture({allowStatus:async()=>{throw Error('private-sentinel');}});
assert.equal((await noLimit.handler(req('status'))).status,503);assert.equal(noLimit.calls.status,0);
assert.equal((await noLimit.handler(req('stop'))).status,200);assert.equal(noLimit.calls.stop,1,'Emergency stop does not depend on the unavailable limiter');
const spent=fixture({allowStatus:async()=>false});assert.equal((await spent.handler(req())).status,429);assert.equal(spent.calls.status,0);
assert.equal((await spent.handler(req('stop'))).status,200);
for(const state of [null,{stopped:true,generation:1},{stopped:false,generation:2,activeCandidates:0},
  {stopped:true,generation:2,activeCandidates:1},{stopped:true,generation:-1,activeCandidates:0},
  {stopped:true,generation:Number.MAX_SAFE_INTEGER+1,activeCandidates:0},
  {stopped:true,generation:2,activeCandidates:0,ownerId:owner}]) {
  const f=fixture({stop:async()=>state});const r=await f.handler(req('stop'));assert.equal(r.status,503);assert.equal((await r.json()).stopConfirmed,false);
}
const uncertain=fixture({stop:async()=>{throw Error('private-sentinel');}});const lost=await uncertain.handler(req('stop'));
assert.equal(lost.status,503);assert.ok(!(await lost.text()).includes('private-sentinel'));
const source=readFileSync('supabase/functions/repair-owner-control/index.ts','utf8');
assert.match(source,/server\.auth\.getUser\(token\)/);assert.doesNotMatch(source,/getSession|\.from\(|console\.|getClaims/);
assert.match(source,/tradehq_repair_owner_stop/);assert.match(source,/TRADEHQ_REPAIR_OWNER_ID/);
console.log('OWNER_CONTROL_HTTP_PASS: server owner/session + independent admin key, exact stop/status actions, default pause, uncertain stop denial, bounded body, private output and emergency stop during status-budget outage. Isolated credentials, no production requests.');
