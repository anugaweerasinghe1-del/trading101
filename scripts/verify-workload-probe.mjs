import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { probeGitHubWorkload } from './agent-github-workload-probe.mjs';
const crypto=globalThis.crypto||webcrypto,now=Date.parse('2026-10-13T14:12:00Z'),at=now/1000,sha='a'.repeat(40);
const repo='anugaweerasinghe1-del/trading101',path='.github/workflows/tradehq-verified-evidence.yml';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const key={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'fixture-key-1',alg:'RS256',use:'sig'};
const claims={iss:'https://token.actions.githubusercontent.com',aud:'tradehq-repair-identity-v1',sub:'repo:'+repo+':ref:refs/heads/main',
  repository:repo,repository_id:'1130435580',repository_owner:'anugaweerasinghe1-del',repository_owner_id:'297117529',repository_visibility:'public',
  ref:'refs/heads/main',ref_type:'branch',event_name:'workflow_run',runner_environment:'github-hosted',workflow_ref:repo+'/'+path+'@refs/heads/main',
  workflow_sha:sha,sha,run_id:'38410880822',run_attempt:'1',check_run_id:'115343100001',jti:'disposable-token-id-1234567890',iat:at,nbf:at,exp:at+300};
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const message=b64({alg:'RS256',typ:'JWT',kid:'fixture-key-1'})+'.'+b64(claims);
const token=message+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(message))).toString('base64url');
const env={GITHUB_REPOSITORY:repo,GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'workflow_run',GITHUB_SHA:sha,
  GITHUB_TOKEN:'disposable-github-api-credential-123',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'disposable-oidc-request-credential-123',
  ACTIONS_ID_TOKEN_REQUEST_URL:'https://pipelines.actions.githubusercontent.com/fixture/idtoken?api-version=2.0'};
function transport({fail='',oversized=false,exfil=false}={}) {
  const calls=[];
  const fetcher=async(url,options)=>{
    calls.push(url);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.ok(options.signal);
    const endpoint=new URL(url);let response;
    if(endpoint.hostname==='pipelines.actions.githubusercontent.com') {
      assert.equal(endpoint.searchParams.get('audience'),'tradehq-repair-identity-v1');
      assert.equal(options.headers.Authorization,'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN);
      response={value:exfil?'private-sentinel':token};
    } else if(endpoint.hostname==='token.actions.githubusercontent.com') {
      assert.equal(options.headers,undefined,'No job/API credential goes to public JWKS');response={keys:[key]};
    } else {
      assert.equal(endpoint.origin,'https://api.github.com');assert.equal(options.headers.Authorization,'Bearer '+env.GITHUB_TOKEN);
      assert.ok(endpoint.pathname.startsWith('/repos/'+repo+'/'));
      if(endpoint.pathname.endsWith('/branches/main'))response={name:'main',protected:true,commit:{sha}};
      else if(endpoint.pathname.endsWith('/actions/runs/38410880822'))response={id:38410880822,run_attempt:1,workflow_id:381133473,path,head_sha:sha,head_branch:'main',event:'workflow_run',status:'in_progress',repository:{id:1130435580,owner:{id:297117529}},head_repository:{id:1130435580}};
      else response={total_count:1,jobs:[{name:'collect',run_id:38410880822,head_sha:sha,status:'in_progress',started_at:new Date(now-30000).toISOString(),check_run_url:'https://api.github.com/repos/'+repo+'/check-runs/115343100001'}]};
    }
    if(fail && endpoint.hostname===fail)return new Response('private-sentinel',{status:503});
    if(oversized && endpoint.hostname==='pipelines.actions.githubusercontent.com')return new Response('x'.repeat(32769));
    return new Response(JSON.stringify(response));
  };
  return {fetcher,calls};
}
const good=transport(),result=await probeGitHubWorkload({env,fetcher:good.fetcher,clock:()=>now});
assert.equal(result.status,'VERIFIED');assert.ok(Object.values(result.authorization).every(x=>x===false));
assert.equal(good.calls.length,6);assert.ok(Object.isFrozen(result));
for(const privateValue of [token,env.GITHUB_TOKEN,env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,'private-sentinel'])assert.ok(!JSON.stringify(result).includes(privateValue));
for(const change of [{GITHUB_REF:'refs/pull/1/merge'},{GITHUB_EVENT_NAME:'pull_request_target'},{GITHUB_REPOSITORY:'attacker/trading101'},
  {GITHUB_TOKEN:''},{ACTIONS_ID_TOKEN_REQUEST_TOKEN:''},{ACTIONS_ID_TOKEN_REQUEST_URL:'https://attacker.invalid/'},
  {ACTIONS_ID_TOKEN_REQUEST_URL:'https://pipelines.actions.githubusercontent.com.attacker.invalid/'},
  {ACTIONS_ID_TOKEN_REQUEST_URL:'http://pipelines.actions.githubusercontent.com/'},
  {ACTIONS_ID_TOKEN_REQUEST_URL:'https://user:password@pipelines.actions.githubusercontent.com/'},
  {ACTIONS_ID_TOKEN_REQUEST_URL:'https://pipelines.actions.githubusercontent.com:8443/'}]) {
  const f=transport(),r=await probeGitHubWorkload({env:{...env,...change},fetcher:f.fetcher,clock:()=>now});
  assert.equal(r.status,'BLOCKED');assert.equal(f.calls.length,0);assert.ok(Object.values(r.authorization).every(x=>x===false));
}
for(const options of [{fail:'pipelines.actions.githubusercontent.com'},{fail:'token.actions.githubusercontent.com'},{fail:'api.github.com'},{oversized:true},{exfil:true}]) {
  const f=transport(options),r=await probeGitHubWorkload({env,fetcher:f.fetcher,clock:()=>now});
  assert.equal(r.status,'BLOCKED');assert.ok(!JSON.stringify(r).includes('private-sentinel'));
}
console.log('WORKLOAD_PROBE_PASS: isolated actual signed token plus read-only native-shaped metadata, separate credential origins, denied fork/event/foreign URL/oversized/unavailable sources and private output. No real GitHub token was minted.');
