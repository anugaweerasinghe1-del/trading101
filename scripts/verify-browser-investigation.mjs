import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { observePublicIncidentRoutes } from './agent-browser-investigation.mjs';
import { investigationBrowserFollowup, investigationOutcome } from './agent-operational-investigation-handoff.mjs';
assert.ok(typeof WebSocket==='function','Node22/native WebSocket required for real browser validation');
const empty=await observePublicIncidentRoutes([]);
assert.equal(empty.status,'NOT_NEEDED');assert.deepEqual(empty.observations,[]);
for(const paths of [['https://example.invalid'],['//example.invalid'],['/auth?token=private']])
  await assert.rejects(observePublicIncidentRoutes(paths));
await assert.rejects(observePublicIncidentRoutes(['/learn'],{origin:'https://example.invalid'}));
await assert.rejects(observePublicIncidentRoutes(['/learn'],{routeMs:20001}));
const requests=[];
let visibleError=false;
const server=createServer((req,res)=>{
  requests.push({path:req.url,method:req.method});
  const body=content=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<html><body>'+content+'</body></html>');};
  if(req.url==='/assets/broken.js'){res.writeHead(404,{'Content-Type':'application/javascript'});res.end('');return;}
  if(req.url==='/learn')return body('<div id="root"></div><script>setTimeout(()=>document.getElementById("root").textContent='+JSON.stringify(visibleError?'Unexpected Application Error: this is a caught visible fixture error with no uncaught JavaScript exception.':'Actual fixture application executed. '.repeat(4))+',75)</script>');
  if(req.url==='/auth')return body('<div id="root"></div>');
  if(req.url==='/contact')return body('<div id="root"><main data-route-loading>Loading a fixture route, not real application content.</main></div>');
  if(req.url==='/reviews')return body('<div id="root"><div id="prerender-seo">'+'Static fallback only. '.repeat(5)+'</div></div>');
  if(req.url==='/admin')return body('<div id="root"></div><script type="module" src="/assets/broken.js"></script>');
  if(req.url==='/admin/ai')return body('<div id="root">'+'Visible fixture application content. '.repeat(5)+'</div><script>throw Error("PRIVATE_FIXTURE_DETAIL_DO_NOT_EXPORT")</script>');
  res.writeHead(404);res.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
  const origin='http://127.0.0.1:'+server.address().port;
  const paths=['/learn','/auth','/contact','/reviews','/admin','/admin/ai','/learn','/about'];
  const report=await observePublicIncidentRoutes(paths,{origin,routeMs:5000});
  assert.equal(report.status,'OBSERVED');assert.equal(report.environment,'LOOPBACK_FIXTURE');
  assert.equal(report.observations.length,6);assert.equal(report.omittedRoutes,1);
  const byRoute=Object.fromEntries(report.observations.map(item=>[item.route,item]));
  assert.equal(byRoute['/learn'].status,'RENDERED_AT_FOLLOWUP');
  for(const path of ['/auth','/contact','/reviews','/admin'])assert.equal(byRoute[path].status,'NOT_RENDERED_AT_FOLLOWUP',JSON.stringify(byRoute[path]));
  assert.equal(byRoute['/auth'].rootCharacters,0);
  assert.equal(byRoute['/contact'].loading,true);assert.equal(byRoute['/reviews'].prerender,true);
  assert.equal(byRoute['/admin'].scriptFailures,1);assert.equal(byRoute['/admin/ai'].javascriptExceptions,1);
  assert.equal(byRoute['/admin/ai'].status,'RENDERED_WITH_ERRORS');
  assert.equal(report.originalIncidentCleared,false);assert.equal(report.rootCauseVerified,false);
  assert.equal(report.confirmedRepairOutcomes,0);assert.ok(Object.values(report.authorization).every(value=>value===false));
  assert.ok(requests.every(request=>request.method==='GET'),'No sign-in, form or mutation requests allowed');
  assert.ok(!JSON.stringify(report).includes('PRIVATE_FIXTURE_DETAIL'),'Raw exception text must not enter reports');
  const deny={codeWrites:false,modelCalls:false,ownerApproval:false,merge:false,productionRelease:false};
  const packet={schema:'tradehq-offline-repair-review-v1',status:'OWNER_INVESTIGATION_REQUIRED',
    producer:{runId:123,monitorSha:'a'.repeat(40),targetSha:'b'.repeat(40)},authorization:deny,
    cases:[{candidateId:'repair-v1-'+'c'.repeat(24),path:'/learn',symptom:'BLANK_ROOT',evidenceDigest:'d'.repeat(64),
      status:'OWNER_INVESTIGATION_REQUIRED',rootCauseVerified:false,repairRisk:'HIGH',draftManifest:{draftPrCreated:false},authorization:deny}]};
  const original=structuredClone(packet),before=investigationOutcome(packet);
  const followup=await investigationBrowserFollowup(packet,{origin,routeMs:5000});
  assert.equal(followup.observations[0].status,'RENDERED_AT_FOLLOWUP');
  assert.equal(followup.monitorRunId,123);assert.equal(followup.mainSha,'b'.repeat(40));
  assert.deepEqual(packet,original);assert.deepEqual(investigationOutcome(packet),before);
  assert.equal(investigationOutcome(packet).failJob,true,'A healthy follow-up must never clear the real incident');
  const count=requests.length;
  assert.equal((await investigationBrowserFollowup({...packet,cases:[],status:'NO_VERIFIED_INCIDENT'},{origin})).status,'NOT_NEEDED');
  assert.equal(requests.length,count,'Healthy cycles must not send follow-up browser requests');
  visibleError=true;
  const caught=(await observePublicIncidentRoutes(['/learn'],{origin,routeMs:5000})).observations[0];
  assert.equal(caught.visibleError,true);assert.equal(caught.javascriptExceptions,0);
  assert.equal(caught.status,'RENDERED_WITH_ERRORS','A caught visible error must not be called a healthy rendered page');
  console.log('READONLY_BROWSER_FOLLOWUP_PASS: actual Chrome; six loopback pages; blank/loading/prerender/script404/exception states distinguished; fixed deadlines; no raw private detail or form/model requests; original incident/risk/authority unchanged. Fixture only.');
} finally { await new Promise(resolve=>server.close(resolve)); }
