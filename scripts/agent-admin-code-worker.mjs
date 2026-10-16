/** Protected-main scheduled worker. No persistent GitHub or database credential. */
import assert from 'node:assert/strict';
import {appendFileSync} from 'node:fs';
import {buildFrontendProposal} from './agent-code-request.mjs';
import {processRejectedProposal} from './agent-code-review.mjs';
import {collectOwnerIssueHistory} from './agent-owner-request-gate.mjs';
import {github,queue,context} from './admin-code-client.mjs';
import {preparePublication} from './agent-code-publication.mjs';
const env=process.env;
async function main(){
 context();
 if(env.TRADEHQ_QUEUE_REPORT==='1'){
  assert.match(env.QUEUE_REQUEST_ID||'',/^[a-f0-9-]{36}$/);assert.match(env.QUEUE_HEAD_SHA||'',/^[a-f0-9]{40}$/);
  await queue('worker-validation',{id:env.QUEUE_REQUEST_ID,headSha:env.QUEUE_HEAD_SHA});
  console.log('Independent code-validation result saved in the admin activity history.');return;
 }
 // Check current protected main and shared existing issue budget before consuming a queue item.
 const main=await github('/branches/main');assert.ok(main.protected&&main.commit.sha===env.GITHUB_SHA,'Main changed');
 const publication=await queue('worker-publication-claim');
 const dispatch=async(workflow,ref)=>github('/actions/workflows/'+workflow+'/dispatches','POST',{ref});
 if(publication?.releaseSha){
  assert.equal(publication.releaseSha,env.GITHUB_SHA);
  await dispatch('phase3-high-check.yml','main');await dispatch('repair-control-postgres.yml','main');
  console.log('Post-merge release checks requested; production confirmation remains pending.');return;
 }
 if(publication){
  const result=await preparePublication({claim:publication,github,mainSha:env.GITHUB_SHA,dispatch,ready:async nodeId=>{
   const r=await fetch('https://api.github.com/graphql',{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,'content-type':'application/json'},body:JSON.stringify({query:'mutation($id:ID!){markPullRequestReadyForReview(input:{pullRequestId:$id}){pullRequest{id isDraft}}}',variables:{id:nodeId}})});
   assert.equal(r.status,200);const data=await r.json();assert.ok(!data.errors&&data.data?.markPullRequestReadyForReview?.pullRequest?.isDraft===false);
  }});
  appendFileSync(env.GITHUB_OUTPUT,'publication_id='+result.id+'\npublication_head='+result.head+'\npublication_pr='+result.pr+'\n');
  console.log('Exact owner-approved proposal prepared for native publication checks; zero model calls.');return;
 }
 const review=await processRejectedProposal({queue,github,mainSha:env.GITHUB_SHA});
 console.log('Owner proposal review: '+review.status+'.');
 const history=await collectOwnerIssueHistory(github);
 if(history.some(x=>!x.pull_request&&x.user?.id===297117529&&x.title==='[TradeHQ Code Request]'
  &&Date.parse(x.created_at)>Date.now()-86400000)){
  console.log('Existing owner issue consumes the shared daily coding budget; queued work stays queued.');return;
 }
 const request=await queue('worker-claim');
 if(!request){console.log('No queued owner code request; zero model calls.');return;}
 assert.match(request.id,/^[a-f0-9-]{36}$/);assert.equal(request.status,'claimed');assert.equal(request.base_sha,env.GITHUB_SHA);
 assert.equal(request.learning?.version,'native-ci-memory-v1','Durable learning decision required');
 appendFileSync(env.GITHUB_OUTPUT,'request_id='+request.id+'\n');
 let result;
 try{
  result=await buildFrontendProposal({request:request.prompt,learning:request.learning,branch:'ai/admin-'+request.id,expectedBase:env.GITHUB_SHA,
   recheck:async base=>{const current=await github('/branches/main');assert.ok(current.protected&&current.commit.sha===base,'Main changed');},
   report:async()=>{},
  });
 }catch{result={status:'failed',resultCode:'PROVIDER_OR_SCOPE_STOP'};}
 if(result.status!=='proposed')appendFileSync(env.GITHUB_OUTPUT,'head_sha=\nbase_sha=\n');
 await queue('worker-finish',{id:request.id,status:result.status,headSha:result.headSha??null,prNumber:result.prNumber??null,resultCode:result.resultCode});
 console.log('Admin code request recorded: '+result.status+'. No automatic retry.');
}
try{await main();}catch{console.error('Admin code worker stopped; inspect its durable request record. No automatic retry.');process.exitCode=1;}
