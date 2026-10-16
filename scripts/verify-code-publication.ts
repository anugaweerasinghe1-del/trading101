import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import YAML from 'yaml';
import {createAdminCodeQueue} from '../supabase/functions/_shared/adminCodeQueue.ts';
import {preparePublication,mergePublication,publicationPreviews} from './agent-code-publication.mjs';
import {publicationChecks} from '../supabase/functions/_shared/codePublication.ts';
const base='a'.repeat(40),head='b'.repeat(40),merged='c'.repeat(40),id='a1700000-1111-4111-8111-000000000009',owner='a1700000-1111-4111-8111-000000000001';
const db=new PGlite();
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${owner}');CREATE FUNCTION public.tradehq_repair_registered_owner() RETURNS uuid LANGUAGE sql AS $$SELECT '${owner}'::uuid$$;`);
for(const file of ['20261016092040_admin_code_queue','20261016100921_native_code_learning','20261016102258_code_worker_recovery','20261016110754_admin_proposal_review','20261016135218_admin_code_publication'])await db.exec(readFileSync('supabase/migrations/'+file+'.sql','utf8'));
await db.query(`INSERT INTO tradehq_automation.code_requests(id,owner_id,request_key,prompt,status,run_id,base_sha,head_sha,pr_number) VALUES($1,$2,$3,'Disposable approved publication fixture','verified',1,$4,$5,999)`,[id,owner,crypto.randomUUID(),base,head]);
const rpc=async(action:string,who:string|null,data:unknown)=>(await db.query<{r:any}>('SELECT public.tradehq_admin_code_queue($1,$2,$3::jsonb) AS r',[action,who,JSON.stringify(data)])).rows[0].r;
let current=base,prHead=head,prDraft=true,prMerged=false,job='Admin code queue worker',runId=100,probeSuccess=true,nativeStatus='in_progress',production=false,untrusted=false;
const date=new Date(Date.now()-1000).toISOString();
const read=async(path:string):Promise<any>=>{
 if(path==='/branches/main')return {protected:true,commit:{sha:current}};
 if(path==='/pulls/999')return {node_id:'PR_fixture',changed_files:1,mergeable:true,state:prMerged?'closed':'open',draft:prDraft,merged:prMerged,merged_by:{id:41898282},merge_commit_sha:prMerged?merged:null,user:{id:41898282,login:'github-actions[bot]'},head:{sha:prHead,ref:'ai/admin-'+id,repo:{id:1130435580}},base:{ref:'main',sha:prMerged?merged:base,repo:{id:1130435580}}};
 if(path.includes('/files?'))return [{filename:'src/pages/About.tsx',status:'modified',patch:'@@ -1 +1 @@\n-old\n+new',additions:1,deletions:1}];
 if(path.startsWith('/compare/'))return {status:'ahead',merge_base_commit:{sha:base},files:[{filename:'src/pages/About.tsx',status:'modified'}]};
 if(path.startsWith('/contents/'))return {type:'file',encoding:'base64',size:200,content:Buffer.from('export default function About() {\n return <main>\n <h1 className="'+(path.endsWith(head)?'mb-3':'mb-4')+'">About this educational paper trading simulator</h1>\n </main>;\n}\n').toString('base64')};
 if(path==='/commits/'+merged)return {sha:merged,parents:[{sha:base}]};
 if(path==='/actions/runs/100')return {id:100,workflow_id:380190833,path:'.github/workflows/tradehq-code-agent.yml',head_sha:base,head_branch:'main',repository:{id:1130435580},head_repository:{id:1130435580},status:nativeStatus};
 if(path.includes('/attempts/1/jobs'))return {total_count:1,jobs:[{name:'Admin code publication previews',run_id:100,head_sha:base,status:'completed',conclusion:probeSuccess?'success':'failure'}]};
 const target=path.includes(merged)?merged:head;
 if(path.startsWith('/actions/runs?'))return {total_count:2,workflow_runs:[{id:200,path:'.github/workflows/phase3-high-check.yml',workflow_id:368399831,head_sha:target,repository:{id:1130435580},head_repository:{id:1130435580},event:'workflow_dispatch',run_attempt:1,status:'completed',conclusion:'success',check_suite_id:200,run_started_at:date,updated_at:date},{id:201,path:'.github/workflows/repair-control-postgres.yml',workflow_id:381063243,head_sha:target,repository:{id:1130435580},head_repository:{id:1130435580},event:'workflow_dispatch',run_attempt:1,status:'completed',conclusion:'success',check_suite_id:201,run_started_at:date,updated_at:date}]};
 if(path.includes('/check-runs?')){
  const names=['TradeHQ Phase 3 tests','TradeHQ Cloudflare compatibility / Cloudflare build and SEO','TradeHQ Required validation',...(production?['TradeHQ Release & Recovery Readiness (read only)']:[])];
  return {total_count:names.length,check_runs:names.map(name=>({name,head_sha:target,app:{id:untrusted?1:15368,slug:'github-actions'},check_suite:{id:200},status:'completed',conclusion:'success',started_at:date,completed_at:date}))};
 }
 throw Error('Unexpected fixture read '+path);
};
const handler=createAdminCodeQueue({getKey:()=> 'fixture-key',getOwner:async()=>owner,getUser:async token=>token==='fixture-owner'?{id:owner,aud:'authenticated',email_confirmed_at:'2026-10-01'}:null,verifyWorker:async token=>{if(token!=='fixture-oidc')throw Error();return {jobName:job,runId,mainSha:current};},allow:async()=>true,rpc,readGitHub:read});
async function call(action:string,payload:Record<string,unknown>={},auth='owner'){
 const r=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{'content-type':'application/json','x-admin-key':auth==='owner'?'fixture-key':'',authorization:'Bearer '+(auth==='owner'?'fixture-owner':'wrong'),'x-github-oidc':auth==='worker'?'fixture-oidc':''},body:JSON.stringify({action,...payload})}));return {status:r.status,...await r.json()};
}
const review=(await call('review',{id,headSha:head})).data;
const approval={id,headSha:head,viewId:review.receipt.view_id};
assert.equal((await call('approve',approval,'wrong')).status,401);
await db.exec("UPDATE tradehq_automation.code_reviews SET viewed_at=now()-interval '11 minutes'");assert.equal((await call('approve',approval)).code,'REVIEW_EXPIRED');
const renewed=(await call('review',{id,headSha:head})).data;approval.viewId=renewed.receipt.view_id;
prHead='d'.repeat(40);assert.equal((await call('approve',approval)).code,'PROPOSAL_NOT_VERIFIED');prHead=head;
current=merged;assert.equal((await call('approve',approval)).code,'PROPOSAL_NOT_VERIFIED');current=base;
assert.equal((await call('approve',approval)).data.state,'approved');assert.equal((await call('approve',approval)).data.state,'approved');
assert.equal((await call('reject',approval)).code,'PUBLICATION_ALREADY_APPROVED');
const claim=(await call('worker-publication-claim',{},'worker')).data;assert.equal(claim.head_sha,head);
assert.equal((await call('worker-publication-claim',{},'worker')).data,null,'One publication claim per native run');
const dispatches:any[]=[];
await preparePublication({claim,github:read,mainSha:base,ready:async()=>{prDraft=false;},dispatch:async(...x:any[])=>{dispatches.push(x);}});
assert.deepEqual(dispatches,[['phase3-high-check.yml','ai/admin-'+id],['repair-control-postgres.yml','ai/admin-'+id]]);
// The preview implementation must read exact authenticated provider evidence; no caller success flag.
const cfId='6830d3c4-5e05-4bea-a46d-4941dc0d11ab',vId='dpl_PublicationFixture';let badPreview=false,providerReads=0;
const previews=()=>publicationPreviews({head,branch:'ai/admin-'+id,github:read,cloudflareToken:'fixture-existing-read-token',vercelToken:'fixture-existing-read-token',pages:async()=>({deploymentId:cfId}),fetcher:async(url:string)=>{
 providerReads++;let value;
 if(url.includes('cloudflare'))value={success:true,result:{id:cfId,project_name:'tradehq-preview',environment:badPreview?'production':'preview',latest_stage:{status:'success'},deployment_trigger:{metadata:{commit_hash:head,branch:'ai/admin-'+id}}}};
 else if(url.includes('/v6/'))value={deployments:[{uid:vId,state:'READY',target:null,created:1,meta:{githubCommitSha:head,githubCommitRef:'ai/admin-'+id}}]};
 else value={id:vId,name:'trading101',projectId:'prj_PjOhFr0eppPg8hZQhdeBwTniZWOy',target:null,readyState:'READY',source:'git',meta:{githubCommitSha:head,githubCommitRef:'ai/admin-'+id,githubRepo:'trading101',githubOrg:'anugaweerasinghe1-del'}};
 return new Response(JSON.stringify(value));
 }});
assert.equal((await previews()).vercel,vId);assert.equal(providerReads,4);badPreview=true;await assert.rejects(previews(),/Exact Cloudflare preview/);badPreview=false;
untrusted=true;assert.equal(await publicationChecks(read,head),false);untrusted=false;
job='Admin code publication';probeSuccess=false;assert.equal((await call('worker-publication-authorize',{id,headSha:head},'worker')).code,'VALIDATION_UNAVAILABLE');probeSuccess=true;
let writes=0;
await assert.rejects(mergePublication({claim,mainSha:base,queue:async(action:string,payload:any)=>{const r=await call(action,payload,'worker');assert.equal(r.status,200);return r.data;},github:async(path:string,method='GET',body:any)=>{
 if(method==='PUT'){writes++;assert.deepEqual(body,{sha:head,merge_method:'squash'});prMerged=true;current=merged;throw Error('Fixture lost merge response');}return read(path);
}}),/lost merge response/);
assert.equal(writes,1);
// Old-base identity cannot report success; later current-main native worker independently reconciles.
job='Admin code queue worker';runId=101;nativeStatus='completed';
const release=(await call('worker-publication-claim',{},'worker')).data;assert.equal(release.releaseSha,merged);
assert.equal((await call('list')).data.publications[0].state,'merged','A merge is not production success');
assert.equal((await call('worker-publication-claim',{},'worker')).data,null,'Release dispatch is consumed once');
production=true;runId=102;assert.equal((await call('worker-publication-claim',{},'worker')).data,null);
const history=(await call('list')).data;assert.equal(history.publications[0].state,'published');
for(const event of ['OWNER_PUBLICATION_APPROVED','PUBLICATION_CLAIMED','PUBLICATION_GATES_CONFIRMED','PUBLICATION_MERGE_CONFIRMED','PUBLICATION_RELEASE_CHECKS_REQUESTED','PUBLICATION_PRODUCTION_CONFIRMED'])assert.equal(history.events.filter((e:any)=>e.event===event).length,1,event);
assert.equal(writes,1,'Reconciliation cannot repeat a merge');
for(const role of ['anon','authenticated','service_role']){await db.exec('SET ROLE '+role);await assert.rejects(db.query('SELECT * FROM tradehq_automation.code_publications'));await db.exec('RESET ROLE');}
const workflow=YAML.parse(readFileSync('.github/workflows/tradehq-code-agent.yml','utf8'));
assert.deepEqual(workflow.jobs['admin-publication-previews'].permissions,{contents:'read',actions:'read',checks:'read'});
assert.equal(workflow.jobs['admin-publication'].permissions['id-token'],'write');assert.equal(workflow.jobs['admin-publication'].permissions.actions,'read');
assert.equal(workflow.jobs['admin-publication-previews'].steps[0].with.ref,'${{ github.sha }}');
assert.ok(workflow.jobs['admin-publication'].needs.includes('admin-publication-previews'));
const phase=YAML.parse(readFileSync('.github/workflows/phase3-high-check.yml','utf8'));
assert.ok(Object.hasOwn(phase.on,'workflow_dispatch'));assert.match(phase.jobs['release-readiness'].if,/workflow_dispatch/);
await db.close();
console.log('ADMIN_CODE_PUBLICATION_PASS: authenticated exact-view approval, stale-head/base/receipt and forged preview denial, native CI/provider gates, one protected merge attempt, lost-response reconciliation, one release dispatch and separate production confirmation. SQL/native/provider fixtures only; no real owner approval, model call, merge or deployment.');
