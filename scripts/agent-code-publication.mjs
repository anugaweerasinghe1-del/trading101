/** Native implementation for one authenticated owner-approved, immutable frontend proposal. */
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {inspectAiCandidate} from './agent-code-preflight.mjs';
import {publicationProposal,publicationChecks} from '../supabase/functions/_shared/codePublication.ts';
import {verifyExactPagesPreview} from './verify-exact-pages-preview.mjs';
const sha=/^[a-f0-9]{40}$/;
export async function preparePublication({claim,github,ready,dispatch,mainSha}){
 assert.equal(claim.base_sha,mainSha);assert.match(claim.request_id,/^[a-f0-9-]{36}$/);assert.match(claim.head_sha,sha);
 const path='/pulls/'+claim.pr_number,pr=await github(path);
 assert.ok(pr.state==='open'&&publicationProposal(pr,claim.request_id,claim.head_sha,mainSha,true),'Approved draft changed');
 const comparison=await github('/compare/'+mainSha+'...'+claim.head_sha);
 assert.ok(comparison.status==='ahead'&&comparison.merge_base_commit?.sha===mainSha&&comparison.files?.length>=1&&comparison.files.length<=2);
 assert.ok(comparison.files.every(f=>f.status==='modified'&&/^src\/(pages|components)\/[A-Za-z0-9_/-]+\.tsx$/.test(f.filename)&&!f.filename.includes('..')));
 const originals=[],changes=[];
 for(const f of comparison.files){
  for(const [ref,list] of [[mainSha,originals],[claim.head_sha,changes]]){
   const data=await github('/contents/'+f.filename+'?ref='+ref);
   assert.ok(data.type==='file'&&data.encoding==='base64'&&typeof data.content==='string'&&data.size<=66000);
   list.push({path:f.filename,content:Buffer.from(data.content,'base64').toString('utf8')});
  }
 }
 inspectAiCandidate(originals,changes);
 const current=await github('/branches/main'),again=await github(path);
 assert.ok(current.protected&&current.commit?.sha===mainSha&&again.state==='open'&&publicationProposal(again,claim.request_id,claim.head_sha,mainSha,true),'Publication base/head changed');
 assert.match(pr.node_id,/^[A-Za-z0-9_=-]+$/);await ready(pr.node_id);
 const branch='ai/admin-'+claim.request_id;
 // A GITHUB_TOKEN-created proposal requires deliberate native dispatch; no PAT or approval impersonation.
 await dispatch('phase3-high-check.yml',branch);await dispatch('repair-control-postgres.yml',branch);
 return {id:claim.request_id,head:claim.head_sha,base:mainSha,pr:claim.pr_number};
}
async function readProvider(url,token,fetcher){
 assert.ok(typeof token==='string'&&token.length>=20,'Existing read credential required');
 const r=await fetcher(url,{method:'GET',redirect:'error',headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
 assert.equal(r.status,200,'Provider evidence unavailable');const raw=await r.text();assert.ok(raw.length<=2000000);return JSON.parse(raw);
}
export async function publicationPreviews({head,branch,github,cloudflareToken,vercelToken,fetcher=fetch,pages=verifyExactPagesPreview}){
 const cf=await pages(head);
 const deployment=await readProvider('https://api.cloudflare.com/client/v4/accounts/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/projects/tradehq-preview/deployments/'+cf.deploymentId,cloudflareToken,fetcher);
 const d=deployment.result;
 assert.ok(deployment.success===true&&d.id===cf.deploymentId&&d.project_name==='tradehq-preview'&&d.environment==='preview'&&d.latest_stage?.status==='success'
  &&d.deployment_trigger?.metadata?.commit_hash===head&&d.deployment_trigger.metadata.branch===branch,'Exact Cloudflare preview required');
 const team='team_fjZ5ggg0P43MsYFSIHbeHAAO',project='prj_PjOhFr0eppPg8hZQhdeBwTniZWOy';
 const list=await readProvider('https://api.vercel.com/v6/deployments?teamId='+team+'&projectId='+project+'&sha='+head+'&target=preview&limit=20',vercelToken,fetcher);
 assert.ok(Array.isArray(list.deployments)&&list.deployments.length<=20);
 const candidates=list.deployments.filter(v=>v.meta?.githubCommitSha===head&&v.meta.githubCommitRef===branch&&v.state==='READY'&&(v.target===null||v.target==='preview')).sort((a,b)=>b.created-a.created);
 assert.ok(candidates.length>0,'READY Vercel preview required');const id=candidates[0].uid??candidates[0].id;assert.match(id,/^dpl_[A-Za-z0-9]+$/);
 for(let i=0;i<2;i++){
  const v=await readProvider('https://api.vercel.com/v13/deployments/'+id+'?teamId='+team+'&withGitRepoInfo=true',vercelToken,fetcher);
  assert.ok(v.id===id&&(v.projectId===project||v.project?.id===project)&&(!v.projectId||v.projectId===project)&&(!v.project||v.project.id===project)&&(!v.ownerId||v.ownerId===team)&&v.name==='trading101'&&v.source==='git'
   &&(v.target===null||v.target==='preview')&&v.readyState==='READY'&&v.meta?.githubCommitSha===head&&v.meta.githubCommitRef===branch&&v.meta.githubRepo==='trading101'&&v.meta.githubOrg==='anugaweerasinghe1-del','Exact Vercel preview identity required');
 }
 assert.ok(await publicationChecks(github,head),'Preview CI changed');
 return {cloudflare:cf.deploymentId,vercel:id,head};
}
export async function mergePublication({claim,github,queue,mainSha}){
 assert.equal(mainSha,claim.base_sha);const path='/pulls/'+claim.pr_number;
 const before=await github(path);
 assert.ok(before.state==='open'&&before.mergeable===true&&publicationProposal(before,claim.request_id,claim.head_sha,mainSha,false),'Proposal no longer mergeable');
 await queue('worker-publication-authorize',{id:claim.request_id,headSha:claim.head_sha});
 const main=await github('/branches/main'),pr=await github(path);
 assert.ok(main.protected&&main.commit?.sha===mainSha&&pr.state==='open'&&publicationProposal(pr,claim.request_id,claim.head_sha,mainSha,false),'Main or approved head changed');
 // Protected branch enforcement remains active. One attempt; later native reconciliation handles a lost response.
 const result=await github(path+'/merge','PUT',{sha:claim.head_sha,merge_method:'squash'});
 assert.ok(result.merged===true&&sha.test(result.sha||''),'Merge not confirmed');
 return {mergeSha:result.sha};
}
async function main(){
 const {github,queue,context}=await import('./admin-code-client.mjs');context({identity:!process.argv.includes('--probe')});
 const head=process.env.PUBLICATION_HEAD,base=process.env.GITHUB_SHA,id=process.env.PUBLICATION_ID;
 assert.match(head||'',sha);assert.match(id||'',/^[a-f0-9-]{36}$/);
 if(process.argv.includes('--probe')){
  for(let i=0;i<45;i++){
   const main=await github('/branches/main');assert.ok(main.protected&&main.commit.sha===base,'Main changed while waiting for publication tests');
   if(await publicationChecks(github,head))break;
   assert.ok(i<44,'Publication checks did not finish');await new Promise(r=>setTimeout(r,20000));
  }
  console.log('PUBLICATION_PREVIEWS_CONFIRMED '+JSON.stringify(await publicationPreviews({head,branch:'ai/admin-'+id,github,cloudflareToken:process.env.CLOUDFLARE_API_TOKEN,vercelToken:process.env.TRADEHQ_VERCEL_VERIFY_TOKEN})));
 }else{
  const result=await mergePublication({claim:{request_id:id,head_sha:head,base_sha:base,pr_number:Number(process.env.PUBLICATION_PR)},github,queue,mainSha:base});
  console.log('PUBLICATION_MERGE_RESPONSE '+result.mergeSha+'; independent reconciliation and production confirmation pending.');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Publication stopped. Native evidence and admin state must be reconciled; no blind merge retry.');process.exitCode=1;});
