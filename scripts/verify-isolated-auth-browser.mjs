/**
 * Credential-free, isolated real Chrome regression for the COMPILED /auth UI.
 * Runs against a loopback-only Supabase mock; never contacts production.
 * No installed browser packages or real Supabase accounts required.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, extname, sep } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { once } from "node:events";
import {waitForChromePort} from "./isolated-chrome-startup.mjs";

const USER_ID="bd1ca419-139b-4170-ac64-a99e0076f123";
const EMAIL="tradehq-browser-fixture@example.invalid";
const PASSWORD="disposable-test-credential-31";
const epoch=Math.floor(Date.now()/1000);
const b64=v=>Buffer.from(JSON.stringify(v)).toString("base64url");
const JWT=b64({alg:"HS256",typ:"JWT"})+"."+b64({sub:USER_ID,aud:"authenticated",role:"authenticated",exp:epoch+3600})+".fixture-only";
const USER={id:USER_ID,aud:"authenticated",role:"authenticated",email:EMAIL,
  app_metadata:{provider:"email",providers:["email"]},user_metadata:{username:"isolated"},
  created_at:new Date().toISOString()};
const MIME={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json",
  ".png":"image/png",".woff2":"font/woff2",".ico":"image/x-icon"};
// Use the actual authored bank, parsed as JSON rather than executing TS.
// Its visible reviewer proves the bank response reached the compiled UI.
const bankSource=readFileSync("src/lib/dailyPracticeBank.ts","utf8");
const bankMatch=bankSource.match(/export const starterPracticeBank: DailyBatch = (\{[\s\S]*\});\s*$/);
assert.ok(bankMatch,"Authored Daily bank JSON fixture unavailable");
const fixtureBank={...JSON.parse(bankMatch[1]),reviewer:"Isolated browser fixture"};
const wait=async(check,label,ms=14000)=>{
  const start=Date.now();
  while(Date.now()-start<ms){try{const x=await check();if(x)return x;}catch{}await sleep(150);}
  throw Error("Timed out waiting for "+label);
};
function cdpConnection(ws){
  const pending=new Map();let sequence=0;
  ws.addEventListener("message",event=>{
    let reply;try{reply=JSON.parse(event.data)}catch{return}
    const task=pending.get(reply.id);if(!task)return;
    pending.delete(reply.id);clearTimeout(task.timeout);
    if(reply.error)task.reject(Error("Chrome: "+reply.error.message));
    else task.resolve(reply.result||{});
  });
  return {
    send(method,params={}){
      return new Promise((resolve,reject)=>{
        const id=++sequence;
        const timeout=setTimeout(()=>{pending.delete(id);reject(Error("Chrome CDP timeout "+method));},10000);
        pending.set(id,{resolve,reject,timeout});
        ws.send(JSON.stringify({id,method,params}));
      });
    },
    async evaluate(expression){
      const x=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
      if(x.exceptionDetails){
        const reason=String(x.exceptionDetails.exception?.description||x.exceptionDetails.text||'Unknown browser exception').split('\n')[0].slice(0,180);
        throw Error("Browser JavaScript assertion failed: "+reason);
      }
      return x.result?.value;
    },
    close(){ws.close();for(const t of pending.values())clearTimeout(t.timeout);pending.clear();}
  };
}
async function main(){
  assert.ok(Number(process.versions.node.split(".")[0])>=22 && typeof WebSocket==="function",
    "Node 22 with native WebSocket required");
  const chrome=["google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .find(name=>spawnSync("which",[name],{encoding:"utf8"}).status===0);
  assert.ok(chrome,"Real Chromium unavailable: do not claim this browser test passed");
  const temp=mkdtempSync(join(tmpdir(),"tradehq-isolated-auth-"));
  const dist=join(temp,"dist"),profile=join(temp,"chrome");
  let server,browser,devtools;let attempts=0,approved=0,rejected=0,dataWrites=0,portfolioInitialized=0,logouts=0,refreshRejected=0,dailyReads=0,adminChatRequests=0;
  let showPublications=false,publicationReads=0;
  let learningWrites=0, learningReads=0, savedLearning=null;
  let privateTradeReads=0, privateTradeRejected=0;
  let holdLearnModule=true;
  const releaseLearnModules=[];
  const rejectedWrites=[];
  const publications=[{slug:'isolated-publication',published_at:new Date().toISOString(),title:'Isolated course announcement'}];
  const ADMIN_FIXTURE_KEY='isolated-admin-fixture-only';
  let dailyGenerationRequests=0;
  let dailyDrafts=[],dailyEditorialWrites=0;
  let newsletterRevision=1,newsletterReads=0,newsletterWrites=0,newsletterConfirmed=1;
  let newsletterEditorialFixture=false,newsletterPreviewCalls=0,newsletterPublishRequests=0;
  let newsletterEdition={id:'fixture-newsletter',week_of:'2026-11-02',status:'draft',revision:2,subject:'Saved fixture subject',preheader:'Saved preview line',body_markdown:'Saved fixture text',reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString(),ai_model:null,generator_error:null};
  const newsletterPreview={subject:'Preview fixture subject',preheader:'A source-backed fixture preview',body_markdown:'## Fixture lesson\n<img src=x onerror=window.__newsletterHtmlExecuted=true>\nHypothetical worksheet: 1% of $100 equals $1.'};
  let dashboardHold=false,dashboardHeldRequests=0;
  let courseDeskFixture=false,reviewDeskFixture=false,courseDeskWrites=0,reviewDeskWrites=0;
  let courseMutationFixture=false,reviewMutationFixture=false;
  let reviewListUnavailable=false;
  let courseDeskRows=[],courseWriteLog=[],reviewWriteLog=[];
  let courseListUnavailable=false,courseFailRefreshAfterSave=false;
  let reviewFixtureRow={id:'aaaa1111-2222-4333-8444-555555555555',name:'Fixture reviewer',
    content:'An isolated review used solely to test the owner UI.',rating:4,
    is_visible:true,is_featured:false,created_at:new Date().toISOString(),
    owner_reply:null,owner_reply_updated_at:null,deleted_at:null};
  let dashboardFixture=false,dailyQueueUnavailable=false,newsletterQueueUnavailable=false,dashboardSettingsUnavailable=false;
  let dashboardMetadataRequests=0;
  let dailyStatus={enabled:false,nextDue:'2026-12-09',prepareAfter:'2026-12-02',completed:20,attempts:2,
    retryAfter:new Date(Date.now()+3600000).toISOString(),lastError:'Gemini rejected generation (HTTP 503). Check free-tier settings.',
    lastStarted:'2026-10-14T16:14:30Z',lastFinished:'2026-10-14T16:14:33Z',
    freeConfirmed:true,hasApiKey:true,model:'gemini-3.5-flash'};
  const repairRequests={status:0,stop:0};
  const chatDraft='Improve About page mobile spacing while preserving every existing sentence and link.';
  let codeQueueRows=[],codeQueueEvents=[],codeQueueReviews=[],codeQueuePublications=[],codeQueueWrites=0;
  try{
    server=createServer((req,res)=>{
      const parsed=new URL(req.url||"/","http://localhost");
      const route=parsed.pathname;
      const json=(status,body)=>{
        res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
        res.end(JSON.stringify(body));
      };
      if(route==='/functions/v1/admin-courses' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY)return json(401,{error:'fixture_admin_denied'});
        let content='';req.on('data',chunk=>{content+=chunk;});
        req.on('end',()=>{
          let body;try{body=JSON.parse(content);}catch{return json(400,{error:'fixture_invalid_json'});}
          if(courseDeskFixture && body.action==='list')return courseListUnavailable ? json(503,{error:'Fixture inbox outage'}) : json(200,{data:courseDeskRows});
          if(courseDeskFixture && body.action==='settings')return json(200,{data:{
            enabled:false,freeConfirmed:false,model:'gemini-3.5-flash-lite',hasApiKey:false,
            hasGscCredentials:false,gscProperty:'',topicRequests:[],lastStarted:null,
            lastFinished:null,runs:[]}});
          if(courseDeskFixture && !['list','settings'].includes(body.action)){
            courseDeskWrites++;courseWriteLog.push(body.action);
            if(courseMutationFixture && body.action==='publish'){
              assert.equal(req.headers.authorization,'Bearer '+JWT,'Owner UI must attach its current session for publication');
              return json(403,{error:'Fixture registered-owner denial'});
            }
            if(courseMutationFixture && body.action==='save' && body.document){
              assert.ok(body.id===null || body.revision===courseDeskRows[0].revision,'Only exact revision can save');
              const row={id:'fixture-course-private-draft',status:'draft',revision:body.id===null?1:body.revision+1,published_revision:0,document:body.document};
              courseDeskRows=[row];if(courseFailRefreshAfterSave)courseListUnavailable=true;return json(200,{data:row});
            }
            return json(409,{error:'No other course mutation permitted in this fixture'});
          }
          if(dashboardFixture && ['list','daily-list'].includes(body.action)){assert.equal(body.summary,true,'Dashboard must request metadata without full documents');dashboardMetadataRequests++;}
          if(dashboardFixture && body.action==='settings' && dashboardHold){dashboardHeldRequests++;setTimeout(()=>json(200,{data:{enabled:true,runs:[]}}),600);return;}
          if(dashboardFixture && body.action==='settings')return dashboardSettingsUnavailable
            ? json(503,{error:'Fixture settings unavailable'})
            : json(200,{data:{enabled:true,model:'fixture-only',runs:[{period:'2026-10-01',slot:1,status:'paused',last_error:'Fixture HTTP503'}]}});
          if(dashboardFixture && body.action==='list')return json(200,{data:[{id:'course-fixture-1',status:'draft'},{id:'course-fixture-2',status:'draft'},{id:'course-fixture-3',status:'published'}]});
          if(dashboardFixture && dailyQueueUnavailable && body.action==='daily-list')return json(503,{error:'Fixture Daily inbox unavailable'});
          if(body.action==='daily-list')return json(200,{data:body.summary===true?dailyDrafts.map(({document,research,...metadata})=>metadata):dailyDrafts});
          if(body.action==='daily-status')return json(200,{data:dailyStatus});
          if(body.action==='daily-generate'){dailyGenerationRequests++;return json(200,{data:null});}
          if(['daily-save','daily-publish','daily-reject'].includes(body.action)){dailyEditorialWrites++;return json(409,{error:'No editorial mutation permitted in this read-only fixture'});}
          return json(200,{data:{}});
        });return;
      }
      if(['/functions/v1/newsletter-editor','/functions/v1/newsletter-dispatch'].includes(route) && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY)return json(401,{error:'fixture_admin_denied'});
        let content='';req.on('data',chunk=>{content+=chunk;});req.on('end',()=>{
          const body=JSON.parse(content);
          if(route.endsWith('newsletter-dispatch') && body.action==='status')return json(200,{data:{counts:{confirmed:newsletterConfirmed,pending:0,unsubscribed:0,bounced:0},subscribers:[],recentDeliveries:[{edition_id:'fixture-newsletter',status:'accepted',provider_id:'private-provider-id',created_at:new Date().toISOString()},{edition_id:'fixture-newsletter',status:'delivered',provider_id:'other-private-id',created_at:new Date().toISOString()},{edition_id:'fixture-newsletter',status:'unknown',provider_id:null,created_at:new Date().toISOString()}],webhookConfigured:true,limitInfo:'Isolated fixture only'}});
          if(route.endsWith('newsletter-dispatch')){
            if(body.action==='publish')newsletterPublishRequests++;
            assert.equal(body.action,'publish-readiness','No subscriber send action permitted in fixture');
            assert.equal(req.headers.authorization,'Bearer '+JWT,'Owner readiness must use current Auth token');
            return json(403,{error:'Fixture registered-owner denial'});
          }
          if(body.action==='topics')return json(200,{data:[{id:'fixture',title:'Fixture topic',sourceTitle:'Fixture source'}]});
          if(body.action==='list'){
            newsletterReads++;
            if(dashboardFixture && newsletterQueueUnavailable)return json(503,{error:'Fixture Newsletter inbox unavailable'});
            if(newsletterEditorialFixture)return json(200,{data:[newsletterEdition]});
            return json(200,{data:[{id:'fixture-newsletter',week_of:'2026-11-02',status:'draft',revision:newsletterRevision,subject:'Server lesson title',preheader:'Fixture preview',body_markdown:'Fixture educational draft',reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString(),ai_model:null,generator_error:null}]});}
          if(newsletterEditorialFixture && ['preview-upcoming','preview-rewrite'].includes(body.action)){
            newsletterPreviewCalls++;
            if(body.action==='preview-rewrite')assert.equal(body.revision,newsletterEdition.revision,'AI preview uses saved revision');
            return json(200,{data:{...newsletterPreview,week_of:'2026-11-09',note:'Unsaved fixture only'}});
          }
          if(newsletterEditorialFixture && body.action==='save'){
            newsletterWrites++;assert.equal(body.revision,newsletterEdition.revision);
            assert.equal(newsletterEdition.status,'draft');
            newsletterEdition={...newsletterEdition,subject:body.subject,preheader:body.preheader,body_markdown:body.body_markdown,revision:body.revision+1};
            return json(200,{data:{id:newsletterEdition.id,revision:newsletterEdition.revision}});
          }
          if(newsletterEditorialFixture && body.action==='approve'){
            newsletterWrites++;assert.equal(body.revision,newsletterEdition.revision);
            assert.equal(body.reviewed,true);assert.equal(newsletterEdition.status,'draft');
            newsletterEdition={...newsletterEdition,status:'approved',reviewed_by:body.reviewer};
            return json(200,{data:{id:newsletterEdition.id,status:'approved'}});
          }
          newsletterWrites++;return json(409,{error:'No generation, approval or email sending permitted in this fixture'});
        });return;
      }
      if(route==='/functions/v1/admin-reviews' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY)return json(401,{error:'fixture_admin_denied'});
        let content='';req.on('data',part=>{content+=part;});req.on('end',()=>{
          let input;try{input=JSON.parse(content);}catch{return json(400,{error:'invalid_fixture_json'});}
          if(input.action!=='list'){
            reviewDeskWrites++;reviewWriteLog.push(input.action);
            if(reviewMutationFixture && input.id===reviewFixtureRow.id && input.action==='update' &&
              input.patch && Object.keys(input.patch).length===1 && typeof input.patch.name==='string'){
              reviewFixtureRow={...reviewFixtureRow,name:input.patch.name};return json(200,{ok:true});
            }
            if(reviewMutationFixture && input.id===reviewFixtureRow.id && input.action==='reply' &&
              typeof input.reply==='string'){
              reviewFixtureRow={...reviewFixtureRow,owner_reply:input.reply,owner_reply_updated_at:new Date().toISOString()};
              return json(200,{ok:true});
            }
            if(reviewMutationFixture && input.id===reviewFixtureRow.id && ['delete','restore'].includes(input.action)){
              reviewFixtureRow={...reviewFixtureRow,deleted_at:input.action==='delete'?new Date().toISOString():null};
              return json(200,{ok:true});
            }
            return json(409,{error:'Other moderation mutations denied by fixture'});
          }
          return reviewListUnavailable ? json(503,{error:'Fixture moderation list outage'}) : json(200,{data:reviewDeskFixture?[reviewFixtureRow]:[]});
        });return;
      }
      if(route==='/functions/v1/admin-code-queue' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY||req.headers.authorization!=='Bearer '+JWT)return json(401,{code:'OWNER_SESSION_REQUIRED'});
        let content='';req.on('data',x=>{content+=x;});req.on('end',()=>{
          const input=JSON.parse(content);
          if(input.action==='list')return json(200,{data:{requests:codeQueueRows,events:codeQueueEvents,reviews:codeQueueReviews,publications:codeQueuePublications,learning:{state:'COLLECTING_NATIVE_RESULTS',outcomes:0,files:[]},learningDecisions:[],workerRuns:[{run_id:38886251817,status:'idle',first_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()}]}});
          if(input.action==='submit'){
            const found=codeQueueRows.find(x=>x.request_key===input.requestKey);if(found)return json(200,{data:found});
            codeQueueWrites++;const row={id:'a1700000-1111-4111-8111-000000000009',prompt:input.prompt,request_key:input.requestKey,status:'queued',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),run_id:null,head_sha:null,pr_number:null,result_code:null};
            codeQueueRows=[row];codeQueueEvents=[{id:1,request_id:row.id,at:row.created_at,event:'OWNER_REQUEST_QUEUED'}];return json(200,{data:row});
          }
          if(input.action==='review')return json(200,{data:{id:input.id,headSha:input.headSha,files:[{path:'src/pages/About.tsx',patch:'@@ -1 +1 @@\n-About\n+<img src=x onerror="window.__proposalHtmlExecuted=true">',additions:1,deletions:1}],receipt:{request_id:input.id,view_id:'a1700000-1111-4111-8111-000000000010',decision:null}}});
          if(input.action==='approve'){
            assert.equal(input.headSha,'b'.repeat(40));assert.equal(input.viewId,'a1700000-1111-4111-8111-000000000010');
            codeQueueWrites++;codeQueuePublications=[{request_id:input.id,state:'approved',head_sha:input.headSha,run_id:null}];
            codeQueueEvents.push({id:4,request_id:input.id,at:new Date().toISOString(),event:'OWNER_PUBLICATION_APPROVED'});return json(200,{data:codeQueuePublications[0]});
          }
          if(input.action==='reject'){

            codeQueueWrites++;codeQueueReviews=[{request_id:input.id,view_id:input.viewId,decision:'rejected',close_state:'pending',close_run_id:null}];
            codeQueueEvents.push({id:3,request_id:input.id,at:new Date().toISOString(),event:'OWNER_PROPOSAL_REJECTED'});return json(200,{data:codeQueueReviews[0]});
          }
          if(input.action==='cancel'&&codeQueueRows[0]?.id===input.id){codeQueueWrites++;codeQueueRows[0].status='canceled';codeQueueEvents.push({id:2,request_id:input.id,at:new Date().toISOString(),event:'OWNER_REQUEST_CANCELED'});return json(200,{data:codeQueueRows[0]});}
          return json(400,{code:'INVALID_REQUEST'});
        });return;
      }
      if(route==='/functions/v1/admin-agent-chat' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY)return json(401,{error:'fixture_admin_denied'});
        let raw='';req.on('data',chunk=>{raw+=chunk;});
        req.on('end',()=>{
          let body;try{body=JSON.parse(raw);}catch{return json(400,{error:'bad fixture body'});}
          if(body?.action==='status'){
            // Metadata probes never spend the one-request model fixture budget.
            return json(200,{code:'CONFIGURED_NOT_TESTED',providerAttemptMade:false,quotaVerified:false});
          }
          if(typeof body?.message!=='string')return json(400,{error:'invalid chat body'});
          adminChatRequests++;
          if(adminChatRequests===5)return json(429,{code:'DAILY_LIMIT',error:'Fixture exhausted'});
          if(adminChatRequests===6)return json(403,{error:'Fixture denied'});
          if(adminChatRequests===7)return json(401,{error:'Fixture key rejected'});
          if(adminChatRequests===1)return json(503,{code:'PILOT_PAUSED',error:'Fixture pilot paused'});
          const output={reply:'<img src=x onerror="window.__modelHtmlExecuted=true">',draftRequest:chatDraft,mode:'READ_ONLY_PILOT',claim:'UNVERIFIED_SUGGESTION',rootCauseVerified:false,historyAvailable:false,authorization:{codeWrites:false,modelTools:false,merge:false,productionRelease:false}};
          if(adminChatRequests===3)output.authorization.merge=true;
          if(adminChatRequests===8)output.reply='';
          if(adminChatRequests===4){setTimeout(()=>json(200,output),500);return;}
          return json(200,output);
        });
        return;
      }
      if(route==='/functions/v1/repair-owner-control' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY || req.headers.authorization!=='Bearer '+JWT)return json(401,{code:'OWNER_REQUIRED'});
        let content='';req.on('data',chunk=>{content+=chunk;});
        req.on('end',()=>{
          let input;try{input=JSON.parse(content);}catch{return json(400,{code:'INVALID_ACTION'});}
          if(!['status','stop'].includes(input.action)||Object.keys(input).length!==1)return json(400,{code:'INVALID_ACTION'});
          const action=input.action;repairRequests[action]++;
          const value={code:action==='stop'?'DURABLE_STOP_CONFIRMED':'CONTROL_STATUS',mode:'OWNER_STOP_ONLY',
            stopped:action==='stop',generation:action==='stop'?3:2,activeCandidates:action==='stop'?0:1,
            authorization:{codeWrites:false,modelCalls:false,merge:false,productionRelease:false}};
          if(action==='status'&&repairRequests.status===1)return json(503,{code:'CONTROL_PAUSED'});
          if(action==='status'&&repairRequests.status===2)value.authorization.merge=true;
          if(action==='status'&&repairRequests.status===4)return json(403,{code:'OWNER_ACCOUNT_REQUIRED'});
          if(action==='status'&&repairRequests.status===5)return json(401,{code:'ADMIN_KEY_REQUIRED'});
          if((action==='status'&&repairRequests.status===3)||(action==='stop'&&repairRequests.stop===3)){setTimeout(()=>json(200,value),500);return;}
          return json(200,value);
        });return;
      }
      if(route==="/auth/v1/token" && req.method==="POST" &&
        parsed.searchParams.get("grant_type")==="password"){
        attempts++;let content="";
        req.on("data",x=>{content+=x;if(content.length>8000)req.destroy();});
        req.on("end",()=>{
          let body;try{body=JSON.parse(content)}catch{return json(400,{error:"invalid_request"})}
          if(body.email!==EMAIL||body.password!==PASSWORD){
            rejected++;return json(400,{error:"invalid_grant",error_description:"Invalid login credentials"});
          }
          approved++;
          return json(200,{access_token:JWT,token_type:"bearer",expires_in:3600,
            expires_at:epoch+3600,refresh_token:"fixture-refresh-token",user:USER});
        });return;
      }
      if(route==="/auth/v1/token" && req.method==="POST" && parsed.searchParams.get("grant_type")==="refresh_token"){
        refreshRejected++;return json(400,{error:"invalid_grant",error_description:"Refresh token expired"});
      }
      if(route==="/auth/v1/logout" && req.method==="POST"){
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"invalid_token"});
        logouts++;res.writeHead(204);res.end();return;
      }
      if(route==="/auth/v1/user")
        return req.headers.authorization==="Bearer "+JWT?json(200,USER):json(401,{error:"invalid_token"});
      if(route.startsWith("/auth/v1/"))return json(403,{error:"blocked_fixture_auth"});
      if(route==="/rest/v1/practice_trades" && req.method==="GET"){
        if(req.headers.authorization!=="Bearer "+JWT ||
          parsed.searchParams.get("user_id")!=="eq."+USER_ID ||
          parsed.searchParams.get("select")!=="id" ||
          parsed.searchParams.get("limit")!=="1"){
          privateTradeRejected++;return json(403,{error:"fixture_owner_id_only_required"});
        }
        privateTradeReads++;
        return json(200,[{id:"fixture-server-recorded-trade"}]);
      }
      if(route==="/rest/v1/rpc/initialize_practice_portfolio" && req.method==="POST"){
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"invalid_token"});
        portfolioInitialized++;
        return json(200,{trades:[{id:'fixture-account-trade',asset_id:'aapl',side:'buy',quantity:1,
          price:100,total:100.1,created_at:'2026-11-01T10:00:00Z',price_source:'Fixture only'}],
          cash:99899.9,ranked:false,cycle_id:"fixture",updated_at:'2026-11-01T10:00:00Z',
          positions:[{asset_id:'aapl',symbol:'AAPL',asset_type:'stock',quantity:1,avg_price:100.1,last_price:100}]});
      }
      if(route==="/rest/v1/rpc/get_daily_practice_bank" && req.method==="POST"){
        dailyReads++;
        // Request arrival is not query hydration. Exercise a deliberately late
        // real-bank response; selection must wait for its visible UI state.
        setTimeout(()=>json(200,fixtureBank),200);return;
      }
      if(route==='/rest/v1/rpc/get_published_course_catalog' && req.method==='POST')return json(200,[]);
      if(route==="/rest/v1/user_learning_progress"){
        // The isolated fixture permits learning-only writes for its authenticated
        // owner; no portfolio, ranking, trade or profile mutations are allowed.
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"fixture_owner_required"});
        if(req.method==="GET"){
          if(parsed.searchParams.get("user_id")!=="eq."+USER_ID)return json(403,{error:"fixture_owner_filter_required"});
          learningReads++;
          return json(200,savedLearning?[savedLearning]:[]);
        }
        if(req.method!=="POST" && req.method!=="PATCH"){
          dataWrites++;rejectedWrites.push(route+":"+req.method);return json(403,{error:"fixture_forbidden_mutation"});
        }
        // The real client now uses an INSERT followed by a timestamp-guarded
        // PATCH, not a blind UPSERT. Simulate the unique-key and CAS semantics.
        if(req.method==="POST" && parsed.searchParams.has("on_conflict")){
          dataWrites++;rejectedWrites.push(route+":blind_upsert");
          return json(403,{error:"fixture_requires_versioned_learning_write"});
        }
        if(req.method==="PATCH" &&
          (parsed.searchParams.get("user_id")!=="eq."+USER_ID ||
           !parsed.searchParams.get("updated_at")?.startsWith("eq."))){
          dataWrites++;rejectedWrites.push(route+":unguarded_update");
          return json(403,{error:"fixture_requires_owner_and_version"});
        }
        let content="";
        req.on("data",chunk=>{content+=chunk;if(content.length>120000)req.destroy();});
        req.on("end",()=>{
          let payload;try{payload=JSON.parse(content)}catch{return json(400,{error:"fixture_invalid_learning_data"})}
          if(!payload || (req.method==="POST" && payload.user_id!==USER_ID) ||
             (req.method==="PATCH" && payload.user_id!==undefined) ||
             Object.keys(payload).some(k=>!["user_id","courses","journey"].includes(k)) ||
             !payload.courses || !payload.journey ||
             payload.courses.v!==1 || payload.journey.version!==1){
            dataWrites++;rejectedWrites.push(route+":unsafe_payload");
            return json(403,{error:"fixture_learning_owner_or_shape_denied"});
          }
          if(req.method==="POST" && savedLearning)
            return json(409,{code:"23505",message:"duplicate key on learning owner"});
          if(req.method==="PATCH" &&
             (!savedLearning || savedLearning.updated_at!==parsed.searchParams.get("updated_at")?.slice(3)))
            return json(200,[]);
          const stamp=new Date(Date.now()+learningWrites*1000).toISOString();
          savedLearning={...payload,user_id:USER_ID,updated_at:stamp};
          learningWrites++;
          return json(req.method==="POST"?201:200,req.method==="POST"?[]:[{updated_at:stamp}]);
        });
        return;
      }
      if(route.startsWith("/rest/v1/")){
        if(!["GET","HEAD"].includes(req.method||"")){dataWrites++;rejectedWrites.push(route);return json(403,{error:"fixture_never_mutates"})}
        if(route==='/rest/v1/published_courses' && parsed.searchParams.get('select')?.includes('published_at')){
          publicationReads++;return json(200,showPublications?publications:[]);
        }
        if(route==="/rest/v1/profiles")
          return json(200,[{id:USER_ID,username:"isolated",country:null,bio:null,is_public:false}]);
        return json(200,[]);
      }
      if(!["GET","HEAD"].includes(req.method||""))return json(405,{error:"not_allowed"});
      const pathname=decodeURIComponent(route);
      let file=join(dist,pathname);
      if(pathname.endsWith("/"))file=join(file,"index.html");
      if(!file.startsWith(dist+sep)&&file!==dist)return json(403,{error:"path_denied"});
      if(!existsSync(file)||!statSync(file).isFile()){
        if(pathname.startsWith("/assets/")){res.writeHead(404);res.end();return;}
        file=join(dist,"index.html");
      }
      const serve=()=>{
        res.writeHead(200,{"Content-Type":MIME[extname(file)]||"application/octet-stream"});
        res.end(readFileSync(file));
      };
      if(holdLearnModule && /^\/assets\/Learn-[^.]+\.js$/.test(pathname)){
        releaseLearnModules.push(serve);return;
      }
      serve();
    });
    await new Promise((resolve,reject)=>{
      server.once("error",reject);server.listen(0,"127.0.0.1",resolve);
    });
    const origin="http://127.0.0.1:"+server.address().port;
    const built=spawnSync(process.execPath,["node_modules/vite/bin/vite.js","build","--outDir",dist],{
      cwd:resolve("."),encoding:"utf8",timeout:180000,maxBuffer:3*1024*1024,
      env:{...process.env,VITE_SUPABASE_URL:origin,
        VITE_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_isolated_test_only"}});
    assert.equal(built.status,0,"Isolated build failed: "+String(built.stderr||"").slice(-1200));
    assert.ok(existsSync(join(dist,"index.html")),"Real frontend bundle missing");
    browser=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu",
      "--disable-dev-shm-usage","--disable-background-networking","--disable-extensions",
      "--no-first-run","--remote-allow-origins=*","--remote-debugging-port=0",
      "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
      "--user-data-dir="+profile,"about:blank"],{stdio:"ignore",detached:true});
    let launchError=null;
    browser.once("error",error=>{launchError=error;});
    const port=await waitForChromePort({readPort:()=>{
      const file=join(profile,"DevToolsActivePort");
      return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null;
    },processState:()=>({exitCode:browser.exitCode,signalCode:browser.signalCode}),
      launchError:()=>launchError,delay:sleep});
    const tabs=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
    const tab=tabs.find(x=>x.type==="page");
    assert.ok(tab?.webSocketDebuggerUrl,"Chromium debugging tab unavailable");
    const ws=new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      ws.addEventListener("open",resolve,{once:true});
      ws.addEventListener("error",reject,{once:true});
    });
    devtools=cdpConnection(ws);
    await devtools.send("Page.enable");await devtools.send("Runtime.enable");
    await devtools.send("Network.enable");
    await devtools.send("Network.setBlockedURLs",{urls:["https://*","wss://*"]});
    await devtools.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    // CDP navigation commands acknowledge the request before the old document
    // disappears. Never let an assertion against that old DOM satisfy a wait.
    let navigation=0;
    const loadDocument=async(url)=>{
      const marker=String(++navigation);
      await devtools.evaluate("globalThis.__tradehqFixtureDocument="+JSON.stringify(marker));
      if(url)await devtools.send("Page.navigate",{url});
      else await devtools.send("Page.reload",{ignoreCache:true});
      await wait(()=>devtools.evaluate("globalThis.__tradehqFixtureDocument!=="+JSON.stringify(marker)+
        " && document.readyState==='complete'"),"new document after "+(url?new URL(url).pathname:"reload"));
    };
    // Hold only the compiled lazy route module. A slow connection must leave
    // a visible, accessible loading screen and then resolve to actual Learn.
    await devtools.send("Page.navigate",{url:origin+"/learn"});
    await wait(()=>releaseLearnModules.length===1,"held lazy Learn module");
    await wait(()=>devtools.evaluate("document.querySelector('[role=status]')?.textContent.includes('Loading your page')"),"visible route loading status",3000);
    assert.ok(await devtools.evaluate("document.querySelector('#root')?.innerText.length>60"),"Pending route must not leave a blank root");
    holdLearnModule=false;releaseLearnModules.splice(0).forEach(release=>release());
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('h1')].some(e=>e.textContent.includes('Learn Trading')) && !document.querySelector('[data-route-loading]')"),"Learn after delayed module release");
    console.log("ISOLATED_ROUTE_LOADING_PASS: actual compiled Learn module held; visible accessible loading; actual Learn rendered after release.");
    // Exercise real guest order controls before the fixture signs in. No
    // production data or provider is reachable from this loopback browser.
    await loadDocument(origin+"/trade/btc");
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Amount in BTC\"]')"),"guest asset order panel");
    const guestClick=label=>devtools.evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==="+JSON.stringify(label)+");if(!b||b.disabled)return false;b.click();return true})()");
    const guestAmount=()=>devtools.evaluate("(()=>{const e=document.querySelector('input[aria-label=\"Amount in BTC\"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'0.001');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await guestAmount();await wait(()=>guestClick('Buy BTC'),'enabled guest buy');
    await wait(()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio')||'{}').trades?.length===1"),'guest buy saved');
    const guestBuy=await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))");
    assert.equal(guestBuy.positions[0].quantity,0.001);
    assert.ok(Math.abs(guestBuy.cash-(100000-guestBuy.trades[0].total))<1e-7);
    assert.ok(Math.abs(guestBuy.trades[0].total-guestBuy.trades[0].price*0.001*1.001)<1e-7);
    await wait(()=>devtools.evaluate("document.querySelector('input[aria-label=\"Amount in BTC\"]').value===''"),'guest form cleared');
    await sleep(1100);await guestClick('Sell');await guestAmount();
    await wait(()=>guestClick('Sell BTC'),'enabled guest sell with current holdings');
    await wait(()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio')||'{}').trades?.length===2"),'guest sell saved');
    const guestSold=await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))");
    assert.equal(guestSold.positions.length,0);
    assert.ok(Math.abs(guestSold.cash-(guestBuy.cash+guestSold.trades[0].total))<1e-7);
    await loadDocument();
    assert.equal(await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio')).trades.length"),2);
    await devtools.evaluate("localStorage.removeItem('tradehq_portfolio')");
    console.log('ISOLATED_GUEST_ORDER_PASS: actual compiled asset-page buy/sell, holdings, fee arithmetic and reload persistence; loopback only.');
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.querySelector('main h1')?.textContent==='My Trophy Cabinet'"),"guest private Trophy Cabinet");
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign-in required')"),"guest trophy cannot read trade evidence");
    assert.equal(privateTradeReads,0,"Guest must not query the protected trade ledger");
    await loadDocument(origin+"/auth");
    await wait(()=>devtools.evaluate("!!(document.querySelector('input[type=email]')&&document.querySelector('input[type=password]'))"),"real TradeHQ login form");
    const submit=(mail,pass)=>{
      const values=[mail,pass];
      const expression="(()=>{const inputs=[document.querySelector('input[type=email]'),document.querySelector('input[type=password]')];"+
        "const values="+JSON.stringify(values)+";"+
        "inputs.forEach((el,i)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,values[i]);"+
        "el.dispatchEvent(new Event('input',{bubbles:true}));});"+
        "document.querySelector('button[type=submit]').click();return true;})()";
      return devtools.evaluate(expression);
    };
    await submit(EMAIL,"invalid-fixture-password");
    await wait(()=>rejected===1,"negative Supabase login verification");
    assert.equal(await devtools.evaluate("location.pathname"),"/auth",
      "Invalid password must never enter an authenticated route");
    await wait(()=>devtools.evaluate("!!document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled"),"login UI ready for submission");
    await submit(EMAIL,PASSWORD);
    await wait(()=>approved===1,"positive Supabase fixture login");
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),"authenticated profile redirect");
    await wait(()=>portfolioInitialized>=1,"isolated account portfolio initialization");
    await wait(()=>devtools.evaluate("localStorage.getItem('tradehq:portfolio-owner')==="+JSON.stringify(USER_ID)+" && JSON.parse(localStorage.getItem('tradehq_portfolio')||'{}').trades?.[0]?.id==='fixture-account-trade'"),'account cache restored separately from guest orders');
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.body.textContent.includes('First Recorded Practice Trade')"),"authenticated Trophy milestone");
    await wait(()=>devtools.evaluate("document.querySelector('section[aria-labelledby=recorded-practice-heading] [role=status]')?.textContent.includes('Account-recorded')"),"server-recorded milestone proven");
    assert.ok(privateTradeReads>=1,"Signed-in owner must fetch account-bound evidence");
    assert.equal(privateTradeRejected,0,"No unauthorized or unscoped trade reads allowed");
    await loadDocument(origin+"/trader/me");
    await wait(()=>devtools.evaluate("document.querySelector('main h1')?.textContent.includes('My TradeHQ profile')"),"profile after verified milestone");
    await devtools.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('tradehq_portfolio'));p.trades[0].journal={notes:'PRIVATE ACCOUNT FIXTURE',reasoning:'private',emotions:[]};localStorage.setItem('tradehq_portfolio',JSON.stringify(p));})()");
    // Reload verifies a real persisted SDK session, with no second login grant.
    await loadDocument();
    await wait(()=>devtools.evaluate("!!document.querySelector('[aria-label=\"Account menu\"]')"),"session restored after reload");
    assert.equal(approved,1,"Reload must restore the session without another password grant");
    await wait(()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio')||'{}').trades?.[0]?.journal?.notes==='PRIVATE ACCOUNT FIXTURE'"),'private account journal retained after reload');
    // Exercise the real account menu and Supabase local sign-out request.
    await devtools.evaluate("(()=>{const e=document.querySelector('[aria-label=\"Account menu\"]');if(!e)throw Error('Restored account menu missing');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,ctrlKey:false}));return true;})()");
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent.trim()==='Sign out')"),"account sign-out menu");
    await devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.trim()==='Sign out').click()");
    await wait(()=>logouts===1,"fixture backend sign-out");
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]')"),"signed-out UI");
    const signedOutPortfolio=await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))");
    assert.equal(signedOutPortfolio.trades.length,2,'sign-out must restore guest orders instead of account trades');
    assert.equal(signedOutPortfolio.cash,guestSold.cash);
    assert.ok(!JSON.stringify(signedOutPortfolio).includes('PRIVATE ACCOUNT FIXTURE'),'private account journal leaked into guest practice');
    const readsBeforeSignedOutCabinet=privateTradeReads;
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign-in required')"),"signed-out milestone hidden");
    assert.equal(privateTradeReads,readsBeforeSignedOutCabinet,"Signed-out cabinet must not query the protected trade ledger");
    await loadDocument();
    await wait(()=>devtools.evaluate("!!document.querySelector('a[href=\"/auth\"]') && !document.querySelector('[aria-label=\"Account menu\"]')"),"no session resurrection after reload");
    // Find the actual configured SDK key; seed an expired test session and
    // prove its rejected refresh returns to the signed-out interface.
    await loadDocument(origin+"/auth");
    await wait(()=>devtools.evaluate("!!document.querySelector('input[type=email]')"),"auth form for refresh test");
    await wait(()=>devtools.evaluate("!!document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled"),"login UI ready for submission");
    await submit(EMAIL,PASSWORD);
    await wait(()=>approved===2,"second independent fixture login");
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),"second profile navigation");
    const authKey=await devtools.evaluate("Object.keys(localStorage).find(k=>k.startsWith('sb-')&&k.endsWith('-auth-token'))");
    assert.ok(authKey,"SDK persisted auth storage key missing");
    await devtools.evaluate("(()=>{const k="+JSON.stringify(authKey)+";const s=JSON.parse(localStorage.getItem(k));s.expires_at=1;localStorage.setItem(k,JSON.stringify(s));})()");
    await loadDocument();
    await wait(()=>refreshRejected>=1,"rejected expired refresh token");
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]') && !!document.querySelector('a[href=\"/auth\"]')"),"expired session signed out");
    assert.equal(await devtools.evaluate("localStorage.getItem("+JSON.stringify(authKey)+")"),null,"Rejected refresh must clear persisted credentials");

    // Daily Practice: actual built UI writes an answer snapshot, resumes after
    // reload, completes ten questions and preserves one calendar-day streak.
    await loadDocument(origin+"/daily");
    const dailyReady=()=>devtools.evaluate("!!document.querySelector('#deeper-practice') && [...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Start case study'))");
    const dailyBankReady=async()=>{
      await wait(()=>devtools.evaluate("document.querySelector('#deeper-practice')?.textContent.includes('Bank reviewed by Isolated browser fixture.')"),"authored Daily bank rendered");
      // Allow passive bank-change effects to finish before a user selection.
      await devtools.evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))");
    };
    await wait(dailyReady,"Daily case study");
    await wait(()=>dailyReads>=1,"read-only Daily bank request");
    await dailyBankReady();
    const dailyClick=async text=>{
      const expression="(()=>{const e=[...document.querySelectorAll('#deeper-practice button')].find(e=>e.textContent.trim()==="+JSON.stringify(text)+"&&!e.disabled);if(!e)throw Error('Daily button missing');e.click();return true;})()";
      return devtools.evaluate(expression);
    };
    const stored=()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq:deeper-practice:v1')||'[]').find(p=>typeof p.date==='string'&&Array.isArray(p.answers))");
    await dailyClick("Start case study");
    // Represent another tab's committed first answer before its storage event
    // reaches this tab. This tab's rendered state still has no answers.
    await devtools.evaluate("(()=>{const bank="+JSON.stringify(fixtureBank)+";const now=new Date();const date=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');const n=Math.floor((Date.parse(date)-Date.parse(bank.effectiveFrom))/86400000);const exercise=bank.exercises[((n%bank.exercises.length)+bank.exercises.length)%bank.exercises.length];localStorage.setItem('tradehq:deeper-practice:v1',JSON.stringify([{date,bankId:bank.id,exercise,answers:[1],reflection:''}]));return true;})()");
    for(let i=0;i<10;i++){
      await wait(()=>devtools.evaluate("document.querySelector('#case-study-content fieldset legend') && document.querySelector('#case-study-content').textContent.includes('Question "+(i+1)+" of 10')"),"Daily question "+(i+1));
      await devtools.evaluate("document.querySelector('#case-study-content input[type=radio]').click()");
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.trim()==='Check answer'&&!e.disabled)"),"answer selection");
      await dailyClick("Check answer");
      await wait(async()=>((await stored())?.answers.length===i+1),"persisted Daily answer "+(i+1));
      if(i===0){
        const before=await stored();
        assert.deepEqual(before.answers,[1],"Stale rendered tab must not replace another tab's original answer with its own zero pick");
        await devtools.evaluate("(()=>{const key='tradehq:deeper-practice:v1';const rows=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify([{date:{toString:'invalid'}},...rows]));return true;})()");
        await loadDocument();
        await dailyBankReady();
        await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Continue case study'))"),"saved Daily resume control");
        assert.deepEqual(await stored(),before,"Reload must preserve the exact exercise and original answer");
        await dailyClick("Continue case study"); // UI selects the first unanswered question
      }else if(i<9){await dailyClick("Next question");}
    }
    await wait(()=>devtools.evaluate("document.querySelector('#deeper-practice').textContent.includes('Case complete')"),"completed case score");
    const complete=await stored();assert.equal(complete.answers.length,10);assert.equal(complete.answers[0],1);assert.ok(complete.answers.slice(1).every(a=>a===0));
    const streakKey=await devtools.evaluate("Object.keys(localStorage).find(k=>{try{const v=JSON.parse(localStorage.getItem(k));return v && v.totalCompleted===1 && Array.isArray(v.history)}catch{return false}})");
    assert.ok(streakKey,"Daily completion must persist one streak entry");
    await loadDocument();
    await dailyBankReady();
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Review case study'))"),"completed case restored");
    assert.deepEqual(await stored(),complete,"Completed answers cannot be rewritten by reload");
    await dailyClick("Review case study");
    await wait(()=>devtools.evaluate("!!document.querySelector('#case-study-content fieldset') && document.querySelector('#case-study-content fieldset').disabled"),"completed review opened with locked answers");
    await devtools.evaluate("document.querySelector('article button:not([disabled])').click()");
    await wait(()=>devtools.evaluate("document.querySelector('article').textContent.includes('Decision Review')"),"quick scenario completion");
    assert.equal(await devtools.evaluate("JSON.parse(localStorage.getItem("+JSON.stringify(streakKey)+")).totalCompleted"),1,"Quick and deeper completion must not double-count the day");
    assert.equal(attempts,3,"Both negative and positive real UI attempts required");
    assert.equal(dataWrites,0,"No profile/trade/portfolio writes permitted, even to fixture");
    assert.ok(learningReads>=1,"Authenticated course sync must read the private fixture");
    assert.ok(learningWrites>=1,"Authenticated course sync must save owner-only learning records");
    // Actual compiled admin chat: paused mode, escaped suggestions, explicit draft
    // transfer, forged authority rejection, and late response after lock.
    await loadDocument(origin+'/admin/ai');
    const adminClick=async text=>devtools.evaluate("(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==="+JSON.stringify(text)+"&&!e.disabled);if(!e)throw Error('Admin button missing');e.click();return true})()");
    const adminInput=async(selector,value)=>devtools.evaluate("(()=>{const e=document.querySelector("+JSON.stringify(selector)+");if(!e)throw Error('Admin input missing');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,"+JSON.stringify(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
    const openChat=async()=>{await adminClick('Assistant pilot');await wait(()=>devtools.evaluate("document.body.textContent.includes('Admin assistant · pilot')"),'admin pilot tab');};
    const askChat=async()=>{await adminInput('textarea','Help me draft a mobile spacing improvement for the About page.');await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Ask assistant'&&!e.disabled)"),'chat input accepted');await adminClick('Ask assistant');};
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Admin master key\"]')"),'admin key input');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Assistant pilot')"),'admin workspace unlocked');
    await adminClick('Stop repairs');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign in with the registered owner account')"),'signed-out repair control denial');
    assert.deepEqual(repairRequests,{status:0,stop:0},'No repair API call without a bearer session');
    await loadDocument(origin+'/auth');
    await wait(()=>devtools.evaluate("!!document.querySelector('button[type=submit]')&&!document.querySelector('button[type=submit]').disabled"),'owner fixture sign-in ready');
    await submit(EMAIL,PASSWORD);await wait(()=>approved===3,'owner fixture sign-in');
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),'owner fixture navigation');
    await loadDocument(origin+'/admin/ai');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Admin master key\"]')"),'owner controls admin input');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Repair controls')"),'owner control panel');
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Website coding queue\"]').textContent.includes('No website coding requests')"),'server code queue loaded');
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Code agent learning\"]').textContent.includes('Collecting results')"),'truthful empty learning state');
    await devtools.evaluate("document.querySelector('[aria-label=\"Code worker check-ins\"] summary').click(); true");
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Code worker check-ins\"]').textContent.includes('idle')"),'native-shaped worker check-in rendered');
    await adminInput('[aria-label="Website coding queue"] textarea',chatDraft);
    await adminClick('Submit to coding agent');
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Website coding queue\"]').textContent.includes('OWNER REQUEST QUEUED')"),'owner request and durable activity rendered');
    await adminClick('Submit to coding agent');await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Website coding queue\"] button').disabled"),'idempotent submit finished');
    assert.equal(codeQueueWrites,1,'A deliberate duplicate click must keep the same request key');
    await adminClick('Cancel queued request');
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Website coding queue\"]').textContent.includes('OWNER REQUEST CANCELED')"),'cancellation recorded');
    assert.equal(codeQueueWrites,2);
    console.log('ISOLATED_ADMIN_CODE_QUEUE_BROWSER_PASS: actual compiled owner form submits directly, retries one request identity, renders server audit and cancels queued work. Loopback only; no real code or provider action.');
    codeQueueRows[0]={...codeQueueRows[0],status:'verified',head_sha:'b'.repeat(40),pr_number:168};
    await adminClick('Refresh coding activity');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Review proposal in admin')"),'reviewable proposal loaded');
    await adminClick('Review proposal in admin');
    await wait(()=>devtools.evaluate("!!document.querySelector('[aria-label=\"Proposal code review\"] pre')"),'exact code diff rendered');
    assert.equal(await devtools.evaluate("!!document.querySelector('[aria-label=\"Proposal code review\"] img')"),false,'Patch markup must render as text');
    assert.equal(await devtools.evaluate("window.__proposalHtmlExecuted===true"),false);
    await adminClick('Decline this code proposal');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Waiting for the worker to close the GitHub draft')"),'durable owner decline rendered without falsely claiming closure');
    assert.equal(codeQueueWrites,3);
    console.log('ISOLATED_ADMIN_PROPOSAL_REVIEW_BROWSER_PASS: compiled admin diff, inert patch HTML, exact receipt decline and pending closure acknowledgement. Loopback fixtures; no real proposal/model action.');
    codeQueueReviews=[];await adminClick('Refresh coding activity');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Review proposal in admin')"),'separate publication fixture loaded');
    await adminClick('Review proposal in admin');
    await wait(()=>devtools.evaluate("!!document.querySelector('[aria-label=\"Proposal code review\"] pre')"),'publication diff loaded');
    await adminClick('Approve and publish this exact code');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Publication approved · Waiting for the worker')"),'approval saved without falsely claiming publication');
    assert.equal(codeQueueWrites,4);
    codeQueuePublications[0].state='merged';await adminClick('Refresh coding activity');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Merged; production verification pending')"),'merge remains distinct from production confirmation');
    codeQueuePublications[0].state='published';await adminClick('Refresh coding activity');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Production confirmed on both providers')"),'independent publication confirmation rendered');
    console.log('ISOLATED_ADMIN_PUBLICATION_BROWSER_PASS: actual compiled exact-receipt approval, durable waiting state, separate merge and production confirmation. Loopback fixture; no owner approval or live merge.');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('A stop has not been confirmed')"),'paused controls not advertised as stopped');
    await adminClick('Stop repairs');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Stop confirmed by the server.')"),'durable stop acknowledgement');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('A stop has not been confirmed')"),'forged repair authority rejected');
    await adminClick('Check repair status');await wait(()=>repairRequests.status===3,'delayed status request');
    await adminClick('Stop repairs');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Stop confirmed by the server.')"),'stop interrupts pending status');
    await sleep(650);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Repairs are stopped.')"),true,'Late stale status cannot overwrite a confirmed stop');
    await adminClick('Stop repairs');await wait(()=>repairRequests.stop===3,'pending owner stop');await adminClick('Lock');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Private admin access')"),'owner stop workspace locked');await sleep(650);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Stop confirmed by the server.')"),false,'Late stop cannot revive locked workspace');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Assistant pilot')"),'admin workspace reopened for chat');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign in with the registered owner account')"),'actual owner-session denial is actionable');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('The administrator key could not be verified')"),'actual key denial is distinct from paused controls');
    console.log('ISOLATED_REPAIR_OWNER_BROWSER_PASS: signed-out denial, paused/unverified status, explicit durable stop, forged authority rejection, stop interrupts pending status and late-response lock isolation. Fixture only.');
    await openChat();await askChat();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('The chat pilot is paused or its provider request failed.')"),'paused chat is visible');
    await askChat();await wait(()=>devtools.evaluate("document.body.textContent.includes('Unverified suggestion')"),'unverified reply rendered');
    assert.equal(await devtools.evaluate("window.__modelHtmlExecuted===true"),false,'Model HTML cannot execute');
    assert.equal(await devtools.evaluate("document.querySelectorAll('img[src=x]').length"),0,'Model reply must remain plain text');
    await adminClick('Use as request draft');
    await wait(()=>devtools.evaluate("document.querySelector('textarea')?.value==="+JSON.stringify(chatDraft)),'draft transferred only after owner click');
    await openChat();await askChat();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('assistant response could not be validated')"),'forged merge authority rejected');
    await askChat();await wait(()=>adminChatRequests===4,'pending chat request');await adminClick('Lock');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Private admin access')"),'workspace locked');
    await sleep(650);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Unverified suggestion')"),false,'Late reply cannot revive locked workspace');
    assert.equal(await devtools.evaluate("Object.values(localStorage).some(x=>x.includes("+JSON.stringify(ADMIN_FIXTURE_KEY)+"))"),false,'Admin key cannot be persisted');
    assert.equal(adminChatRequests,4);assert.equal(dataWrites,0);
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Assistant pilot')"),'chat error matrix unlock');
    await openChat();await askChat();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('daily AI-chat attempt has been used.')"),'Daily limit code read from HTTP error body');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Ask assistant').disabled"),true,'Known consumed attempt cannot be submitted again');
    await adminClick('Refresh configuration (no AI attempt)');await sleep(200);
    assert.equal(adminChatRequests,5,'Configuration refresh must not retry AI');
    await adminClick('Lock');await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Assistant pilot')"),'chat permission matrix unlock');
    await openChat();await askChat();await wait(()=>devtools.evaluate("document.body.textContent.includes('Permission denied.')"),'HTTP 403 permission denial');
    await askChat();await wait(()=>devtools.evaluate("document.body.textContent.includes('Administrator access was not verified.')"),'HTTP 401 key denial');
    await askChat();await wait(()=>devtools.evaluate("document.body.textContent.includes('assistant response could not be validated')"),'Empty model reply rejected');
    assert.equal(adminChatRequests,8);await adminClick('Lock');
    console.log('ISOLATED_ADMIN_CHAT_HTTP_ERRORS_PASS: actual HTTP JSON quota, permission/key denial, empty reply and config-only refresh; zero provider requests.');
    console.log('ISOLATED_ADMIN_CHAT_BROWSER_PASS: paused pilot, literal model text, owner-click draft transfer, forged authority denial and late-response lock isolation; fixture only; no real provider calls.');
    // Actual compiled announcements must recover from valid JSON of the wrong
    // shape, retain revision markers across reload and avoid replay on focus.
    showPublications=true;
    const noticeKey='tradehq-seen-course-publications-v1';
    const noticeCount=()=>devtools.evaluate("document.querySelectorAll('button[aria-label^=\"Open new course: \"]').length");
    await devtools.evaluate('localStorage.setItem('+JSON.stringify(noticeKey)+',\'null\')');
    await loadDocument(origin+'/courses');
    await wait(async()=>await noticeCount()===1,'announcement recovered from null history');
    const seen=await devtools.evaluate('JSON.parse(localStorage.getItem('+JSON.stringify(noticeKey)+'))');
    assert.equal(seen[publications[0].slug+':'+publications[0].published_at],true);
    const beforeReload=publicationReads;await loadDocument();
    await wait(()=>publicationReads>beforeReload,'announcement publication read after reload');
    await sleep(250);assert.equal(await noticeCount(),0,'Seen publication cannot replay after reload');
    const beforeFocus=publicationReads;await devtools.evaluate("window.dispatchEvent(new Event('focus'))");
    await wait(()=>publicationReads>beforeFocus,'announcement recheck on focus');
    await sleep(250);assert.equal(await noticeCount(),0,'Seen publication cannot replay on focus');
    await devtools.evaluate('localStorage.setItem('+JSON.stringify(noticeKey)+',\'[]\')');
    await loadDocument();await wait(async()=>await noticeCount()===1,'announcement recovered from array history');
    assert.equal(dataWrites,0,'Unexpected fixture writes: '+rejectedWrites.join(', '));
    console.log('ISOLATED_COURSE_NOTICES_BROWSER_PASS: malformed null/array history recovered, seen revision persisted, reload/focus deduplicated; fixture only.');
    const progressKey='tradehq_course_progress_v1';
    const coursePath='/courses/options-trading-fundamentals';
    const savedLesson={status:'completed',score:4,completedAt:'2026-10-09T15:45:01Z'};
    const retainedTrack={lessons:{retained:savedLesson},badgeEarnedAt:'2026-10-09T15:46:01Z'};
    for(const tracks of [null,{'options-trading-fundamentals':{lessons:null},retained:retainedTrack},{'options-trading-fundamentals':{lessons:{invalid:null}},retained:retainedTrack}]){
      await devtools.evaluate('localStorage.setItem('+JSON.stringify(progressKey)+','+JSON.stringify(JSON.stringify({v:1,tracks,updatedAt:'2026-10-09T15:45:01Z'}))+')');
      await loadDocument(origin+coursePath);
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('h1')].some(x=>x.textContent.includes('Options Trading Fundamentals'))"),'course renders despite malformed progress');
      const link=await devtools.evaluate("[...document.querySelectorAll('main a')].find(x=>x.getAttribute('href')?.startsWith('/courses/options-trading-fundamentals/'))?.getAttribute('href')");
      assert.ok(link,'Actual course lesson link missing');await loadDocument(origin+link);
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(x=>x.textContent.includes('Submit & complete lesson'))"),'lesson mounts and saves recovered progress');
      const after=await devtools.evaluate('JSON.parse(localStorage.getItem('+JSON.stringify(progressKey)+'))');
      assert.ok(Object.values(after.tracks['options-trading-fundamentals'].lessons).some(x=>x.status==='in-progress'));
      if(tracks)assert.deepEqual(after.tracks.retained,retainedTrack,'Valid unrelated completed lesson and badge must survive recovery save');
      await loadDocument();
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(x=>x.textContent.includes('Submit & complete lesson'))"),'recovered lesson survives reload');
    }
    // The real administration UI must never send a generation request while
    // paused, cooling down, at its cap or inside the server's two-minute gap.
    // These statuses are isolated fixtures, never production generation proof.
    await loadDocument(origin+'/admin/daily');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Daily admin unlock');
    await devtools.evaluate("(()=>{const e=document.querySelector('main form input[type=password]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,"+JSON.stringify(ADMIN_FIXTURE_KEY)+");e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('main form button').click();return true;})()");
    const generationButton="[...document.querySelectorAll('main button')].find(e=>e.textContent==='Prepare next part now')";
    const checkBlocked=async message=>{
      await wait(()=>devtools.evaluate('document.querySelector("main").textContent.includes('+JSON.stringify(message)+')'),'Daily readiness: '+message);
      assert.equal(await devtools.evaluate('!!('+generationButton+')?.disabled'),true);
      await devtools.evaluate('('+generationButton+').click()');
      assert.equal(dailyGenerationRequests,0);
    };
    const refreshDaily=()=>devtools.evaluate("[...document.querySelectorAll('main button')].find(e=>e.textContent==='Refresh').click()");
    await checkBlocked('Generation is paused');
    assert.equal(await devtools.evaluate('document.querySelector("main").textContent.includes("20/50 exercises saved · 2/5 parts completed")'),true);
    dailyStatus={...dailyStatus,enabled:true};await refreshDaily();await checkBlocked('Cooling down');
    assert.equal(await devtools.evaluate('document.querySelector("main").textContent.includes("does not establish quota exhaustion")'),true);
    dailyStatus={...dailyStatus,attempts:3,retryAfter:null};await refreshDaily();await checkBlocked('three-attempt limit');
    dailyStatus={...dailyStatus,attempts:2,lastStarted:new Date().toISOString()};await refreshDaily();await checkBlocked('A part started recently');
    dailyStatus={...dailyStatus,lastStarted:null};await refreshDaily();
    await wait(()=>devtools.evaluate('!!('+generationButton+') && !('+generationButton+').disabled'),'Daily manual request available');
    assert.equal(dailyGenerationRequests,0,'Status reads must never automatically request generation');
    await devtools.evaluate('('+generationButton+').click()');
    await wait(()=>dailyGenerationRequests===1,'one explicit isolated Daily generation request');
    await wait(()=>devtools.evaluate('!('+generationButton+').disabled'),'Daily request finished');
    assert.equal(dailyGenerationRequests,1);
    assert.equal(dataWrites,0);
    console.log('ISOLATED_DAILY_GENERATION_READINESS_PASS: paused/cooldown/cap/recent-start controls blocked; saved part counts visible; only an explicit eligible click requested generation; zero real provider calls.');
    // Review triage uses actual compiled components and existing private-list data.
    // Deliberate duplicate wording here is a fixture, never a real AI draft.
    const reviewDocument=structuredClone(fixtureBank);
    reviewDocument.exercises[1].scenario=reviewDocument.exercises[0].scenario;
    reviewDocument.exercises[1].questions[1].prompt=reviewDocument.exercises[1].questions[0].prompt;
    reviewDocument.exercises[1].questions[2].explanation=reviewDocument.exercises[1].questions[0].explanation;
    dailyDrafts=[{id:'fixture-review-draft',status:'draft',revision:1,document:reviewDocument,
      research:{model:'gemini-3.5-flash-lite', usage:{inputTokens:123,outputTokens:456,totalTokens:579},
        checks:['Structure checks passed; owner must review accuracy before publication.']}},
      {id:'fixture-approved-bank',status:'published',revision:2,document:fixtureBank},
      {id:'fixture-rejected-bank',status:'rejected',revision:3,document:{...fixtureBank,effectiveFrom:'2026-12-09'}}];
    const documentsBefore=JSON.stringify(dailyDrafts);
    await refreshDaily();
    await wait(()=>devtools.evaluate("document.querySelectorAll('aside button').length===3"),'Daily bank review queue loaded');
    await devtools.evaluate("document.querySelector('aside button').click()");
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Editorial review overview\"]')?.textContent.includes('50 exercises · 500 scored questions')"),'Daily editorial coverage');
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Daily generation provenance\"]')?.textContent.includes('final successful 10-case part only')"),'Scoped provider usage visible to Daily editor');
    assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Daily generation provenance\"]').textContent.includes('input 123 · output 456 · total 579')"),true);
    assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Daily generation provenance\"]').textContent.includes('not the five-part cycle total, live remaining quota')"),true);
    assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Generator checks, not owner approval\"]').textContent.includes('owner must review accuracy')"),true);
    assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Editorial review overview\"]').textContent.includes('do not verify facts, calculations')"),true);
    assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Editorial review overview\"]').textContent.includes('reuses the explanation')"),true);
    await devtools.evaluate("[...document.querySelectorAll('[aria-label=\"Editorial review overview\"] button')].find(e=>e.textContent.startsWith('Inspect exercise 2:')).click()");
    await wait(()=>devtools.evaluate("document.querySelector('[aria-label=\"Exercise review\"] h2')?.textContent==="+JSON.stringify(reviewDocument.exercises[1].title)), 'Flag opens the correct answer/explanation preview');
    // The editor moves focus in requestAnimationFrame after its React update.
    await wait(()=>devtools.evaluate("document.activeElement?.getAttribute('aria-label')==='Exercise review'"),'Keyboard focus follows review jump');
    assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Exercise review\"]').textContent.includes('— correct')"),true);
    for(const status of ['draft','published','rejected']){
      await devtools.evaluate("(()=>{const e=document.querySelector('aside select');e.value="+JSON.stringify(status)+";e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
      await wait(()=>devtools.evaluate("document.querySelectorAll('aside button').length===1"),'Daily queue filter '+status);
      assert.equal(await devtools.evaluate("document.querySelector('aside button').textContent.includes("+JSON.stringify(status==='draft'?'Awaiting review':status==='published'?'Approved':'rejected')+")"),true);
    }
    assert.equal(JSON.stringify(dailyDrafts),documentsBefore,'Review and filtering cannot edit draft documents');
    assert.equal(dailyEditorialWrites,0);assert.equal(dailyGenerationRequests,1,'Review must not request regeneration');
    await devtools.evaluate("(()=>{const e=document.querySelector('aside select');e.value='published';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await wait(()=>devtools.evaluate("document.querySelector('aside button')?.textContent.includes('Approved')"),'approved fixture filter');
    await devtools.evaluate("document.querySelector('aside button').click()");
    await wait(()=>devtools.evaluate("!document.querySelector('footer input[type=checkbox]').disabled"),'saved bank review available');
    await devtools.evaluate("document.querySelector('footer input[type=checkbox]').click()");
    await adminInput('input[type=date]','2027-01-01');
    assert.equal(await devtools.evaluate("document.querySelector('footer input[type=checkbox]').checked"),false,'Daily edit invalidates exact-bank review');
    await devtools.evaluate("window.confirm=()=>false;document.querySelector('header a[href=\"/admin\"]').click()");
    assert.equal(await devtools.evaluate('location.pathname'),'/admin/daily','Denied navigation must preserve unsaved Daily draft');

    await adminInput('input[type=date]',fixtureBank.effectiveFrom);
    dailyDrafts[1]={...dailyDrafts[1],revision:3};await refreshDaily();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('This bank changed on the server')"),'Daily remote revision conflict');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent==='Reject private draft').disabled"),true,'Stale bank cannot be rejected');
    assert.equal(await devtools.evaluate("document.querySelector('footer input[type=checkbox]').disabled"),true,'Stale bank cannot be reviewed');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
    assert.equal(await devtools.evaluate("document.documentElement.scrollWidth <= innerWidth+1"),true,'Daily desk fits a 320px viewport');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await devtools.evaluate("window.confirm=()=>true;document.querySelector('header a[href=\"/admin/courses\"]').click()");
    assert.equal(await devtools.evaluate('location.pathname'),'/admin/courses','Approved discard follows the Daily desk link');
    console.log('ISOLATED_DAILY_REVISION_RECOVERY_PASS: edits clear review; new remote revision blocks review/reject; 320px layout; no editorial writes.');
    console.log('ISOLATED_DAILY_EDITORIAL_REVIEW_PASS: 50-case/500-question overview, duplicate-case/question/explanation triage, correct preview/focus, three queue filters; zero editorial mutations or extra generation requests. Fixture only.');
    // The compiled dashboard consumes existing desks and bounded GitHub reads.
    // GitHub responses are intercepted in this fixture document; HTTPS remains blocked.
    dashboardFixture=true;dailyStatus={...dailyStatus,retryAfter:new Date(Date.now()+3600000).toISOString()};
    await devtools.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
      const original=window.fetch;
      window.fetch=async(input,init)=>{
        const url=String(input);if(!url.startsWith('https://api.github.com/repos/anugaweerasinghe1-del/trading101/'))return original(input,init);
        if(window.__fixtureGitHubUnavailable)return new Response('{}',{status:503,headers:{'Content-Type':'application/json'}});
        if(window.__fixtureGithubHistory && url.includes('/issues?')){
          const page=Number(new URL(url).searchParams.get('page')||1);
          const data=window.__fixtureGithubCap||page===1?Array.from({length:100},(_,i)=>({id:2000+i,number:2000+i,title:'Newer PR',pull_request:{}})):[
            {number:94,title:'[TradeHQ Code Request]',state:'open',user:{login:'anugaweerasinghe1-del'},html_url:'https://github.com/anugaweerasinghe1-del/trading101/issues/94'},
            {id:69,number:69,title:'[TradeHQ Ideas] Fixture older ideas',state:'open',user:{login:'github-actions[bot]'},html_url:'https://github.com/anugaweerasinghe1-del/trading101/issues/69'},
            {id:70,number:70,title:'[TradeHQ Agent] Older fixture failures',state:'open',created_at:new Date().toISOString(),html_url:'https://github.com/anugaweerasinghe1-del/trading101/issues/70'}];
          return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
        }
        if(window.__fixtureGithubHistory && url.includes('/pulls?'))return new Response('[]',{status:200,headers:{'Content-Type':'application/json'}});
        const run={id:700,status:'completed',conclusion:'success',html_url:'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/700',created_at:new Date().toISOString(),head_sha:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'};
        const data=url.includes('/issues?')?[{id:900,title:'[TradeHQ Agent] Fixture browser failures',state:'open',created_at:new Date().toISOString(),html_url:'https://github.com/anugaweerasinghe1-del/trading101/issues/900'}]
          :url.includes('/pulls?')?[{number:901,title:'AI proposal: isolated fixture',draft:false,created_at:new Date().toISOString(),html_url:'https://github.com/anugaweerasinghe1-del/trading101/pull/901'}]
          :url.includes('/jobs?')?{jobs:[]}:url.includes('/check-runs?')?{check_runs:[]}:{workflow_runs:[run]};
        return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
      };
    })()`});
    await loadDocument(origin+'/admin');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Dashboard master key');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Open dashboard');
    const inbox="document.querySelector('[aria-label=\"Automation work queue\"]')";
    const refreshInbox=async()=>{
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Refresh'&&!e.disabled)"),'Dashboard refresh idle');
      await adminClick('Refresh');
    };
    await wait(()=>devtools.evaluate(inbox+"?.textContent.includes('1 open AI code proposal')"),'Unified live-source work queue');
    for(const text of ['2 course drafts awaiting review','1 daily bank draft awaiting review','1 newsletter draft awaiting review','1 course generation failure','1 open monitoring finding','Cooldown ends'])assert.equal(await devtools.evaluate(inbox+'.textContent.includes('+JSON.stringify(text)+')'),true,text);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Commit aaaaaaaaaaaa')"),true,'Collector evidence shows the sampled immutable commit');
    assert.equal(await devtools.evaluate("[..."+inbox+".querySelectorAll('a')].every(link=>['/admin/courses','/admin/daily','/admin/newsletter','/admin/ai'].includes(link.getAttribute('href')))"),true);
    await adminClick('Inspect monitoring evidence ↓');
    assert.equal(await devtools.evaluate('document.activeElement.id'),'monitor-findings','Finding action focuses its actual evidence without reloading the private desk');
    dailyStatus={...dailyStatus,attempts:3};await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+".textContent.includes('three-attempt limit')"),'Attempt cap takes precedence over cooldown');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('Cooldown ends')"),false);
    dailyStatus={...dailyStatus,attempts:2};await devtools.evaluate('window.__fixtureGitHubUnavailable=true');await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+".textContent.includes('Agent findings and code queue unavailable')"),'GitHub outage is not an empty queue');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('1 open AI code proposal')"),false);
    await devtools.evaluate('window.__fixtureGitHubUnavailable=false');
    dailyQueueUnavailable=true;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+"?.textContent.includes('Daily bank review queue unavailable')"),'One unavailable desk remains unknown');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('2 course drafts awaiting review')"),true,'Course review remains accessible during a Daily outage');
    dailyQueueUnavailable=false;newsletterQueueUnavailable=true;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+".textContent.includes('Newsletter review queue unavailable')"),'Unavailable Newsletter desk cannot masquerade as an empty queue');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('2 course drafts awaiting review')"),true,'Course review remains accessible during a Newsletter outage');
    newsletterQueueUnavailable=false;
    dashboardSettingsUnavailable=true;await refreshInbox();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Previous data may be stale')"),'Failed refresh discloses stale snapshot');
    assert.equal(dailyEditorialWrites,0);assert.equal(dailyGenerationRequests,1);assert.ok(dashboardMetadataRequests>=6);
    dashboardSettingsUnavailable=false;dashboardHold=true;await refreshInbox();
    await wait(()=>dashboardHeldRequests>0,'Held dashboard request before lock');
    await adminClick('Lock');
    await sleep(800);
    assert.equal(await devtools.evaluate('!!'+inbox),false,'Lock removes private inbox and ignores a late refresh');
    assert.equal(await devtools.evaluate("document.querySelector('main form input[type=password]')?.value"),'','Lock clears the in-memory master key');
    // Actual compiled newsletter: reconnect updates counters/revisions while
    // preserving local writing, without generation, approval or distribution.
    await loadDocument(origin+'/admin/newsletter');
    await wait(()=>devtools.evaluate("!!document.querySelector('#newsletter-key')"),'Newsletter unlock');
    await adminInput('#newsletter-key',ADMIN_FIXTURE_KEY);await adminClick('Unlock drafts');
    await wait(()=>devtools.evaluate("!!document.querySelector('#newsletter-subject')"),'Newsletter editor loaded');
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Refresh'&&!e.disabled)"),'Newsletter reads idle');
    await adminInput('#newsletter-subject','Unsaved isolated owner writing');
    await devtools.evaluate("window.confirm=()=>false;document.querySelector('header a[href=\"/admin\"]').focus()");
    await devtools.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await devtools.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    assert.equal(await devtools.evaluate('location.pathname'),'/admin/newsletter' ,'Denied navigation must preserve unsaved newsletter writing');
    assert.equal(await devtools.evaluate("document.querySelector('#newsletter-subject').value"),'Unsaved isolated owner writing');
    newsletterRevision=2;newsletterConfirmed=7;const beforeNewsletterReads=newsletterReads;
    await devtools.evaluate("window.dispatchEvent(new Event('online'))");
    await wait(()=>newsletterReads>beforeNewsletterReads,'Reconnect requests fresh newsletter metadata');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('This edition changed on the server')"),'Newsletter conflict shown without replacing edits');
    assert.equal(await devtools.evaluate("document.querySelector('#newsletter-subject').value"),'Unsaved isolated owner writing');
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('p')].some(e=>e.textContent==='Confirmed' && e.parentElement.textContent.includes('7'))"),'Subscriber counts updated on reconnect');
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('p')].some(e=>e.textContent==='Confirmed' && e.parentElement.textContent.includes('7'))"),'Subscriber counts updated on reconnect');
    assert.equal(newsletterWrites,0,'Polling must not generate, approve, publish or send');
    for(const status of ['accepted','delivered','unknown'])assert.equal(await devtools.evaluate("document.querySelector('[aria-label=\"Newsletter delivery history\"]').textContent.includes("+JSON.stringify('Recorded status: '+status)+")"),true,'Newsletter renders recorded '+status);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('private-provider-id')"),false,'Provider IDs stay out of rendered receipts');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent==='Save edits').disabled"),true,'Conflicting newsletter revision cannot save');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
    assert.equal(await devtools.evaluate("document.documentElement.scrollWidth <= innerWidth+1"),true,'Newsletter desk fits a 320px viewport');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    newsletterEditorialFixture=true;
    await devtools.evaluate("window.confirm=()=>true");await adminClick('Refresh');
    await wait(()=>devtools.evaluate("document.querySelector('#newsletter-subject').value==='Saved fixture subject'"),'Newsletter saved revision reopened');
    await adminClick("Preview next week's AI issue");
    await wait(()=>newsletterPreviewCalls===1,'One unsaved upcoming preview requested');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Week of 2026-11-09 · unsaved')"),'Upcoming preview marked unsaved');
    assert.equal(newsletterWrites,0,'Upcoming preview cannot store or approve an edition');
    assert.equal(await devtools.evaluate("document.querySelector('#newsletter-subject').value"),'Saved fixture subject','Upcoming sample cannot overwrite current editor');
    await adminInput('#newsletter-subject','Unsaved draft that must survive a canceled preview');
    await devtools.evaluate("window.confirm=()=>false");await adminClick('Draft a deeper lesson (preview only)');
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Draft a deeper lesson (preview only)'&&!e.disabled)"),'Canceled preview returns control');
    assert.equal(newsletterPreviewCalls,1,'Declining discard must prevent the provider request');
    assert.equal(await devtools.evaluate("document.querySelector('#newsletter-subject').value"),'Unsaved draft that must survive a canceled preview');
    await devtools.evaluate("window.confirm=()=>true");await adminClick('Draft a deeper lesson (preview only)');
    await wait(()=>devtools.evaluate("document.querySelector('#newsletter-subject').value==='Preview fixture subject'"),'AI rewrite reaches temporary editor');
    assert.equal(newsletterPreviewCalls,2);assert.equal(newsletterWrites,0,'Rewrite preview remains unsaved');
    assert.equal(await devtools.evaluate("window.__newsletterHtmlExecuted===true || document.querySelectorAll('img[src=x]').length>0"),false,'Preview HTML remains inert textarea text');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent==='Approve draft (no email sent)').disabled"),true,'Unsaved preview cannot be approved');
    await adminClick('Save edits');
    await wait(()=>newsletterEdition.revision===3,'Private preview saved as one new revision');
    await wait(()=>devtools.evaluate("!document.body.textContent.includes('Unsaved AI preview.')"),'Saved preview label cleared');
    assert.equal(newsletterEdition.status,'draft','Save cannot approve');
    assert.equal(await devtools.evaluate("document.querySelector('input[type=checkbox]').checked"),false,'Saved revision requires fresh owner review');
    await adminInput('#newsletter-reviewer','Fixture editorial reviewer');
    await devtools.evaluate("document.querySelector('input[type=checkbox]').click()");
    await adminClick('Approve draft (no email sent)');
    await wait(()=>newsletterEdition.status==='approved','Explicit editorial approval stored');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Approved by Fixture editorial reviewer')"),'Approved reviewer shown accurately');
    await adminClick('Verify owner access (no email)');
    await wait(()=>devtools.evaluate("document.body.textContent.includes("+JSON.stringify("Newsletter sending requires the registered owner's current TradeHQ login")+")"),'Owner send authorization denial visible');
    assert.equal(newsletterWrites,2,'Exactly one private save and one approval; no automatic writes');
    assert.equal(newsletterPublishRequests,0,'No email dispatch request during preview/save/approval/readiness');
    newsletterEditorialFixture=false;
    await devtools.evaluate("window.confirm=()=>{throw Error('Clean navigation must not prompt')};document.querySelector('header a[href=\"/admin\"]').click()");
    assert.equal(await devtools.evaluate('location.pathname'),'/admin','Saved newsletter can navigate without a discard prompt');
    console.log('ISOLATED_NEWSLETTER_EDITORIAL_PREVIEW_PASS: upcoming sample and rewrite remain unsaved; canceled discard prevents model request; inert HTML; exact revision save then separate approval; owner-readiness denial; zero email dispatch requests. Loopback only.');
    console.log('ISOLATED_ADMIN_REFRESH_PASS: late dashboard refresh cannot reopen lock; newsletter reconnect refresh preserves unsaved writing and reports remote revision; no editorial or email mutations.');
    // Browser-only admin acceptance: exercise the actual Course desk with a
    // strictly read-only loopback backend. These interactions must never send
    // generation, draft-save, publication or configuration writes.
    dashboardFixture=false;courseDeskFixture=true;
    await loadDocument(origin+'/admin/courses');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Course admin unlock');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Open course desk');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Draft inbox (0)')"),'Compiled empty Course inbox');
    await adminClick('Generation settings');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Monthly course drafts')"),'Compiled generation settings');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Generate next draft')?.disabled"),true,
      'Course generation must be disabled without saved free-tier owner configuration');
    await adminClick('Draft inbox (0)');
    await adminClick('+ Create a draft');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Final approval')"),'Course draft editor');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Approve and publish')?.disabled"),true,
      'An unsaved Course draft can never be approved');
    await devtools.evaluate("window.confirm=()=>false");
    await devtools.evaluate("document.querySelector('header a[href=\"/admin\"]').click()");
    assert.equal(await devtools.evaluate('location.pathname'),'/admin/courses','Denied navigation must preserve unsaved course draft');
    await adminClick('Lock');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Final approval')"),true,
      'Course lock must respect rejected discard confirmation');
    await devtools.evaluate("window.confirm=()=>true");
    await adminClick('Lock');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Course locked and private editor gone');
    assert.equal(await devtools.evaluate("document.querySelector('main form input[type=password]').value"),'');
    assert.equal(courseDeskWrites,0,'Course read/edit/lock smoke cannot mutate drafts or launch AI');
    courseDeskFixture=false;
    console.log('ISOLATED_ADMIN_COURSE_DESK_BROWSER_PASS: open, inspect settings, disabled generation, new unsaved draft, blocked publish, protected lock, key clearing, zero course writes; fixture only.');
    // A separate disposable branch of this fixture also verifies successful
    // owner-click draft-save wiring. Never accept publish or configure actions.
    courseMutationFixture=true;courseDeskFixture=true;
    await loadDocument(origin+'/admin/courses');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Course save unlock');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Open course desk');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Draft inbox (0)')"),'Course save inbox loaded');
    await adminClick('+ Create a draft');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Final approval')"),'Course save editor opened');
    await adminClick('Save draft');
    await wait(()=>courseDeskRows.length===1,'One explicit private course draft saved');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Draft inbox (1)')"),'Course saved draft appears in the real inbox');
    assert.deepEqual(courseWriteLog,['save'],'Creating a private course draft must not request approval or generation');
    assert.equal(courseDeskRows[0].status,'draft');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Approve and publish')?.disabled"),true,
      'A newly saved but unreviewed draft must not publish');
    await adminClick('Lock');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Saved draft desk locked');
    courseMutationFixture=false;courseDeskFixture=false;
    console.log('ISOLATED_ADMIN_COURSE_SAVE_BROWSER_PASS: owner-click private draft saved exactly once, reflected in inbox, no generation or publish. No production writes.');

    courseMutationFixture=true;courseDeskFixture=true;
    const reviewedCourse=JSON.parse(readFileSync('scripts/fixtures/published-course-editorial.json','utf8'))[0].document;
    reviewedCourse.lessons.forEach((lesson, index)=>{lesson.body[1]+=' Hypothetical worksheet '+(index+1)+': calculate a 1% change on $100; the amount equals $1 before fees.';});
    courseDeskRows=[{id:'fixture-course-private-draft',status:'draft',revision:1,published_revision:0,document:reviewedCourse}];
    await loadDocument(origin+'/admin/courses');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Course revision fixture unlock');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Open course desk');
    await wait(()=>devtools.evaluate("document.querySelectorAll('aside button').length===2"),'Course revision fixture inbox');
    await devtools.evaluate("document.querySelectorAll('aside button')[1].click()");
    await wait(()=>devtools.evaluate("!!document.querySelector('input[type=checkbox]')"),'Course exact-revision review');
    await devtools.evaluate("document.querySelector('input[type=checkbox]').click()");
    await adminClick('Approve and publish');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('No publication was authorized.')"),'Registered-owner denial displayed from HTTP 403');
    assert.equal(courseDeskRows[0].status,'draft','Unauthorized fixture publication must stay private');
    await adminInput('section fieldset input',reviewedCourse.title+' edited');
    assert.equal(await devtools.evaluate("document.querySelector('input[type=checkbox]').checked"),false,'Course edit clears prior exact-revision approval');
    courseFailRefreshAfterSave=true;
    await adminClick('Save draft');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('action was confirmed, but the inbox could not refresh')"),'Confirmed save followed by refresh failure is recoverable');
    assert.equal(courseDeskRows[0].revision,2,'Private draft saved once despite refresh outage');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Saved · Revision 2')"),true,'Confirmed revision retained in editor');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Save draft').disabled"),true,'No duplicate save while inbox is unconfirmed');
    courseListUnavailable=false;courseFailRefreshAfterSave=false;await adminClick('Refresh');
    await wait(()=>devtools.evaluate("!document.body.textContent.includes('action was confirmed, but the inbox could not refresh')"),'Course inbox recovers');
    await devtools.evaluate("document.querySelector('input[type=checkbox]').click()");
    courseDeskRows[0]={...courseDeskRows[0],revision:3};await adminClick('Refresh');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('This draft changed on the server')"),'Remote course revision displayed');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='Approve and publish').disabled"),true,'Stale saved course cannot publish');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
    assert.equal(await devtools.evaluate("document.documentElement.scrollWidth <= innerWidth+1"),true,'Course desk fits a 320px viewport');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await adminClick('Lock');courseMutationFixture=false;courseDeskFixture=false;
    console.log('ISOLATED_ADMIN_COURSE_REVISION_RECOVERY_PASS: owner-denied publish with JWT; edit clears approval; confirmed private save survives inbox outage; stale revision blocks publication; 320px layout. Fixture only.');


    // The Reviews desk is also exercised with a real rendered review, an
    // unsaved local edit and both branches of the owner discard confirmation.
    reviewDeskFixture=true;
    await loadDocument(origin+'/admin/reviews');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Master key\"]')"),'Reviews admin unlock');
    await adminInput('input[aria-label="Master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
    await wait(()=>devtools.evaluate("document.querySelector('h1')?.textContent==='Reviews (1)'"),'Private moderation row visible');
    await adminInput('input[aria-label="Review author name"]','Unsaved isolated review name');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('You have unsaved review changes')"),'Review edit marked unsaved');
    await devtools.evaluate("window.confirm=()=>false");
    await adminClick('Lock admin panel');
    assert.equal(await devtools.evaluate("document.querySelector('h1')?.textContent==='Reviews (1)'"),true,
      'Review lock must preserve unsaved changes when discard denied');
    await devtools.evaluate("window.confirm=()=>true");
    await adminClick('Lock admin panel');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Master key\"]')"),'Review desk locked');
    assert.equal(await devtools.evaluate("document.querySelector('input[aria-label=\"Master key\"]').value"),'');
    assert.equal(reviewDeskWrites,0,'Review read/edit/lock smoke cannot publish replies or modify reviews');
    reviewDeskFixture=false;
    console.log('ISOLATED_ADMIN_REVIEWS_BROWSER_PASS: real review loaded, unsaved moderation protected on lock, private content and key cleared, no moderation writes; fixture only.');
    // Exercise intentional update + public reply submissions only inside the
    // disposable mock; only the explicit review fixture can be mutated.
    reviewMutationFixture=true;reviewDeskFixture=true;
    await loadDocument(origin+'/admin/reviews');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Master key\"]')"),'Review write unlock');
    await adminInput('input[aria-label="Master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
    await wait(()=>devtools.evaluate("document.querySelector('h1')?.textContent==='Reviews (1)'"),'Review writable fixture loaded');
    reviewListUnavailable=true;
    await adminInput('input[aria-label="Review author name"]','Updated fixture reviewer');
    await adminClick('Save');
    await wait(()=>reviewFixtureRow.name==='Updated fixture reviewer','Intentional review edit reached server');
    await wait(()=>devtools.evaluate("document.querySelector('input[aria-label=\"Review author name\"]')?.value==='Updated fixture reviewer'"),'Saved review returned to actual input');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Saved on the server; refresh reviews')"),'Confirmed review update survives read outage');
    reviewListUnavailable=false;await adminClick('Refresh reviews');
    await wait(()=>devtools.evaluate("!document.body.textContent.includes('Saved on the server; refresh reviews')"),'Review edit refresh recovers');
    reviewListUnavailable=true;
    await adminInput('#reply-aaaa1111-2222-4333-8444-555555555555','Fixture owner public reply');
    await adminClick('Save reply');
    await wait(()=>reviewFixtureRow.owner_reply==='Fixture owner public reply','Intentional review reply reached server');
    assert.deepEqual(reviewWriteLog,['update','reply'],'No unexpected moderation actions, delete or restore');
    await wait(()=>devtools.evaluate("document.querySelector('#reply-aaaa1111-2222-4333-8444-555555555555')?.value==='Fixture owner public reply'"),'Saved reply persisted in UI');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Saved on the server; refresh reviews before making another change to this review.')"),'Confirmed reply is distinct from failed list refresh');
    assert.equal(await devtools.evaluate("document.querySelector('#reply-aaaa1111-2222-4333-8444-555555555555').disabled || document.querySelector('#reply-aaaa1111-2222-4333-8444-555555555555').matches(':disabled')"),true,'Confirmed row cannot submit again while refresh is unavailable');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('You have unsaved review changes')"),false,'Confirmed reply is not reported as an unsaved draft');
    reviewListUnavailable=false;await adminClick('Refresh reviews');
    await wait(()=>devtools.evaluate("!document.body.textContent.includes('Saved on the server; refresh reviews')"),'Confirmed moderation refresh recovers');
    assert.equal(await devtools.evaluate("document.querySelector('#reply-aaaa1111-2222-4333-8444-555555555555').value"),'Fixture owner public reply');
    assert.deepEqual(reviewWriteLog,['update','reply'],'Refresh recovery must not repeat any moderation write');
    for (const action of ['delete','restore']) {
      reviewListUnavailable=true;
      await devtools.evaluate("window.confirm=()=>true");
      await adminClick(action==='delete'?'Delete review':'Restore review');
      await wait(()=>devtools.evaluate("document.body.textContent.includes('Saved on the server; refresh reviews')"),'Confirmed '+action+' survives read outage');
      assert.equal(!!reviewFixtureRow.deleted_at,action==='delete');
      assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(e=>/Delete review|Restore review/.test(e.textContent)).matches(':disabled')"),true,'Confirmed '+action+' cannot repeat');
      reviewListUnavailable=false;await adminClick('Refresh reviews');
      await wait(()=>devtools.evaluate("!document.body.textContent.includes('Saved on the server; refresh reviews')"),'Authoritative '+action+' refresh recovers');
      assert.equal(await devtools.evaluate("document.body.textContent.includes('Deleted from public view')"),action==='delete');
    }
    assert.deepEqual(reviewWriteLog,['update','reply','delete','restore'],'Read outages never repeat confirmed mutations');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true});
    assert.equal(await devtools.evaluate("document.documentElement.scrollWidth <= innerWidth+1"),true,'Reviews recovery fits 320px');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await adminClick('Lock admin panel');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Master key\"]')"),'Review mutation desk locked');
    reviewMutationFixture=false;reviewDeskFixture=false;
    console.log('ISOLATED_ADMIN_REVIEW_SAVE_BROWSER_PASS: edit/reply/delete/restore survive list HTTP503, confirmed rows block repeat writes, authoritative recovery and 320px layout; disposable fixture only, zero production writes.');


    console.log('ISOLATED_ADMIN_DRAFT_NAVIGATION_PASS: canceled Course/Daily links and keyboard Newsletter navigation retain unsaved writing, approved discard navigates, saved writing leaves without a prompt. No extra editorial/provider/email requests.');
    // The actual AI desk must find requests older than a page of newer PRs.
    await devtools.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.__fixtureGithubHistory=true'});
    await loadDocument(origin+'/admin/ai');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Admin master key\"]')"),'AI history desk unlock');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Request #94')"),'Older owner request visible beyond first page');
    await adminClick('Monthly ideas');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('[TradeHQ Ideas] Fixture older ideas')"),'Older monthly report visible');
    await adminClick('AI code requests');
    await devtools.evaluate('window.__fixtureGithubCap=true');await adminClick('Refresh activity');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Issue history is partial')"),'Capped history disclosed');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('No code requests submitted yet') || document.body.textContent.includes('No code requests returned.')"),false,'Partial empty history is never a verified empty request list');
    await devtools.evaluate('window.__fixtureGitHubUnavailable=true');await adminClick('Refresh activity');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Previous GitHub proposal and validation snapshots were cleared')"),'GitHub page error clears earlier history');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Request #94')"),false,'Failed refresh cannot retain stale request evidence');
    await adminClick('Monthly ideas');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Idea history cannot be verified')"),true,'Unknown idea history is not a claim that no report was ever generated');
    dashboardFixture=true;dashboardHold=false;
    await loadDocument(origin+'/admin');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Paginated dashboard unlock');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Open dashboard');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('[TradeHQ Agent] Older fixture failures')"),'Dashboard includes older open findings beyond first page');
    await devtools.evaluate('window.__fixtureGithubCap=true');await refreshInbox();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('issue reports partial (read limit reached)')"),'Dashboard read cap is disclosed');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('Agent findings and code queue unavailable')"),true,'Partial issue history cannot become an authoritative zero queue count');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('No open findings reported.')"),false,'Partial history cannot claim no findings');
    await adminClick('Lock');dashboardFixture=false;
    console.log('ISOLATED_ADMIN_GITHUB_HISTORY_PASS: actual AI desk paginates older requests/ideas, discloses bounded incomplete history and clears failed snapshots; public loopback fixtures only.');

    // Development-only utility routes still mount and communicate their
    // deliberately limited scope without automatically contacting a provider.
    await loadDocument(origin+'/admin/validator');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Asset Route Definition Check')"),'Local link validator page');
    await adminClick('Check Local Routes');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('related-market targets exist')"),'Local route definitions evaluated');
    await loadDocument(origin+'/admin/editor');
    await wait(()=>devtools.evaluate("location.pathname==='/admin/courses'"),'Legacy editor redirects to Course desk');
    await loadDocument(origin+'/admin/seo-audit');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Live HTML metadata check')"),'Live HTML audit utility mounts');
    console.log('ISOLATED_ADMIN_UTILITIES_BROWSER_PASS: asset validator, legacy editor redirect and HTML audit route mount; no production URL scan or privileged backend writes.');

    console.log('ISOLATED_AUTOMATION_INBOX_PASS: compiled dashboard combines course, Daily and Newsletter drafts, failures, cooldown, open findings and proposals; collector evidence linked to commit; partial outage stays unknown; stale refresh disclosed; zero mutations. Fixture only.');
    console.log('ISOLATED_COURSE_PROGRESS_BROWSER_PASS: null tracks, null lessons and invalid lesson rows recovered; valid unrelated completion/badge retained after real lesson save and reload; fixture only.');
    console.log("ISOLATED_AUTH_BROWSER_PASS: reload persistence; real UI sign-out; no resurrected session; expired refresh rejected; ten Daily answers persisted/resumed/locked; one streak per day; actual built TradeHQ login in real Chromium; negative password refused; fake Supabase grant accepted; authenticated profile navigation observed; isolated account initialization executed; zero non-allowlisted backend writes; zero real provider calls.");
  }finally{
    holdLearnModule=false;releaseLearnModules.splice(0).forEach(release=>release());
    // Wait for Chrome to exit before deleting its still-active profile files.
    // Otherwise a successful browser assertion can randomly fail on ENOTEMPTY.
    devtools?.close();
    if(browser?.pid){
      // Chrome launches child renderers. Kill this dedicated process group,
      // not only the launcher, so no profile writers survive fixture teardown.
      const exited=browser.exitCode===null && browser.signalCode===null
        ? once(browser,"exit").catch(()=>undefined) : Promise.resolve();
      try{process.kill(-browser.pid,"SIGKILL");}
      catch(error){if(error.code!=="ESRCH")throw error;}
      await Promise.race([exited,sleep(2500)]);
    }
    if(server)await new Promise(resolve=>server.close(resolve));
    // Cleanup must finish, but transient Chrome profile locks may need retries.
    let cleaned=false;
    for(let attempt=0;attempt<12;attempt++){
      try{rmSync(temp,{recursive:true,force:true,maxRetries:2,retryDelay:150});cleaned=true;break;}
      catch(error){if(!["ENOTEMPTY","EBUSY","EPERM"].includes(error.code))throw error;await sleep(250);}
    }
    if(!cleaned)throw Error("Isolated Chrome profile cleanup did not finish");
  }
}
main().catch(e=>{console.error("Isolated auth-browser regression FAILED: "+String(e.message||e).slice(0,700));process.exitCode=1;});
