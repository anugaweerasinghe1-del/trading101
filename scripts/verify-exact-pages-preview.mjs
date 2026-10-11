/** GET-only exact-SHA Pages probe. No token, model, account, trade or release operation. */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = 'https://api.github.com/repos/anugaweerasinghe1-del/trading101';
const account = '01087d56e4cb7b728a7a9ddbcb12b9bb';
export const previewRoutes = [
  ['/',200,'/'],['/about',200,'/about'],['/courses',200,'/courses'],['/daily',200,'/daily'],
  ['/auth',200,null],['/trade',200,null],['/portfolio',200,null],['/leaderboard',200,'/leaderboard'],
  ['/reviews',200,'/reviews'],['/admin',200,null],['/admin/ai',200,null],['/audit-missing-preview-route',404,null],
];
async function boundedText(response, limit) {
  const advertised=response.headers.get('content-length');
  assert.ok(!advertised || (/^[0-9]+$/.test(advertised) && Number(advertised)<=limit),'Oversized response.');
  assert.ok(response.body,'Missing response body.');const reader=response.body.getReader(),parts=[];let bytes=0;
  try { while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;assert.ok(bytes<=limit,'Oversized response.');parts.push(Buffer.from(value));} }
  finally { await reader.cancel(); }
  return Buffer.concat(parts).toString('utf8');
}
function identify(data, sha, now) {
  assert.ok(Array.isArray(data.check_runs) && data.total_count === data.check_runs.length && data.total_count <= 100,
    'Incomplete Pages check collection.');
  const matches = data.check_runs.filter(c => c.name === 'Cloudflare Pages' && c.app?.id === 85455 && c.app?.slug === 'cloudflare-workers-and-pages');
  assert.equal(matches.length,1,'Missing or ambiguous trusted Pages check.');
  const c = matches[0];
  assert.equal(c.head_sha,sha,'Pages commit mismatch.');
  if (c.status !== 'completed') return null;
  assert.equal(c.conclusion,'success','Pages deployment failed or inconclusive.');
  assert.ok(Number.isSafeInteger(c.id) && c.id > 0 && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(c.external_id || ''),'Missing Pages identity.');
  const start=Date.parse(c.started_at),end=Date.parse(c.completed_at);
  assert.ok(Number.isFinite(start) && Number.isFinite(end) && start <= end && start >= now-86400000 && end <= now+60000,'Stale/incomplete Pages timing.');
  const details=new URL(c.details_url);
  assert.ok(details.origin==='https://dash.cloudflare.com' && !details.username && !details.password && !details.hash
    && (details.searchParams.get('to') || details.pathname)===`/${account}/pages/view/tradehq-preview/${c.external_id}`,'Pages project identity mismatch.');
  const url=`https://${c.external_id.slice(0,8)}.tradehq-preview.pages.dev/`;
  const links=[...(c.output?.summary || '').matchAll(/href=['"](https:\/\/[a-f0-9]{8}\.tradehq-preview\.pages\.dev\/?)['"]/g)].map(x=>new URL(x[1]).href);
  assert.equal(links.length,1,'Missing/ambiguous immutable preview URL.'); assert.equal(links[0],url,'Preview URL/deployment mismatch.');
  return { checkId:c.id, deploymentId:c.external_id, headSha:sha, url };
}
export async function verifyExactPagesPreview(sha, { fetchImpl=fetch, now=Date.now, pause=ms=>new Promise(r=>setTimeout(r,ms)) }={}) {
  assert.ok(/^[a-f0-9]{40}$/.test(sha || ''),'Immutable validation SHA required.');
  let requests=0;const deadline=now()+180000;
  const get=async(url)=>{
    assert.ok(++requests <= 30 && now()<deadline,'Preview probe budget exhausted.');
    const response=await fetchImpl(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(Math.min(15000,deadline-now())),
      headers:{Accept:url.startsWith(root)?'application/vnd.github+json':'text/html','User-Agent':'TradeHQ-Exact-Preview-ReadOnly/1.0'}});
    return response;
  };
  const json=async(path)=>{
    const response=await get(root+path);assert.equal(response.status,200,'GitHub evidence unavailable; no auth/quota retries.');
    return JSON.parse(await boundedText(response,2000000));
  };
  const repo=await json('');assert.ok(repo.id===1130435580 && repo.full_name==='anugaweerasinghe1-del/trading101' && repo.private===false,'Repository mismatch.');
  const path=`/commits/${sha}/check-runs?filter=latest&per_page=100`;
  let identity;
  for(let i=0;i<6;i++){
    const data=await json(path);identity=identify(data,sha,now());if(identity)break;
    assert.ok(i<5,'Pages is still pending; do not claim verification.');await pause(10000);
  }
  const routes=[];
  for(const [path,status,canonical] of previewRoutes){
    let url=new URL(path,identity.url),response;
    for(let i=0;i<4;i++){
      response=await get(url.href);
      if(![301,302,303,307,308].includes(response.status))break;
      assert.ok(i<3,'Too many route redirects.');const next=new URL(response.headers.get('location') || '',url);
      assert.ok(next.origin===new URL(identity.url).origin && !next.username && !next.password,'Preview escaped immutable deployment.');url=next;
    }
    assert.equal(response.status,status,`Unexpected route HTTP status for ${path}.`);
    assert.ok(/text\/html/i.test(response.headers.get('content-type') || ''),`Missing HTML response for ${path}.`);
    assert.ok(/(?:^|[\s,])noindex(?:$|[\s,])/i.test(response.headers.get('x-robots-tag') || ''),`Live noindex header missing for ${path}.`);
    const html=await boundedText(response,1000000);
    if(canonical){
      const tags=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]).filter(x=>/\brel=['"]canonical['"]/i.test(x));
      assert.equal(tags.length,1,`Canonical missing/ambiguous for ${path}.`);
      const href=tags[0].match(/\bhref=['"]([^'"]+)['"]/i)?.[1];assert.equal(href,'https://www.thetradehq.com'+canonical,`Production canonical mismatch for ${path}.`);
    }
    routes.push({path,status,noindex:true,productionCanonical:canonical?'https://www.thetradehq.com'+canonical:null});
  }
  assert.deepEqual(identify(await json(path),sha,now()),identity,'Pages identity changed during probes.');
  return {schema:'tradehq-pages-preview-probe-v1',...identity,routes,requests,productionDeployment:false,releaseAuthorized:false};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const sha=process.env.VALIDATION_SHA;assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha,'Checkout mismatch.');
    console.log(JSON.stringify(await verifyExactPagesPreview(sha),null,2));
  }catch{console.error('Exact Pages preview probe blocked: missing, pending, failed or mismatched evidence/HTTP/SEO. No release authority.');process.exitCode=1;}
}
