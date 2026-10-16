import assert from 'node:assert/strict';
const repo='anugaweerasinghe1-del/trading101';
const endpoint='https://cbdktpjgczhthflspqjb.supabase.co/functions/v1/admin-code-queue';
const env=process.env;
export async function github(path,method='GET',body){
 const r=await fetch('https://api.github.com/repos/'+repo+path,{method,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(15000),
  headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'}});
 assert.ok([200,204].includes(r.status),'GitHub context unavailable');return r.status===204?null:r.json();
}
export async function queue(action,payload={}){
 // Mint a fresh, audience-bound identity per operation. Never log the token.
 const target=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);assert.equal(target.protocol,'https:');
 assert.ok(target.hostname.endsWith('.actions.githubusercontent.com'));
 target.searchParams.set('audience','tradehq-admin-code-queue-v1');
 const auth=await fetch(target,{redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});
 assert.equal(auth.status,200,'GitHub job identity unavailable');const {value}=await auth.json();
 assert.ok(typeof value==='string'&&value.length<22000);
 const r=await fetch(endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),
  headers:{'content-type':'application/json','x-github-oidc':value},body:JSON.stringify({action,...payload})});
 const result=await r.json();assert.equal(r.status,200,'Queue operation unavailable: '+String(result.code||'UNKNOWN').slice(0,60));return result.data;
}
export function context({identity=true}={}){
 assert.equal(env.GITHUB_REPOSITORY,repo);assert.equal(env.GITHUB_REPOSITORY_ID,'1130435580');
 assert.equal(env.GITHUB_REF,'refs/heads/main');assert.equal(env.GITHUB_RUN_ATTEMPT,'1');
 assert.ok(['schedule','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME));
 assert.match(env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);assert.ok(env.GITHUB_TOKEN&&(!identity||env.ACTIONS_ID_TOKEN_REQUEST_TOKEN));
}
