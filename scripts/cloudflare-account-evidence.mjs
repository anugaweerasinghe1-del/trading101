/** Existing account/project verification only. No provider mutation or raw JSON output. */
import assert from 'node:assert/strict';
const ACCOUNT='01087d56e4cb7b728a7a9ddbcb12b9bb', PROJECT='tradehq-preview';
const BASE='https://api.cloudflare.com/client/v4';
const SHA=/^[a-f0-9]{40}$/, UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const LIMITS=Object.freeze({requests:5,bytes:2097152,readMs:10000,totalMs:90000});
async function json(response){
  assert.ok(response.body,'Cloudflare evidence body missing');
  const reader=response.body.getReader(),chunks=[];let size=0;
  const deadline=Date.now()+LIMITS.readMs;
  try{
    for(;;){
      const remaining=deadline-Date.now();assert.ok(remaining>0,'Cloudflare evidence read deadline');let timer;
      let part;
      try{part=await Promise.race([reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Cloudflare evidence read deadline')),remaining);})]);}
      finally{clearTimeout(timer);}
      if(part.done)break;size+=part.value.byteLength;assert.ok(size<=LIMITS.bytes,'Cloudflare evidence byte limit');chunks.push(part.value);
    }
    const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
    try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
    catch{throw Error('Cloudflare evidence JSON invalid');}
  }finally{void reader.cancel().catch(()=>{});reader.releaseLock();}
}
function deployment(d){
  assert.ok(d && UUID.test(d.id||'') && d.project_name===PROJECT
    && ['production','preview'].includes(d.environment)
    && SHA.test(d.deployment_trigger?.metadata?.commit_hash||'')
    && typeof d.created_on==='string' && Number.isFinite(Date.parse(d.created_on)),
    'Cloudflare deployment identity invalid');
  return {id:d.id,sha:d.deployment_trigger.metadata.commit_hash,environment:d.environment,
    branch:d.deployment_trigger.metadata.branch==='main'?'main':'other',
    status:d.latest_stage?.status==='success'?'success':'not_success',createdAt:d.created_on};
}
export async function collectCloudflareAccountEvidence({sha,token,fetchImpl=fetch,now=Date.now}){
  assert.ok(SHA.test(sha||'') && typeof token==='string' && token.length>=20 && token.length<=4096 && !/[\r\n]/.test(token),'Cloudflare configured credential and immutable SHA required');
  const started=now(),observedAt=new Date(started).toISOString();let requests=0;
  async function read(path,{query}={}){
    assert.ok(++requests<=LIMITS.requests && now()-started<LIMITS.totalMs,'Cloudflare evidence request/time budget');
    assert.ok(path.startsWith('/accounts/'+ACCOUNT+'/')||path==='/graphql'||path==='/user/tokens/verify','Unexpected Cloudflare evidence destination');
    let response;
    try{response=await fetchImpl(BASE+path,{method:query?'POST':'GET',redirect:'error',
      headers:{Authorization:'Bearer '+token,Accept:'application/json',...(query?{'Content-Type':'application/json'}:{})},
      ...(query?{body:JSON.stringify({query})}:{}),signal:AbortSignal.timeout(15000)});}
    catch{throw Error('Cloudflare evidence transport unavailable');}
    if(response.status!==200){void response.body?.cancel().catch(()=>{});throw Error('Cloudflare evidence access denied or unavailable');}
    try{return await json(response);}
    catch{throw Error('Cloudflare evidence response invalid or exceeded bounds');}
  }
  const identity=await read('/user/tokens/verify');
  assert.ok(identity.success===true && identity.result?.status==='active','Cloudflare read token inactive');
  const project=await read('/accounts/'+ACCOUNT+'/pages/projects/'+PROJECT);
  assert.ok(project.success===true && project.result?.name===PROJECT && project.result.production_branch==='main','Cloudflare project/main binding invalid');
  const active=deployment(project.result.canonical_deployment);
  assert.ok(typeof project.result.id==='string' && project.result.canonical_deployment.project_id===project.result.id,'Cloudflare production project identity mismatch');
  assert.ok(active.environment==='production' && active.branch==='main' && active.status==='success' && active.sha===sha,'Cloudflare active production does not match verified main');
  const history=await read('/accounts/'+ACCOUNT+'/pages/projects/'+PROJECT+'/deployments?env=production&page=1&per_page=25');
  assert.ok(history.success===true && Array.isArray(history.result) && history.result.length<=25,'Cloudflare bounded production history invalid');
  const prior=history.result.map(deployment).filter(d=>d.id!==active.id && d.sha!==sha && d.environment==='production' && d.branch==='main' && d.status==='success')
    .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))[0]||null;
  const subscriptions=await read('/accounts/'+ACCOUNT+'/subscriptions');
  assert.ok(subscriptions.success===true && Array.isArray(subscriptions.result) && subscriptions.result.length<=100,'Cloudflare subscription evidence invalid');
  const plans=subscriptions.result.map(s=>({
    ratePlan:typeof s.rate_plan?.id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(s.rate_plan.id)?s.rate_plan.id:'unrecognized',
    zeroPrice:typeof s.price==='number'?s.price===0:null,
    frequency:['monthly','yearly','quarterly','weekly'].includes(s.frequency)?s.frequency:'unrecognized',
  }));
  const start=observedAt.slice(0,7)+'-01T00:00:00Z';
  const query='query { viewer { accounts(filter:{accountTag:"'+ACCOUNT+'"}) { accountTag pages: pagesFunctionsInvocationsAdaptiveGroups(limit:100,filter:{datetime_geq:"'+start+'",datetime_lt:"'+observedAt+'"}) { dimensions { scriptName } sum { requests errors } } } } }';
  const usage=await read('/graphql',{query});
  assert.ok(!usage.errors?.length && Array.isArray(usage.data?.viewer?.accounts) && usage.data.viewer.accounts.length===1,'Cloudflare account analytics unavailable');
  const account=usage.data.viewer.accounts[0];
  assert.ok(account.accountTag===ACCOUNT && Array.isArray(account.pages) && account.pages.length<100,'Cloudflare account analytics truncated or wrong account');
  const groups=account.pages;for(const g of groups)assert.ok(Number.isSafeInteger(g.sum?.requests)&&g.sum.requests>=0&&Number.isSafeInteger(g.sum?.errors)&&g.sum.errors>=0,'Cloudflare usage counters invalid');
  const script=project.result.production_script_name;
  const own=groups.filter(g=>typeof script==='string'&&g.dimensions?.scriptName===script);
  assert.ok(now()-started<LIMITS.totalMs,'Cloudflare evidence total deadline');
  return Object.freeze({schema:'tradehq-cloudflare-account-observation-v1',observedAt,accountId:ACCOUNT,project:PROJECT,nativeTokenActive:true,
    activeProduction:active,previousSuccessfulProduction:prior,historyWindow:{page:1,perPage:25,rows:history.result.length,completeAccountHistory:false},
    subscriptions:plans,usage:{from:start,to:observedAt,dataset:'pagesFunctionsInvocationsAdaptiveGroups',groups:groups.length,
      accountRequests:groups.reduce((s,g)=>s+g.sum.requests,0),accountErrors:groups.reduce((s,g)=>s+g.sum.errors,0),
      projectScriptMatched:own.length>0,projectRequests:own.length?own.reduce((s,g)=>s+g.sum.requests,0):null},
    quotaHeadroomVerified:false,rollbackPerformed:false,authorization:{providerWrite:false,modelCall:false,merge:false,productionRelease:false},
    limitations:['Adaptive analytics are sampled observations, not authoritative billing counters.',
      'Subscription metadata does not establish remaining Pages builds or all provider/model quota.',
      'Previous successful production is a candidate under Cloudflare documentation; an actual authorized rollback/restore remains unperformed.']});
}
