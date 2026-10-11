import assert from 'node:assert/strict';
import { verifyExactPagesPreview,previewRoutes } from './verify-exact-pages-preview.mjs';
const sha='a'.repeat(40),now=Date.parse('2026-10-11T06:00:00Z');
const base='https://api.github.com/repos/anugaweerasinghe1-del/trading101';
const check={id:10,name:'Cloudflare Pages',head_sha:sha,app:{id:85455,slug:'cloudflare-workers-and-pages'},status:'completed',conclusion:'success',
  external_id:'12345678-1234-1234-1234-123456789012',started_at:'2026-10-11T05:00:00Z',completed_at:'2026-10-11T05:10:00Z',
  details_url:'https://dash.cloudflare.com/?to=/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/12345678-1234-1234-1234-123456789012',
  output:{summary:"<a href='https://12345678.tradehq-preview.pages.dev'>preview</a>"}};
const run=async(mutate=(x)=>x,routeMutate=x=>x)=>{
  let calls=0,checkCalls=0;
  const fetchImpl=async(url,options)=>{
    assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,undefined);calls++;
    if(url===base)return new Response(JSON.stringify({id:1130435580,full_name:'anugaweerasinghe1-del/trading101',private:false}));
    if(url.startsWith(base+'/commits/'))return new Response(JSON.stringify(mutate({total_count:1,check_runs:[structuredClone(check)]},++checkCalls)));
    assert.ok(url.startsWith('https://12345678.tradehq-preview.pages.dev/'));
    const path=new URL(url).pathname;const found=previewRoutes.find(x=>x[0]===path);assert.ok(found);
    const response={status:found[1],headers:{'content-type':'text/html','x-robots-tag':'noindex, nofollow'},body:found[2]?`<link rel="canonical" href="https://www.thetradehq.com${found[2]}">`:'<html>locked or fallback</html>'};
    const x=routeMutate(response,path);return new Response(x.body,{status:x.status,headers:x.headers});
  };
  const result=await verifyExactPagesPreview(sha,{fetchImpl,now:()=>now,pause:async()=>{}});return {...result,calls};
};
const ok=await run();assert.equal(ok.routes.length,12);assert.equal(ok.releaseAuthorized,false);assert.equal(ok.productionDeployment,false);
for(const mutate of [x=>({...x,total_count:2}),x=>({...x,check_runs:[]}),x=>({...x,check_runs:[...x.check_runs,...x.check_runs]}),
  x=>{x.check_runs[0].head_sha='b'.repeat(40);return x;},x=>{x.check_runs[0].app.id++;return x;},
  x=>{x.check_runs[0].conclusion='failure';return x;},x=>{x.check_runs[0].status='in_progress';return x;},
  x=>{x.check_runs[0].details_url=x.check_runs[0].details_url.replace('tradehq-preview','another-project');return x;},
  x=>{x.check_runs[0].output.summary="<a href='https://99999999.tradehq-preview.pages.dev'>wrong</a>";return x;},
  (x,n)=>{if(n>1)x.check_runs[0].id++;return x;},x=>{x.check_runs[0].completed_at=null;return x;}])await assert.rejects(run(mutate));
for(const mutate of [x=>({...x,status:500}),x=>({...x,headers:{...x.headers,'x-robots-tag':'index,follow'}}),
  x=>({...x,body:x.body.replace('www.thetradehq.com','example.test')}),
  x=>({...x,status:302,headers:{location:'https://www.thetradehq.com/'}})])await assert.rejects(run(x=>x,mutate));
await assert.rejects(verifyExactPagesPreview('main'));
console.log('Exact Pages probe: GET-only SHA/App/account/project/deployment/URL binding, 12 routes, live noindex and canonical checks, incomplete/conflicting/racing evidence and redirect escape rejection passed.');
