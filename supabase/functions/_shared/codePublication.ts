/** Fixed repository release facts. Imported by the trusted worker as well as the endpoint. */
const repositoryId=1130435580;
const required=['TradeHQ Phase 3 tests','TradeHQ Cloudflare compatibility / Cloudflare build and SEO','TradeHQ Required validation'];
export function publicationProposal(pr:any,id:string,head:string,base:string|undefined,draft?:boolean){
 return pr.user?.id===41898282&&pr.user?.login==='github-actions[bot]'&&pr.base?.ref==='main'&&(base===undefined||pr.base?.sha===base)
  &&pr.head?.repo?.id===repositoryId&&pr.base?.repo?.id===repositoryId&&pr.head?.ref==='ai/admin-'+id&&pr.head?.sha===head
  &&(draft===undefined||pr.draft===draft);
}
export async function publicationChecks(read:(path:string)=>Promise<any>,head:string,{production=false,now=Date.now()}={}){
 const [checks,history]=await Promise.all([read('/commits/'+head+'/check-runs?per_page=100'),read('/actions/runs?head_sha='+head+'&per_page=100')]);
 if(!Array.isArray(checks.check_runs)||checks.total_count!==checks.check_runs.length||checks.total_count>100
  ||!Array.isArray(history.workflow_runs)||history.total_count!==history.workflow_runs.length||history.total_count>100)return false;
 function run(path:string,id:number){
  const r=history.workflow_runs.filter((x:any)=>x.path===path).sort((a:any,b:any)=>b.id-a.id)[0];
  return r&&r.workflow_id===id&&r.head_sha===head&&r.repository?.id===repositoryId&&r.head_repository?.id===repositoryId
   &&['push','pull_request','workflow_dispatch'].includes(r.event)&&r.run_attempt===1&&r.status==='completed'&&r.conclusion==='success'
   &&Date.parse(r.run_started_at)>=now-86400000&&Date.parse(r.updated_at)<=now+60000&&Date.parse(r.updated_at)>=Date.parse(r.run_started_at)&&Number.isSafeInteger(r.check_suite_id)?r:null;
 }
 const phase=run('.github/workflows/phase3-high-check.yml',368399831),pg=run('.github/workflows/repair-control-postgres.yml',381063243);
 if(!phase||!pg)return false;
 const names=production?[...required,'TradeHQ Release & Recovery Readiness (read only)']:required;
 for(const name of names){
  const found=checks.check_runs.filter((x:any)=>x.name===name&&x.app?.id===15368&&x.app?.slug==='github-actions'&&x.check_suite?.id===phase.check_suite_id);
  if(found.length!==1||found[0].head_sha!==head||found[0].status!=='completed'||found[0].conclusion!=='success'
   ||!Number.isFinite(Date.parse(found[0].started_at))||!Number.isFinite(Date.parse(found[0].completed_at))
   ||Date.parse(found[0].started_at)<Date.parse(phase.run_started_at)||Date.parse(found[0].completed_at)<Date.parse(found[0].started_at)||Date.parse(found[0].completed_at)>Date.parse(phase.updated_at)+1000)return false;
 }
 return true;
}
export async function reconcilePublications(options:any){
 const pending=await options.rpc('publication-pending',null,{});
 if(!Array.isArray(pending)||pending.length>10)throw Error('VALIDATION_UNAVAILABLE');
 for(const p of pending){
  const pr=await options.readGitHub('/pulls/'+p.pr_number);
  // A merge may complete after the publishing job loses its response. Never repeat it.
  const original=await options.readGitHub('/actions/runs/'+p.run_id);
  if(original.workflow_id!==380190833||original.id!==p.run_id||original.path!=='.github/workflows/tradehq-code-agent.yml'||original.head_sha!==p.base_sha||original.head_branch!=='main'||original.repository?.id!==repositoryId||original.head_repository?.id!==repositoryId)throw Error('VALIDATION_UNAVAILABLE');
  if(['merging','merged'].includes(p.state)&&pr.merged_by?.id===41898282&&pr.merged===true&&pr.state==='closed'&&publicationProposal(pr,p.request_id,p.head_sha,undefined)
   &&/^[a-f0-9]{40}$/.test(pr.merge_commit_sha||'')){
   const merged=await options.readGitHub('/commits/'+pr.merge_commit_sha);
   // Only a squash of this approved head on the unchanged approved main qualifies.
   if(merged.parents?.length!==1||merged.parents[0].sha!==p.base_sha)throw Error('PROPOSAL_NOT_VERIFIED');
   const main=await options.readGitHub('/branches/main');
   if(main.protected!==true||main.commit?.sha!==pr.merge_commit_sha){
    await options.rpc('publication-observe',null,{id:p.request_id,state:'blocked',mergeSha:pr.merge_commit_sha,code:'MAIN_CHANGED_AFTER_MERGE'});continue;
   }
   const published=await publicationChecks(options.readGitHub,pr.merge_commit_sha,{production:true});
   if(!published&&p.release_run_id&&Date.parse(p.updated_at)<Date.now()-3600000){
    await options.rpc('publication-observe',null,{id:p.request_id,state:'blocked',mergeSha:pr.merge_commit_sha,code:'RELEASE_NOT_CONFIRMED'});continue;
   }
   await options.rpc('publication-observe',null,{id:p.request_id,state:published?'published':'merged',mergeSha:pr.merge_commit_sha,code:published?'EXACT_PRODUCTION_CONFIRMED':'RELEASE_CHECKS_PENDING'});
  }else if(original.status==='completed'||Date.parse(p.lease_until)<Date.now()){
   await options.rpc('publication-observe',null,{id:p.request_id,state:'blocked',mergeSha:null,code:'MERGE_NOT_CONFIRMED'});
  }
 }
}
export async function handlePublication(input:any,job:any,owner:string|null,options:any){
 if(input.action==='approve'){
  if(!owner||Object.keys(input).sort().join('|')!=='action|headSha|id|viewId'||!/^\w{8}(?:-\w{4}){3}-\w{12}$/.test(input.id)||!/^[a-f0-9]{40}$/.test(input.headSha)||!/^\w{8}(?:-\w{4}){3}-\w{12}$/.test(input.viewId))throw Error('INVALID_REQUEST');
  const row=await options.rpc('review-request',owner,{id:input.id,headSha:input.headSha});
  const [pr,main]=await Promise.all([options.readGitHub('/pulls/'+row.pr_number),options.readGitHub('/branches/main')]);
  if(row.status!=='verified'||pr.state!=='open'||!publicationProposal(pr,input.id,input.headSha,row.base_sha,true)||main.protected!==true||main.commit?.sha!==row.base_sha)throw Error('PROPOSAL_NOT_VERIFIED');
  return options.rpc('approve-proposal',owner,{id:input.id,headSha:input.headSha,viewId:input.viewId,baseSha:row.base_sha});
 }
 if(input.action==='worker-publication-claim'){
  if(job?.jobName!=='Admin code queue worker'||Object.keys(input).length!==1)throw Error('INVALID_REQUEST');
  await reconcilePublications(options);
  const release=await options.rpc('publication-release-claim',null,{runId:job.runId,baseSha:job.mainSha});
  if(release)return {releaseSha:release.merge_sha};
  return options.rpc('publication-claim',null,{runId:job.runId,baseSha:job.mainSha});
 }
 if(input.action==='worker-publication-authorize'){
  if(job?.jobName!=='Admin code publication'||Object.keys(input).sort().join('|')!=='action|headSha|id'||!/^[a-f0-9]{40}$/.test(input.headSha)||!/^\w{8}(?:-\w{4}){3}-\w{12}$/.test(input.id))throw Error('INVALID_REQUEST');
  const p=await options.rpc('publication-get',null,{id:input.id});
  if(p.run_id!==job.runId||p.head_sha!==input.headSha||p.base_sha!==job.mainSha||p.state!=='claimed')throw Error('WORKER_BINDING');
  const jobs=await options.readGitHub('/actions/runs/'+job.runId+'/attempts/1/jobs?per_page=20');
  if(jobs.total_count>20||jobs.total_count!==jobs.jobs?.length)throw Error('VALIDATION_UNAVAILABLE');
  const probe=jobs.jobs.filter((x:any)=>x.name==='Admin code publication previews');
  if(probe.length!==1||probe[0].run_id!==job.runId||probe[0].head_sha!==p.base_sha||probe[0].status!=='completed'||probe[0].conclusion!=='success'||!await publicationChecks(options.readGitHub,p.head_sha))throw Error('VALIDATION_UNAVAILABLE');
  const pr=await options.readGitHub('/pulls/'+p.pr_number);
  if(pr.state!=='open'||!publicationProposal(pr,p.request_id,p.head_sha,p.base_sha,false))throw Error('PROPOSAL_NOT_VERIFIED');
  return options.rpc('publication-authorize',null,{id:p.request_id,headSha:p.head_sha,baseSha:job.mainSha,runId:job.runId});
 }
 throw Error('INVALID_REQUEST');
}
