/** Protected-main scheduled worker. No persistent GitHub or database credential. */
import assert from 'node:assert/strict';
import {appendFileSync} from 'node:fs';
import {buildFrontendProposal} from './agent-code-request.mjs';
import {collectOwnerIssueHistory} from './agent-owner-request-gate.mjs';
const repo='anugaweerasinghe1-del/trading101';
const endpoint='https://cbdktpjgczhthflspqjb.supabase.co/functions/v1/admin-code-queue';
const env=process.env;
async function github(path){
 const r=await fetch('https://api.github.com/repos/'+repo+path,{redirect:'error',signal:AbortSignal.timeout(15000),
  headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json'}});
 assert.equal(r.status,200,'GitHub context unavailable');return r.json();
}
async function queue(action,payload={}){
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
function context(){
 assert.equal(env.GITHUB_REPOSITORY,repo);assert.equal(env.GITHUB_REPOSITORY_ID,'1130435580');
 assert.equal(env.GITHUB_REF,'refs/heads/main');assert.equal(env.GITHUB_RUN_ATTEMPT,'1');
 assert.ok(['schedule','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME));
 assert.match(env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);assert.ok(env.GITHUB_TOKEN&&env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
}
async function main(){
 context();
 if(env.TRADEHQ_QUEUE_REPORT==='1'){
  assert.match(env.QUEUE_REQUEST_ID||'',/^[a-f0-9-]{36}$/);assert.match(env.QUEUE_HEAD_SHA||'',/^[a-f0-9]{40}$/);
  await queue('worker-validation',{id:env.QUEUE_REQUEST_ID,headSha:env.QUEUE_HEAD_SHA});
  console.log('Independent code-validation result saved in the admin activity history.');return;
 }
 // Check current protected main and shared existing issue budget before consuming a queue item.
 const main=await github('/branches/main');assert.ok(main.protected&&main.commit.sha===env.GITHUB_SHA,'Main changed');
 const history=await collectOwnerIssueHistory(github);
 if(history.some(x=>!x.pull_request&&x.user?.id===297117529&&x.title==='[TradeHQ Code Request]'
  &&Date.parse(x.created_at)>Date.now()-86400000)){
  console.log('Existing owner issue consumes the shared daily coding budget; queued work stays queued.');return;
 }
 const request=await queue('worker-claim');
 if(!request){console.log('No queued owner code request; zero model calls.');return;}
 assert.match(request.id,/^[a-f0-9-]{36}$/);assert.equal(request.status,'claimed');assert.equal(request.base_sha,env.GITHUB_SHA);
 appendFileSync(env.GITHUB_OUTPUT,'request_id='+request.id+'\n');
 let result;
 try{
  result=await buildFrontendProposal({request:request.prompt,branch:'ai/admin-'+request.id,expectedBase:env.GITHUB_SHA,
   recheck:async base=>{const current=await github('/branches/main');assert.ok(current.protected&&current.commit.sha===base,'Main changed');},
   report:async()=>{},
  });
 }catch{result={status:'failed',resultCode:'PROVIDER_OR_SCOPE_STOP'};}
 if(result.status!=='proposed')appendFileSync(env.GITHUB_OUTPUT,'head_sha=\nbase_sha=\n');
 await queue('worker-finish',{id:request.id,status:result.status,headSha:result.headSha??null,prNumber:result.prNumber??null,resultCode:result.resultCode});
 console.log('Admin code request recorded: '+result.status+'. No automatic retry.');
}
try{await main();}catch{console.error('Admin code worker stopped; inspect its durable request record. No automatic retry.');process.exitCode=1;}
