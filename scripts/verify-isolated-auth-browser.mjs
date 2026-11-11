/**
 * Credential-free, isolated real Chrome regression for the COMPILED /auth UI.
 * Runs against a loopback-only Supabase mock; never contacts production.
 * No installed browser packages or real Supabase accounts required.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, existsSync, rmSync, statSync } from "node:fs";
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
  ".png":"image/png",".webp":"image/webp",".woff2":"font/woff2",".ico":"image/x-icon"};
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
  let dailyProbeCalls=0,dailyProbeMode='passed';
  let fxReferenceReads=0,fxReferenceMode='valid';
  const fxDate=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
  const fxBatch={kind:'daily_fx_reference',source:'Frankfurter blended daily reference',requestedDate:fxDate,
    rates:{eurusd:{rate:1.234567,date:fxDate},gbpusd:{rate:1.345678,date:fxDate}}};
  let showPublications=false,publicationReads=0,whatsNewCourseUnavailable=false;
  let learningWrites=0, learningReads=0, savedLearning=null;
  let privateTradeReads=0, privateTradeRejected=0;
  let foundationsReads=0, foundationsGradeCalls=0, foundationsPassed=false, malformedFoundationsProgress=true, inconsistentFoundationsProgress=true, inconsistentFoundationsReplySent=false, certificateIssues=0;
  let trophyFixtureEnabled=false, trophyStateUnavailable=false, trophyPrivateReads=0, trophyGrades=0, trophyShared=false, trophyEarned=false;
  const trophyIds=["first-light","field-notes","market-compass","order-desk","price-detective","risk-aware",
    "position-architect","exit-planner","cost-counter","portfolio-lens","first-practice-trade",
    "pause-button","scenario-explorer","decision-review","second-look","case-solver","case-collector",
    "steady-learner","knowledge-builder","foundations-graduate"];
  let issuedCertificate=null;
  let certificateShareToken=null;
  const foundationsVersion="foundations-v1";
  let holdLearnModule=true;
  const releaseLearnModules=[];
  const rejectedWrites=[];
  const publications=[{slug:'isolated-publication',published_at:new Date().toISOString(),title:'Isolated course announcement'}];
  const ADMIN_FIXTURE_KEY='isolated-admin-fixture-only';
  let dailyGenerationRequests=0;
  let dailyDrafts=[],dailyEditorialWrites=0;
  let newsletterRevision=1,newsletterReads=0,newsletterWrites=0,newsletterConfirmed=1;
  let newsletterEditorialFixture=false,newsletterPreviewCalls=0,newsletterPublishRequests=0,newsletterAudienceUnavailable=false;
  let newsletterEdition={id:'fixture-newsletter',week_of:'2026-11-02',status:'draft',revision:2,subject:'Saved fixture subject',preheader:'Saved preview line',body_markdown:'Saved fixture text',reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString(),ai_model:null,generator_error:null};
  const newsletterPreview={subject:'Preview fixture subject',preheader:'A source-backed fixture preview',body_markdown:'## Fixture lesson\n<img src=x onerror=window.__newsletterHtmlExecuted=true>\nHypothetical worksheet: 1% of $100 equals $1.'};
  let dashboardHold=false,dashboardHeldRequests=0;
  let courseDeskFixture=false,reviewDeskFixture=false,courseDeskWrites=0,reviewDeskWrites=0;
  let reviewCountUnavailable=false,reviewListRequests=0;
  let courseMutationFixture=false,reviewMutationFixture=false;
  let reviewListUnavailable=false;
  let courseDeskRows=[],courseWriteLog=[],reviewWriteLog=[];
  let courseListUnavailable=false,courseFailRefreshAfterSave=false;
  let reviewFixtureRow={id:'aaaa1111-2222-4333-8444-555555555555',name:'Fixture reviewer',
    content:'An isolated review used solely to test the owner UI.',rating:4,
    is_visible:true,is_featured:false,created_at:new Date().toISOString(),
    owner_reply:null,owner_reply_updated_at:null,deleted_at:null};
  let portfolioReadFailure=false,portfolioPrice=100,portfolioReads=0,portfolioQuoteVersion=0;
  const accountPortfolioFixture=()=>({
    trades:[
      {id:'fixture-account-trade',asset_id:'aapl',side:'buy',quantity:1,price:100,total:100.1,
        created_at:'2026-11-01T10:00:00Z',price_source:'Fixture only'},
      {id:'fixture-second-trade',asset_id:'btc',side:'buy',quantity:0.001,price:50000,total:50.05,
        created_at:'2026-11-01T10:01:00Z',price_source:'Fixture only'},
    ],
    cash:99849.85,ranked:false,cycle_id:"fixture",updated_at:'2026-11-01T10:01:00Z',
    positions:[
      {asset_id:'aapl',symbol:'AAPL',asset_type:'stock',quantity:1,avg_price:100.1,last_price:100,
        priced_at:new Date(epoch*1000).toISOString(),observed_at:new Date((epoch-12*3600)*1000).toISOString(),quote_status:'previous_close'},
      {asset_id:'btc',symbol:'BTC',asset_type:'crypto',quantity:0.001,avg_price:50050,last_price:portfolioPrice*500,
        priced_at:new Date((epoch+portfolioQuoteVersion)*1000).toISOString(),observed_at:new Date((epoch+portfolioQuoteVersion)*1000).toISOString(),quote_status:'realtime'},
    ],
  });
  let dashboardQueuesAtLimit=false,dashboardExactCounts=false,dashboardMalformedCount=false;
  let dashboardFixture=false,dailyQueueUnavailable=false,newsletterQueueUnavailable=false,dashboardSettingsUnavailable=false;
  let dashboardMetadataRequests=0,dashboardFeedsUnavailable=false;
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
      if(dashboardFeedsUnavailable && req.method==='POST' && [
        '/functions/v1/admin-courses','/functions/v1/admin-reviews','/functions/v1/newsletter-dispatch',
        '/functions/v1/newsletter-editor','/functions/v1/admin-agent-chat',
      ].includes(route)) return json(503,{error:'Fixture dashboard feeds unavailable'});
      if(route==='/functions/v1/trophy-evidence'){
        assert.equal(req.method,'POST');
        let raw='';req.on('data',chunk=>{raw+=chunk});req.on('end',()=>{
          const input=JSON.parse(raw);
          if(input.action==='public')return json(200,trophyShared?
            {status:'available',flair:'exit-planner',pinned:['exit-planner']}:
            {status:'private',flair:null,pinned:[]});
          assert.equal(req.headers.authorization,'Bearer '+JWT,'Trophy evidence uses the signed-in account JWT');
          trophyPrivateReads++;
          if(!trophyFixtureEnabled)return json(503,{status:'unavailable'});
          if(input.action==='state'&&trophyStateUnavailable)return json(503,{status:'unavailable'});
          if(input.action==='state')return json(200,{
            status:'available',profilePublic:true,
            share:{enabled:trophyShared,flair:trophyShared?'exit-planner':null,pins:trophyShared?['exit-planner']:[]},
            entries:trophyIds.map(id=>({id,progress:Number(id==='exit-planner'&&trophyEarned),
              target:1,earned:id==='exit-planner'&&trophyEarned,issuedAt:id==='exit-planner'&&trophyEarned?'2026-11-08T00:00:00Z':null})),
          });
          if(input.action==='list_daily')return json(200,{status:'available',cases:[{id:'practice-01',title:'Fixture case'}]});
          if(input.action==='challenge'&&input.challengeId==='exit-planning')return json(200,{status:'available',
            challenge:{id:'exit-planning',title:'Exit Planner',detail:'A harmless fictional scored exercise for browser verification.',
              category:'case',attemptId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',questions:Array.from({length:3},(_,i)=>({prompt:'Choose the tested reasoning '+i,
                options:['A valid fictional answer','An unsupported forecast','An invented confirmation']}))}});
          if(input.action==='grade'){
            assert.equal(input.challengeId,'exit-planning');
            assert.deepEqual(input.answers,[0,0,0]);
            assert.equal(input.attemptId,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Grade carries an issued attempt ID');
            trophyGrades++;trophyEarned=true;
            return json(200,{status:'graded',points:3,possible:3,passed:true,updated:true,
              explanations:['Scored in isolated fixture','No real market','No rank change']});
          }
          if(input.action==='share'){
            assert.equal(input.enabled,!trophyShared,'Explicit user change required');
            if(input.enabled){assert.equal(input.flair,null);assert.deepEqual(input.pins,['exit-planner']);}
            else {assert.equal(input.flair,null);assert.deepEqual(input.pins,[]);}
            trophyShared=input.enabled;
            return json(200,{status:'available',share:{enabled:trophyShared,flair:null,
              pins:trophyShared?['exit-planner']:[]}});
          }
          return json(400,{status:'invalid_request'});
        });return;
      }
      if(route==='/functions/v1/foundations-certificate'){
        assert.equal(req.method,'POST');
        assert.equal(req.headers.authorization,'Bearer '+JWT,'Foundations reads and grades use the account JWT');
        let text='';req.on('data',chunk=>{text+=chunk});req.on('end',()=>{
          const input=JSON.parse(text);
          foundationsReads++;
          if(input.action==='progress' && malformedFoundationsProgress)return json(200,{status:'available',programmeVersion:foundationsVersion,
            completedCourses:[],finalCasePassed:false,perfectSizing:false,learningDays:0,milestones:[],passedCheckpoints:['markets','markets','retired-checkpoint']});
          if(input.action==='progress' && inconsistentFoundationsProgress) {
            inconsistentFoundationsReplySent=true;
            return json(200,{status:'available',programmeVersion:foundationsVersion,
              completedCourses:['market-and-orders'],finalCasePassed:false,perfectSizing:false,learningDays:0,milestones:['first-course'],passedCheckpoints:[]});
          }
          if(input.action==='progress')return json(200,{status:'available',programmeVersion:foundationsVersion,
            completedCourses:foundationsPassed?['market-and-orders','reading-prices','risk-and-position-sizing','practice-and-reflection']:[],finalCasePassed:foundationsPassed,perfectSizing:false,learningDays:foundationsPassed?1:0,milestones:foundationsPassed?['first-course','core-studies','foundations']:[],passedCheckpoints:foundationsPassed?['markets','execution','quotes','risk','sizing','reflection']:[]});
          if(input.action==='assessment'){
            assert.deepEqual(input,{action:'assessment',programmeVersion:foundationsVersion,assessmentId:'markets'});
            return json(200,{status:'available',assessment:{programmeVersion:foundationsVersion,assessmentId:'markets',
              title:'Fixture checkpoint',questions:Array.from({length:5},(_,i)=>({prompt:'Practice fixture '+i,choices:['Choice A','Choice B']}))}});
          }
          if(input.action==='certificate') {
            if(input.milestone==='first-course')return json(200,issuedCertificate?{status:'available',certificate:issuedCertificate}:{status:'not_issued'});
            assert.ok(['core-studies','foundations'].includes(input.milestone));
            return json(200,{status:'available',certificate:{
              id:'8bc992ee-50ba-44b3-ab63-926aaea45b21',issuedAt:'2026-11-08T00:30:00Z',
              nameRevision:0,verificationActive:false,recipientName:input.milestone==='core-studies'?'மாயா பெரேரா':'Alexandria Catherine Elizabeth Francesca Isabella Johanna Marguerite Penelope Rose Perera',
              milestone:input.milestone,programmeVersion:foundationsVersion,templateVersion:'trade-hq-white-teal-v1',
            }});
          }
          if(input.action==='set_verification') {
            assert.equal(input.milestone,'first-course');
            assert.equal(input.expectedRevision,issuedCertificate.nameRevision);
            certificateShareToken=input.enabled?'f'.repeat(64):null;
            issuedCertificate={...issuedCertificate,verificationActive:input.enabled};
            return json(200,{status:'available',verificationActive:input.enabled,token:certificateShareToken??undefined});
          }
          if(input.action==='correct_name') {
            assert.equal(input.milestone,'first-course');
            assert.equal(input.expectedRevision,issuedCertificate.nameRevision);
            issuedCertificate={...issuedCertificate,recipientName:input.recipientName,nameRevision:1,verificationActive:false};
            certificateShareToken=null;
            return json(200,{status:'available',certificate:issuedCertificate});
          }
          if(input.milestone==='first-course') {
            assert.equal(input.recipientName,'මායා පෙරේරා');
            certificateIssues++;
            issuedCertificate={id:'7bc992ee-50ba-44b3-ab63-926aaea45b21',issuedAt:'2026-11-08T00:30:00Z',
              recipientName:input.recipientName,nameRevision:0,verificationActive:false,milestone:input.milestone,programmeVersion:foundationsVersion,
              templateVersion:'trade-hq-white-teal-v1'};
            return json(200,{status:'available',certificate:issuedCertificate});
          }
          assert.deepEqual(input,{action:'grade',programmeVersion:foundationsVersion,assessmentId:'markets',answers:[0,0,0,0,0]});
          foundationsGradeCalls++;
          if(foundationsGradeCalls===1)return json(503,{status:'unavailable'});
          foundationsPassed=true;
          return json(200,{status:'graded',grade:{programmeVersion:foundationsVersion,assessmentId:'markets',points:5,possible:5}});
        });return;
      }
      if(route==='/functions/v1/foundations-certificate-verify'){
        assert.equal(req.method,'POST');
        assert.equal(req.headers.authorization,undefined,'Public verification sends no authenticated bearer');
        let text='';req.on('data',chunk=>{text+=chunk});req.on('end',()=>{
          const {token}=JSON.parse(text);
          if(token!==certificateShareToken)return json(404,{status:'invalid_or_withdrawn'});
          return json(200,{status:'verified',programmeVersion:foundationsVersion,milestone:'first-course',issuedOn:'2026-11-08'});
        });return;
      }
      if(route==='/functions/v1/daily-practice-test'){
        assert.equal(req.method,'POST');assert.equal(req.headers['x-admin-key'],ADMIN_FIXTURE_KEY);
        assert.equal(req.headers.authorization,'Bearer '+JWT,'Private test requires the genuine fixture owner session');
        let text='';req.on('data',chunk=>{text+=chunk});req.on('end',()=>{
          assert.deepEqual(JSON.parse(text),{confirmFreeTier:true});dailyProbeCalls++;
          if(dailyProbeMode==='used')return json(429,{code:'TEST_ALLOWANCE_USED',error:'Fixture allowance used'});
          if(dailyProbeMode==='bad-diagnostics')return json(200,{data:{outcome:'passed',model:'gemini-3.5-flash-lite',providerGenerationAttempted:true,productionCycleChanged:false,published:false,saved:false,exercises:10,questions:100,diagnostics:{provider:{finishReason:'PRIVATE_DIAGNOSTIC_VALUE'}}}});
          if(dailyProbeMode==='malformed')return json(200,{data:{outcome:'passed',productionCycleChanged:true,published:false,saved:false}});
          const payload={data:{outcome:dailyProbeMode==='held'?'passed':dailyProbeMode==='validation'?'failed':dailyProbeMode,model:'gemini-3.5-flash-lite',providerGenerationAttempted:true,
            productionCycleChanged:false,published:false,saved:false,exercises:dailyProbeMode==='passed'||dailyProbeMode==='held'?10:0,
            questions:dailyProbeMode==='passed'||dailyProbeMode==='held'?100:0,...(dailyProbeMode==='failed'?{code:'PROVIDER_REJECTED',httpStatus:400,field:'thinkingLevel'}:dailyProbeMode==='validation'?{code:'OUTPUT_VALIDATION_FAILED',diagnostics:{provider:{finishReason:'MAX_TOKENS',inputTokens:100,outputTokens:32768,totalTokens:32868,textChars:12000},validation:{stage:'EXERCISE_STRUCTURE',rules:['QUESTION_FIELDS'],exercise:3,question:5},structure:{exerciseCount:10,questionCounts:Array(10).fill(10),minExplanationChars:7,minScenarioChars:600,minGuideChars:140}}}:{})}};
          if(dailyProbeMode==='held'){setTimeout(()=>json(200,payload),600);return;}
          return json(200,payload);
        });return;
      }
      if(route==='/api/fx-reference'){
        assert.equal(req.method,'GET');fxReferenceReads++;
        if(fxReferenceMode==='unavailable')return json(503,{error:'Reference unavailable'});
        if(fxReferenceMode==='future')return json(200,{...fxBatch,requestedDate:'2099-01-01'});
        // Deliberate delay makes the actual accessible loading state observable.
        setTimeout(()=>json(200,fxBatch),500);return;
      }
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
          if(dashboardFixture && ['list','daily-list'].includes(body.action)){
            assert.equal(body.summary,true,'Dashboard must request metadata without full documents');
            assert.equal(body.countDrafts,true,'Dashboard requests count-only mode');
            dashboardMetadataRequests++;
          }
          if(dashboardFixture && body.action==='settings' && dashboardHold){dashboardHeldRequests++;setTimeout(()=>json(200,{data:{enabled:true,runs:[]}}),600);return;}
          if(dashboardFixture && body.action==='settings')return dashboardSettingsUnavailable
            ? json(503,{error:'Fixture settings unavailable'})
            : json(200,{data:{enabled:true,model:'fixture-only',runs:[{period:'2026-10-01',slot:1,status:'paused',last_error:'Fixture HTTP503'}]}});
          if(dashboardFixture && dashboardExactCounts && ['list','daily-list'].includes(body.action))
            return json(200,{data:{count:body.action==='list'?(dashboardMalformedCount?null:217):31}});
          if(dashboardFixture && dashboardQueuesAtLimit && ['list','daily-list'].includes(body.action)){
            const limit=body.action==='list'?200:24;
            return json(200,{data:Array.from({length:limit},(_,index)=>({id:'bounded-'+index,status:index===0?'draft':'published'}))});
          }
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
          if(route.endsWith('newsletter-dispatch') && body.action==='status' && newsletterAudienceUnavailable)return json(503,{error:'Fixture exact-count outage'});
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
            if(dashboardExactCounts || dashboardQueuesAtLimit)assert.equal(body.countDrafts,true,'Dashboard requests no newsletter content');
            if(dashboardFixture && dashboardExactCounts)return json(200,{data:{count:0}});
            if(dashboardFixture && dashboardQueuesAtLimit)
              return json(200,{data:Array.from({length:16},(_,index)=>({id:'bounded-'+index,status:'approved'}))});
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
          if(input.action==='count')return reviewCountUnavailable ? json(503,{error:'Fixture review count outage'}) : json(200,{data:{count:1234}});
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
          reviewListRequests++;
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
      if(route==="/rest/v1/rpc/get_my_account_practice_snapshot" && req.method==="POST"){
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"invalid_token"});
        portfolioReads++;
        if(portfolioReadFailure)return json(503,{message:"Fixture read unavailable"});
        return json(200,portfolioInitialized?accountPortfolioFixture():null);
      }
      if(route==="/rest/v1/rpc/initialize_practice_portfolio" && req.method==="POST"){
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"invalid_token"});
        portfolioInitialized++;
        return json(200,accountPortfolioFixture());
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
          publicationReads++;
          if(parsed.searchParams.get('limit')==='40'){
            if(whatsNewCourseUnavailable)return json(503,{message:'Fixture course feed unavailable'});
            return json(200,showPublications?[...publications,{slug:'../admin',published_at:new Date().toISOString(),title:'Invalid publication fixture'}]:[]);
          }
          return json(200,showPublications?publications:[]);
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
    await wait(()=>devtools.evaluate("document.querySelector('[data-route-loading] [role=status]')?.textContent.includes('Loading your page')"),"visible route loading status",3000);
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
    assert.equal(foundationsReads,0,"Guest must not request Foundations evidence");
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
    // Loopback Phoenix frames exercise the app's real Supabase channel callback.
    await devtools.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{
      if(location.pathname!=='/portfolio')return;
      const channels=new Map();
      const NativeSocket=window.WebSocket;
      window.WebSocket=class FixtureRealtimeSocket extends EventTarget {
        static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
        readyState=0;
        constructor(url){
          super();
          if(!new URL(url).pathname.startsWith('/realtime/v1/'))return new NativeSocket(url);
          setTimeout(()=>{this.readyState=1;this.onopen?.({});},0);
        }
        close(){this.readyState=3;this.onclose?.({code:1000,reason:'fixture closed'});}
        reply(message){this.onmessage?.({data:JSON.stringify(message)});}
        send(raw){
          const {topic,event,payload,ref}=JSON.parse(raw);
          if(event==='phx_join'){
            const bindings=(payload.config.postgres_changes||[]).map((filter,index)=>({...filter,id:index+1}));
            channels.set(topic,{socket:this,bindings});
            queueMicrotask(()=>this.reply({topic,event:'phx_reply',payload:{status:'ok',response:{postgres_changes:bindings}},ref}));
          }else if(event==='heartbeat'||event==='phx_leave'){
            if(event==='phx_leave')channels.delete(topic);
            queueMicrotask(()=>this.reply({topic,event:'phx_reply',payload:{status:'ok',response:{}},ref}));
          }
        }
      };
      window.__fixtureQuoteUpdate=(assetId)=>{
        for(const [topic,{socket,bindings}] of channels){
          const binding=bindings.find(item=>item.table==='market_prices');
          if(!binding)continue;
          socket.reply({topic,event:'postgres_changes',payload:{ids:[binding.id],data:{
            schema:'public',table:'market_prices',commit_timestamp:new Date().toISOString(),type:'UPDATE',
            columns:[{name:'asset_id',type:'text'}],record:{asset_id:assetId},
          }}});
          return true;
        }
        return false;
      };
    })()`});
    const chartValue = "document.querySelector('[data-portfolio-chart-value]')?.textContent";
    const accountValue = "document.querySelector('[data-portfolio-total-value]')?.textContent";
    const refreshPortfolio = () => devtools.evaluate("document.querySelector('[aria-label=\"Refresh portfolio and available quotes\"]')?.click()");
    await devtools.evaluate("localStorage.removeItem('tradehq:account-portfolio-history:v1:" + USER_ID + ":fixture')");
    portfolioReadFailure=true;
    await loadDocument(origin+"/portfolio");
    await wait(()=>devtools.evaluate("document.body.textContent.includes('No confirmed account valuation is available.')"),'Account outage without a confirmed snapshot stays unavailable');
    assert.equal(await devtools.evaluate(chartValue),undefined,'The account chart must never substitute the guest starting value');
    portfolioReadFailure=false;
    await refreshPortfolio();
    await wait(()=>devtools.evaluate(chartValue+"==='$99999.85' && "+accountValue+"==='$99999.85'"),'Both account displays use the same server valuation');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('One real portfolio observation is available.')"),'One real account observation is explained');
    await wait(()=>devtools.evaluate("!!document.querySelector('[data-portfolio-chart-state=single-observation] .recharts-wrapper')"),'A single real point has an accessible chart container');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('since first saved snapshot')"),false,'A single observation never invents historical performance');
    assert.ok(portfolioReads>0);
    const initCount=portfolioInitialized;
    portfolioReadFailure=true;await refreshPortfolio();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Showing the last confirmed account snapshot.')"),'Failed refresh keeps the confirmed account value');
    assert.equal(await devtools.evaluate(chartValue),'$99999.85');
    portfolioReadFailure=false;portfolioPrice=110;portfolioQuoteVersion=10;await refreshPortfolio();
    await wait(()=>devtools.evaluate(chartValue+"==='$100004.85' && "+accountValue+"==='$100004.85'"),'A new crypto quote changes both views with previous close for equities');
    await wait(()=>devtools.evaluate("!document.body.textContent.includes('Account refresh failed.')"),'Successful refresh clears the failure');
    await wait(()=>devtools.evaluate("!!document.querySelector('[data-portfolio-chart-state=trend] [data-portfolio-reference-status]')"),'Two genuine account observations form a trend');
    await wait(()=>devtools.evaluate("document.querySelector('[data-portfolio-reference-status]')?.textContent.includes('below this chart')"),'Off-range reference is explained rather than flattening the scale');
    assert.equal(await devtools.evaluate("document.querySelector('[data-portfolio-chart-state=trend] .recharts-reference-line-label')"),null,
      'Comparison labels must not overlap the Y-axis or data points');
    assert.equal(await devtools.evaluate(`(()=>{
      const chart=document.querySelector('[data-portfolio-chart-state=trend] .recharts-wrapper');
      if(!chart)return false;
      const frame=chart.getBoundingClientRect();
      const ticks=[...chart.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick-value')];
      return ticks.length>0&&ticks.every(el=>{const r=el.getBoundingClientRect();return r.left>=frame.left-1 && r.right<=frame.right+1;});
    })()`),true,'Portfolio Y-axis labels must stay within the chart frame');
    await devtools.evaluate("document.querySelector('button[aria-label=\"Toggle 10% downside reference\"]')?.click()");
    await wait(()=>devtools.evaluate("document.querySelector('[data-portfolio-reference-status]')?.textContent.includes('reference hidden.') && document.querySelector('button[aria-label=\"Toggle 10% downside reference\"]')?.getAttribute('aria-pressed')==='false'"),'Downside reference toggle changes visible status and pressed state');
    await devtools.evaluate("document.querySelector('button[aria-label=\"Toggle 10% downside reference\"]')?.click()");
    await wait(()=>devtools.evaluate("document.querySelector('[data-portfolio-reference-status]')?.textContent.includes('below this chart') && document.querySelector('button[aria-label=\"Toggle 10% downside reference\"]')?.getAttribute('aria-pressed')==='true'"),'Downside reference restores its actual value and status');

    portfolioPrice=100;portfolioQuoteVersion=0;await refreshPortfolio();
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Refresh portfolio and available quotes\"]')?.disabled"),'Old quote response settled');
    assert.equal(await devtools.evaluate(chartValue),'$100004.85','Delayed quote must not roll back the account valuation');
    assert.equal(portfolioInitialized,initCount,'An existing portfolio refresh must not call the initializer');
    portfolioPrice=110;portfolioQuoteVersion=10;
    await devtools.evaluate("localStorage.removeItem('tradehq_portfolio');localStorage.removeItem('tradehq:portfolio-recovery:v1')");
    await loadDocument(origin+"/portfolio");
    await wait(()=>devtools.evaluate(chartValue+"==='$100004.85'"),'Account value is restored on reload without a portfolio cache');
    assert.equal(await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio')).trades.length"),2);
    await devtools.evaluate(`(()=>{const saved=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        if(key==='tradehq_portfolio'||key==='tradehq:portfolio-recovery:v1'||key.startsWith('tradehq:account-portfolio-history:v1:'))throw new Error('Fixture storage quota');
        return saved.call(this,key,value);
      };window.__restorePortfolioStorage=()=>{Storage.prototype.setItem=saved;};})()`);
    portfolioPrice=120;portfolioQuoteVersion=20;
    await devtools.evaluate("window.dispatchEvent(new Event('online'))");
    await wait(()=>devtools.evaluate(chartValue+"==='$100009.85' && "+accountValue+"==='$100009.85'"),'Confirmed values remain visible when portfolio cache storage fails');
    await devtools.evaluate("window.__restorePortfolioStorage()");
    portfolioPrice=130;portfolioQuoteVersion=30;
    await wait(()=>devtools.evaluate("window.__fixtureQuoteUpdate?.('btc')"),'Portfolio channel subscribes to quote changes');
    await wait(()=>devtools.evaluate(chartValue+"==='$100014.85' && "+accountValue+"==='$100014.85'"),'Realtime quote event refreshes the same account snapshot');
    console.log('ISOLATED_ACCOUNT_PORTFOLIO_PASS: two protected trades, missing history, initial and cached outages, recovery, independent crypto update, older quote rejection, reload and a Realtime quote event. No live RPCs or orders.');
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.body.textContent.includes('First Recorded Practice Trade')"),"authenticated Trophy milestone");
    await wait(()=>devtools.evaluate("document.querySelector('section[aria-labelledby=recorded-practice-heading] [role=status]')?.textContent.includes('Account-recorded')"),"server-recorded milestone proven");
    assert.ok(privateTradeReads>=1,"Signed-in owner must fetch account-bound evidence");
    assert.equal(privateTradeRejected,0,"No unauthorized or unscoped trade reads allowed");
    // The trophy API intentionally returns 503 until its later signed-in
    // lifecycle fixture begins. No old progress or trade-read shortcut may
    // label a new durable award as Earned during that outage.
    const trophyCards="document.querySelector('section[aria-labelledby=trophy-collection-title]')";
    await wait(()=>devtools.evaluate(trophyCards+"?.textContent.includes('Verification pending')"),'Recorded trade awaits its durable trophy award during API outage');
    assert.equal(await devtools.evaluate(trophyCards+".textContent.includes('Earned')"),false,
      'An unavailable trophy issuer must never render an unissued Earned award');
    const programme="document.querySelector('section[aria-labelledby=foundations-programme-title]')";
    const programmeButton=label=>"[..."+programme+".querySelectorAll('button')].find(e=>e.textContent.trim()==="+JSON.stringify(label)+")";
    const programmeClick=label=>devtools.evaluate(programmeButton(label)+"?.click()");
    const collection="document.querySelector('section[aria-labelledby=trophy-collection-title]')";
    await wait(()=>devtools.evaluate(collection+"?.querySelectorAll('img').length===20"),'Twenty trophy illustrations rendered');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Foundations progress is temporarily unavailable.')"),'Malformed progress is rejected');
    assert.equal(await devtools.evaluate("Boolean("+collection+".querySelector('[aria-label=\"Field Notes progress\"]'))"),false,'Duplicate or retired checkpoints cannot appear as earned evidence');
    malformedFoundationsProgress=false;
    await programmeClick('Retry');
    await wait(()=>inconsistentFoundationsReplySent,'Contradictory fixture reply was served');
    // The previous error remains visible while React Query refetches. Give the
    // compiled browser a complete render turn before asserting fail-closed UI.
    await sleep(400);
    assert.equal(await devtools.evaluate(programme+".textContent.includes('Foundations progress is temporarily unavailable.')"),true,'Recognized but contradictory course progress must fail closed');
    assert.equal(await devtools.evaluate(programme+".textContent.includes('Course completed')"),false,'Contradictory course completion must not render');
    assert.equal(await devtools.evaluate("Boolean("+collection+".querySelector('[aria-label=\"Foundations Graduate progress\"]'))"),false,'Contradictory certificate eligibility cannot appear earned');
    inconsistentFoundationsProgress=false;
    await programmeClick('Retry');
    await wait(()=>devtools.evaluate(collection+".querySelector('[aria-label=\"Field Notes progress\"]')?.textContent.trim()==='0 / 3'"),'Valid retry restores the verified zero state');

    assert.equal(await devtools.evaluate("new Set([..."+collection+".querySelectorAll('img')].map(x=>x.getAttribute('src'))).size"),20);
    await devtools.evaluate(collection+".querySelectorAll('img').forEach(icon=>icon.loading='eager')");
    await wait(()=>devtools.evaluate("[..."+collection+".querySelectorAll('img')].every(icon=>icon.complete && icon.naturalWidth===232 && icon.naturalHeight===232)"),'All twenty full-size trophy images loaded');
    assert.equal(await devtools.evaluate(programme+".textContent.includes('How to earn a certificate')"),true,'Certificate requirements are visible before eligibility');
    assert.equal(await devtools.evaluate(collection+".textContent.includes('Evidence unavailable')"),true,'Unwired evidence must not display false zero progress');
    await programmeClick('Markets and instruments');
    await wait(()=>devtools.evaluate(programme+".querySelectorAll('fieldset').length===5"),'Private Foundations checkpoint ready');
    await devtools.evaluate(programme+".querySelectorAll('fieldset').forEach(el=>el.querySelector('input').click())");
    await programmeClick('Submit answers');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Your result could not be confirmed')"),'Foundations grade outage shown');
    assert.equal(await devtools.evaluate(programme+".querySelectorAll('input:checked').length"),5,'Keep answers after score outage');
    await programmeClick('Submit answers');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Score 5/5. Passed.')"),'Server-graded score rendered');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Markets and instruments · Passed')"),'Server progress refreshes after grading');
    assert.equal(foundationsGradeCalls,2,'One failed deliberate submission and one deliberate retry');
    await wait(()=>devtools.evaluate(collection+".querySelector('[aria-label=\"Steady Learner progress\"]')?.textContent.trim()==='1 / 7'"),'Private distinct-day count shown on Steady Learner');

    const downloadPath=join(temp,'certificate-download');
    mkdirSync(downloadPath);
    await devtools.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath});
    await programmeClick('First Course Certificate');
    const nameField=programme+".querySelector('input[autocomplete=name]')";
    await wait(()=>devtools.evaluate("!!"+nameField),'Certificate recipient name review');
    await devtools.evaluate("(()=>{const input="+nameField+";Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'මායා පෙරේරා');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Confirm the name as it should appear')"),'Certificate shows confirmed name before issuance');
    await programmeClick('Confirm name and issue');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Issued to මායා පෙරේරා')"),'Authoritative private issuance receipt');
    await programmeClick('Download PDF');
    const pdfPath=join(downloadPath,'The-Trade-HQ-first-course.pdf');
    await wait(()=>existsSync(pdfPath),'Generated one-page certificate downloaded');
    const pdf=readFileSync(pdfPath);
    assert.equal(pdf.subarray(0,8).toString(),'%PDF-1.4');
    assert.ok(pdf.length<2000000 && pdf.length>50000,'Certificate PDF has bounded and meaningful file size');
    assert.ok(pdf.subarray(-100).toString().endsWith('%%EOF\n'));
    if(process.env.TRADEHQ_CERTIFICATE_FIXTURE_PATH)copyFileSync(pdfPath,process.env.TRADEHQ_CERTIFICATE_FIXTURE_PATH);
    rmSync(pdfPath);
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("Boolean("+programmeButton('First Course Certificate')+")"),'Certificate eligibility restored');
    await programmeClick('First Course Certificate');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Issued to මායා පෙරේරා')"),'Same persisted issuance after reload');
    await devtools.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath});
    await programmeClick('Download PDF');
    await wait(()=>existsSync(pdfPath),'Repeat certificate download');
    assert.deepEqual(readFileSync(pdfPath),pdf,'Repeat downloads in the same browser produce identical PDF bytes');
    assert.equal(certificateIssues,1,'Repeat download reads the certificate and never issues twice');
    await programmeClick('Correct recipient name');
    await wait(()=>devtools.evaluate("!!"+nameField),'Certificate correction name field');
    await devtools.evaluate("(()=>{const input="+nameField+";Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Maya Corrected');input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    await programmeClick('Save corrected name');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Issued to Maya Corrected')"),'Certificate correction confirmed');
    assert.equal(issuedCertificate.id,'7bc992ee-50ba-44b3-ab63-926aaea45b21');
    assert.equal(certificateIssues,1,'Name correction does not reissue a certificate');
    await programmeClick('Enable verification and create link');
    await wait(()=>devtools.evaluate(programme+".querySelector('input[readonly]')?.value.includes('/certificate/verify#')"),'Verification link requires explicit consent');
    const verificationLink=await devtools.evaluate(programme+".querySelector('input[readonly]').value");
    await loadDocument(verificationLink);
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Certificate verified')"),'Shared public proof verified');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Maya Corrected')"),false,'Public verification hides the private name');
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("Boolean("+programmeButton('First Course Certificate')+")"),'Account cabinet restored after public verification');
    await programmeClick('First Course Certificate');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Public verification is on')"),'Persisted verification consent shown');
    await programmeClick('Withdraw verification');
    await wait(()=>devtools.evaluate(programme+".textContent.includes('Public verification is off')"),'Verification consent withdrawn');
    await loadDocument(verificationLink);
    await wait(()=>devtools.evaluate("document.body.textContent.includes('invalid or has been withdrawn')"),'Withdrawn public proof rejected');
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("Boolean("+programmeButton('Core Studies Certificate')+")"),'Return to cabinet for mobile certificate checks');
    console.log('ISOLATED_CERTIFICATE_VERIFICATION_PASS: explicit opt-in, anonymous minimal proof and withdrawal.');
    // New independent trophy service: private default, server-scored earned
    // record, separate sharing consent and complete withdrawal in real Chromium.
    trophyFixtureEnabled=true;
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.querySelector('#trophy-challenges')?.textContent.includes('0 / 20 earned')"),'Authenticated twenty-award snapshot');
    await devtools.evaluate("[...document.querySelectorAll('#trophy-challenges button')].find(b=>b.textContent.trim()==='Exit planning')?.click()");
    await wait(()=>devtools.evaluate("document.querySelectorAll('#trophy-challenges fieldset').length===3"),'Scored Exit Planner loaded');
    await devtools.evaluate("document.querySelectorAll('#trophy-challenges fieldset').forEach(f=>f.querySelector('input')?.click())");
    await devtools.evaluate("[...document.querySelectorAll('#trophy-challenges button')].find(b=>b.textContent.trim()==='Submit to be scored')?.click()");
    await wait(()=>trophyEarned&&trophyGrades===1,'Server-scored trophy earned exactly once');
    await wait(()=>devtools.evaluate("document.querySelector('#trophy-challenges')?.textContent.includes('1 / 20 earned')"),'Durable trophy appears after server receipt');
    await devtools.evaluate("document.querySelector('section[aria-labelledby=trophy-sharing-title] input[type=checkbox]')?.click()");
    await wait(()=>devtools.evaluate("document.querySelectorAll('section[aria-labelledby=trophy-sharing-title] input[type=checkbox]').length===2"),'Explicit trophy sharing controls');
    await devtools.evaluate("document.querySelectorAll('section[aria-labelledby=trophy-sharing-title] input[type=checkbox]')[1]?.click()");
    await devtools.evaluate("[...document.querySelectorAll('section[aria-labelledby=trophy-sharing-title] button')].find(b=>b.textContent.trim()==='Save explicit trophy sharing')?.click()");
    await wait(()=>trophyShared,'Separate explicit public trophy consent saved');
    const publicProof=await devtools.evaluate("fetch('/functions/v1/trophy-evidence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'public',username:'test-trader'})}).then(r=>r.json()).then(r=>r.status==='available'&&r.pinned.includes('exit-planner'))");
    assert.equal(publicProof,true,'Only selected earned trophy appears in the public response');
    await devtools.evaluate("document.querySelector('section[aria-labelledby=trophy-sharing-title] input[type=checkbox]')?.click()");
    await devtools.evaluate("[...document.querySelectorAll('section[aria-labelledby=trophy-sharing-title] button')].find(b=>b.textContent.trim()==='Withdraw trophy sharing')?.click()");
    await wait(()=>!trophyShared,'Trophy public consent withdrawn immediately');
    assert.equal(await devtools.evaluate("fetch('/functions/v1/trophy-evidence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'public',username:'test-trader'})}).then(r=>r.json()).then(r=>r.status)"),'private');
    assert.equal(trophyGrades,1,'A share toggle never repeats a graded attempt');
    // An evidence read outage must not prevent an already-public learner opting out.
    trophyShared=true;
    trophyStateUnavailable=true;
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.querySelector('#trophy-challenges')?.textContent.includes('Trophy evidence is temporarily unavailable')"),'Trophy evidence outage rendered');
    await devtools.evaluate("[...document.querySelectorAll('section[aria-labelledby=trophy-sharing-title] button')].find(b=>b.textContent.trim()==='Withdraw trophy sharing')?.click()");
    await wait(()=>!trophyShared,'Public trophy consent withdrawn during evidence outage');
    await wait(()=>devtools.evaluate("document.querySelector('#trophy-challenges')?.textContent.includes('Trophy sharing has been withdrawn')"),'Withdrawal acknowledged independently of evidence refresh');
    trophyStateUnavailable=false;
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("Boolean("+programmeButton('Core Studies Certificate')+")"),'Return to cabinet after evidence outage');
    console.log('ISOLATED_TROPHY_SHARING_PASS: signed-in scoring, durable render, explicit opt-in, public allowlist and revocation in Chromium.');


    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:860,deviceScaleFactor:1,mobile:true});
    for(const [label,slug] of [['Core Studies Certificate','core-studies'],['Foundations Completion Certificate','foundations']]){
      await programmeClick(label);
      await wait(()=>devtools.evaluate("[..."+programme+".querySelectorAll('button')].some(e=>e.textContent.trim()==='Download PDF')"),label+' ready on mobile viewport');
      await programmeClick('Download PDF');
      const savedPath=join(downloadPath,'The-Trade-HQ-'+slug+'.pdf');
      await wait(()=>existsSync(savedPath),label+' downloaded');
      assert.equal(readFileSync(savedPath).subarray(0,8).toString(),'%PDF-1.4');
      if(process.env.TRADEHQ_CERTIFICATE_FIXTURE_PATH)copyFileSync(savedPath,process.env.TRADEHQ_CERTIFICATE_FIXTURE_PATH.replace(/\.pdf$/,'-'+slug+'.pdf'));
    }
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});

    console.log('ISOLATED_CERTIFICATE_PDF_PASS: explicit Sinhala name review, private issuance, three PDFs, Tamil and long names on a narrow viewport, stable repeat bytes and one issuance.');

    console.log('ISOLATED_FOUNDATIONS_BROWSER_PASS: guest denial, private JWT, retained answers on outage and authoritative score/progress after retry.');

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
    const foundationsBeforeSignedOutCabinet=foundationsReads;
    await loadDocument(origin+"/achievements");
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign-in required')"),"signed-out milestone hidden");
    assert.equal(privateTradeReads,readsBeforeSignedOutCabinet,"Signed-out cabinet must not query the protected trade ledger");
    assert.equal(foundationsReads,foundationsBeforeSignedOutCabinet,"Signed-out cabinet must not read account assessment evidence");
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Markets and instruments · Passed')"),false);

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
    const dailyGuide = "document.querySelector('section[aria-label=\\\"Your recommended next step\\\"] a[href=\\\"/start\\\"]')";
    await wait(()=>devtools.evaluate("!!"+dailyGuide),"Completed full Daily case must offer Start Here as the primary guided next step");
    const dailyNextLesson = "document.querySelector('section[aria-labelledby=daily-next-lesson] a[href^=\"/courses/\"]')";
    await wait(()=>devtools.evaluate("!!"+dailyNextLesson),"Daily completion offers the next approved lesson");
    const complete=await stored();assert.equal(complete.answers.length,10);assert.equal(complete.answers[0],1);assert.ok(complete.answers.slice(1).every(a=>a===0));
    const streakKey=await devtools.evaluate("Object.keys(localStorage).find(k=>{try{const v=JSON.parse(localStorage.getItem(k));return v && v.totalCompleted===1 && Array.isArray(v.history)}catch{return false}})");
    assert.ok(streakKey,"Daily completion must persist one streak entry");
    await loadDocument();
    await dailyBankReady();
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Review case study'))"),"completed case restored");
    assert.deepEqual(await stored(),complete,"Completed answers cannot be rewritten by reload");
    await wait(()=>devtools.evaluate("!!"+dailyNextLesson),"Next approved lesson remains available after a reload");
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
    const adminClick=async text=>{
      const target="[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==="+JSON.stringify(text)+"&&!e.matches(':disabled'))";
      // Messages and HTTP receipts can render before busy controls become usable.
      // Waiting never clicks twice; bounded failures identify the actual control.
      if (!await devtools.evaluate("!!"+target)) console.log('ISOLATED_ADMIN_CONTROL_WAIT: '+text);
      await wait(()=>devtools.evaluate("!!"+target),'enabled admin control: '+text);
      return devtools.evaluate("(()=>{const e="+target+";if(!e)throw Error("+JSON.stringify('Admin control unavailable: '+text)+");e.click();return true})()");
    };
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
    // Pin only the release eligibility clock so this remains a regression test
    // after the launch announcement ages out of the seven-day window.
    const release=JSON.parse(readFileSync('src/content/releases/approved.json','utf8')).find(entry=>entry.id==='release-learner-journey');
    const releaseTime=Date.parse(release.date)+3600000;
    const actualPublicationDate=publications[0].published_at;
    publications[0].published_at=new Date(releaseTime-1000).toISOString();
    const {identifier:noticeClock}=await devtools.send('Page.addScriptToEvaluateOnNewDocument',{source:`Date.now=()=>${releaseTime}`});
    const noticeKey='tradehq-seen-course-publications-v1';
    const notice='document.querySelector("[data-release-notice]")';
    const noticeTitle=()=>devtools.evaluate(`${notice}?.querySelector('p')?.textContent`);
    const dismiss=`document.querySelector('button[aria-label="Dismiss release announcement"]')`;
    await devtools.evaluate(`localStorage.setItem(${JSON.stringify(noticeKey)}, 'null')`);
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:true});
    await loadDocument(origin+'/courses');
    await wait(async()=>await noticeTitle()===release.title,'major release announcement with an empty publication feed');
    await wait(()=>devtools.evaluate(`(()=>{const r=${notice}.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth+1;})()`),'announcement fits narrow screen');
    assert.equal(await devtools.evaluate(`${notice}.querySelector('a').getAttribute('href')`),'/whats-new');
    assert.equal(await devtools.evaluate(`${notice}.closest('[aria-live]')?.getAttribute('aria-live')`),'polite');
    await devtools.evaluate(`${dismiss}.focus()`);
    await devtools.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await devtools.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await wait(async()=>!await noticeTitle(),'keyboard dismissal');
    showPublications=true;
    await devtools.evaluate("window.dispatchEvent(new Event('focus'))");
    await wait(async()=>await noticeTitle()===publications[0].title,'next approved release appears after dismissal');
    const seen=await devtools.evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(noticeKey)}))`);
    assert.equal(seen['release-learner-journey:'+release.date],true);
    assert.equal(seen[publications[0].slug+':'+publications[0].published_at],true);
    const beforeReload=publicationReads;await loadDocument();
    await wait(()=>publicationReads>beforeReload,'announcement publication read after reload');
    await sleep(250);assert.equal(await noticeTitle(),undefined,'Seen releases cannot replay after reload');
    const beforeFocus=publicationReads;await devtools.evaluate("window.dispatchEvent(new Event('focus'))");
    await wait(()=>publicationReads>beforeFocus,'announcement recheck on focus');
    await sleep(250);assert.equal(await noticeTitle(),undefined,'Seen releases cannot replay on focus');
    await loadDocument(origin+'/whats-new');
    const noticePreference=`document.querySelector('main input[type="checkbox"]')`;
    await wait(()=>devtools.evaluate(`!!${noticePreference}`),'announcement preference on What’s New');
    await devtools.evaluate(`${noticePreference}.click();localStorage.setItem(${JSON.stringify(noticeKey)},'[]')`);
    await loadDocument(origin+'/courses');
    await sleep(350);assert.equal(await noticeTitle(),undefined,'Browser opt-out survives navigation');
    await loadDocument(origin+'/whats-new');
    await wait(()=>devtools.evaluate(`${noticePreference}?.checked`),'saved preference persists across reload');
    await devtools.evaluate(`${noticePreference}.click()`);
    await loadDocument(origin+'/courses');
    await wait(async()=>await noticeTitle()===release.title,'re-enabled browser recovers from array history');
    await devtools.evaluate(`${notice}.querySelector('a').click()`);
    await wait(()=>devtools.evaluate("location.pathname==='/whats-new' && !!document.querySelector('ol[aria-label=\"TradeHQ releases\"]')"),'popup opens permanent release history');
    await devtools.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:noticeClock});
    publications[0].published_at=actualPublicationDate;
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    assert.equal(dataWrites,0,'Unexpected fixture writes: '+rejectedWrites.join(', '));
    console.log('ISOLATED_RELEASE_NOTICES_PASS: approved feature and course, 320px layout, keyboard dismiss, persisted opt-out, reload/focus deduplication, permanent history link, no writes.');
    whatsNewCourseUnavailable=true;
    await loadDocument(origin+'/roadmap');
    const whatsNewLink="document.querySelector('main a[href=\"/whats-new\"]')";
    await wait(()=>devtools.evaluate("!!"+whatsNewLink),'Roadmap exposes What’s New');
    await devtools.evaluate(whatsNewLink+'.click()');
    await wait(()=>devtools.evaluate("location.pathname==='/whats-new' && document.body.textContent.includes('Course updates are temporarily unavailable.')"),'What’s New renders a recoverable course outage');
    assert.equal(await devtools.evaluate("document.querySelector('ol[aria-label=\"TradeHQ releases\"]').textContent.includes('Twenty trophies for learning and practice')"),true,'Shipped updates stay available during a course outage');
    whatsNewCourseUnavailable=false;
    await devtools.evaluate("[...document.querySelectorAll('main button')].find(button=>button.textContent.includes('Retry course updates')).click()");
    await wait(()=>devtools.evaluate("!!document.querySelector('ol a[href=\"/courses/isolated-publication\"]')"),'An approved publication joins the timeline without a build');
    assert.equal(await devtools.evaluate("document.querySelector('ol[aria-label=\"TradeHQ releases\"]').textContent.includes('Invalid publication fixture')"),false,'Malformed course records are ignored');
    assert.equal(await devtools.evaluate("!!document.querySelector('main a[href=\"/roadmap\"]')"),true,'What’s New links back to the Roadmap');
    console.log('ISOLATED_WHATS_NEW_PASS: Roadmap discovery, release notes through course outage, live publication retry and safe route validation.');
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
        if(window.__fixtureProposalSha){
          if(url.includes('/pulls?'))return Response.json([{number:902,title:'AI proposal: revision fixture',draft:false,
            created_at:new Date().toISOString(),html_url:'https://github.com/anugaweerasinghe1-del/trading101/pull/902',head:{sha:window.__fixtureProposalSha}}]);
          if(url.includes('/check-runs?')){
            if(window.__fixtureHoldProposalChecks)await new Promise(resolve=>{window.__releaseProposalChecks=resolve});
            return Response.json({total_count:0,check_runs:[]});
          }
          if(url.includes('/actions/runs?') && url.includes('head_sha='))return Response.json({total_count:0,workflow_runs:[]});
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
    assert.equal(await devtools.evaluate("document.body.textContent.includes('1234 review records')"),true);
    assert.equal(reviewListRequests,0,'Dashboard loads only the review count');
    reviewCountUnavailable=true;await refreshInbox();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Review moderation status is temporarily unavailable.')"),'Review count outage is visible');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('1234 review records')"),false);
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('2 course drafts awaiting review')"),true);
    reviewCountUnavailable=false;await refreshInbox();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('1234 review records')"),'Review count recovers');
    for(const text of ['2 course drafts awaiting review','1 daily bank draft awaiting review','1 newsletter draft awaiting review','1 course generation failure','1 open monitoring finding','Cooldown ends'])assert.equal(await devtools.evaluate(inbox+'.textContent.includes('+JSON.stringify(text)+')'),true,text);
    dashboardQueuesAtLimit=true;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+"?.textContent.includes('Course review list may be incomplete')"),'Capped Course review count is identified as partial');
    for(const text of ['Daily bank review list may be incomplete','Newsletter review list may be incomplete',
      '1 course draft awaiting review in the latest 200 records','1 daily bank draft awaiting review in the latest 24 records'])
      assert.equal(await devtools.evaluate(inbox+'.textContent.includes('+JSON.stringify(text)+')'),true,text);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('drafts awaiting review in the latest 200 records')"),true,'Course dashboard card identifies the sampled count');
    dashboardExactCounts=true;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+"?.textContent.includes('217 course drafts awaiting review') && "+
      inbox+".textContent.includes('31 daily bank drafts awaiting review') && !"+inbox+".textContent.includes('review list may be incomplete')"),'Exact counts supersede capped fallback without a warning');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('Newsletter review queue unavailable')"),false,'Exact zero is a known newsletter count');
    dashboardMalformedCount=true;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+"?.textContent.includes('Course review queue unavailable') && "+
      inbox+".textContent.includes('31 daily bank drafts awaiting review')"),'Malformed count is unavailable while a healthy feed remains usable');
    dashboardExactCounts=false;dashboardMalformedCount=false;
    dashboardQueuesAtLimit=false;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+"?.textContent.includes('2 course drafts awaiting review') && !"+inbox+".textContent.includes('review list may be incomplete')"),'Below-cap queues recover ordinary counts');
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
    dashboardSettingsUnavailable=true;dailyStatus={...dailyStatus,attempts:3};await refreshInbox();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Course generation status is temporarily unavailable.') && "+inbox+".textContent.includes('three-attempt limit')"),'Failed Course settings do not prevent fresh Daily status');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('1 course generation failure')"),false,'Old Course generation status is cleared');
    assert.equal(await devtools.evaluate(inbox+".textContent.includes('1 newsletter draft awaiting review')"),true,'Newsletter recovers independently from its prior outage');
    assert.equal(dailyEditorialWrites,0);assert.equal(dailyGenerationRequests,1);assert.ok(dashboardMetadataRequests>=6);
    dashboardSettingsUnavailable=false;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+".textContent.includes('1 course generation failure')"),'Course settings recover on the next refresh');
    const freshness="document.querySelector('[aria-label=\"Administration data freshness\"] p')";
    const lastSuccessfulRefresh=await devtools.evaluate(freshness+".textContent");
    dashboardFeedsUnavailable=true;await refreshInbox();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Dashboard data refresh failed.')"),'Complete editorial outage is visible');
    assert.equal(await devtools.evaluate(freshness+".textContent"),lastSuccessfulRefresh,'A complete outage cannot advance the last successful refresh');
    dashboardFeedsUnavailable=false;await refreshInbox();
    await wait(()=>devtools.evaluate(inbox+".textContent.includes('1 course generation failure') && !document.body.textContent.includes('Dashboard data refresh failed.')"),'All editorial feeds recover');
    dashboardHold=true;await refreshInbox();
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
    // Keyboard focus may itself refresh; respect the hook's 1s event coalescing.
    await sleep(1100);
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
    const audienceStamp=await devtools.evaluate("[...document.querySelectorAll('p')].find(p=>p.textContent.startsWith('Subscriber and delivery data last refreshed:')).textContent");
    newsletterAudienceUnavailable=true;await adminClick('Refresh subscribers');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Subscriber delivery service unavailable')"),'Exact-count outage disclosed by Newsletter UI');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('p')].some(p=>p.textContent==='Confirmed' && p.parentElement.textContent.includes('7'))"),true,'Unavailable counts must not erase the previous confirmed total or display zero');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('p')].find(p=>p.textContent.startsWith('Subscriber and delivery data last refreshed:')).textContent"),audienceStamp,'Failed counts must not advance successful audience refresh time');
    assert.equal(newsletterWrites,0,'Count outage must not cause any newsletter mutation');
    newsletterAudienceUnavailable=false;newsletterConfirmed=9;await adminClick('Refresh subscribers');
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('p')].some(p=>p.textContent==='Confirmed' && p.parentElement.textContent.includes('9'))"),'Authoritative subscriber total recovers after count outage');
    assert.equal(newsletterPublishRequests,0,'Count recovery never dispatches email');
    console.log('ISOLATED_NEWSLETTER_COUNT_RECOVERY_PASS: HTTP503 preserves last confirmed audience/time, reports unavailable, successful retry updates totals; zero writes or emails.');
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
    // Seed real Router history on both sides of the Course desk. Wait for each
    // actual target desk: URL changes can precede the preceding form unmounting.
    await loadDocument(origin+'/admin/daily');
    await wait(()=>devtools.evaluate("!!document.querySelector('header a[href=\"/admin/courses\"]')"),'Daily to Course history link');
    await devtools.evaluate("document.querySelector('header a[href=\"/admin/courses\"]').click()");
    await wait(()=>devtools.evaluate("location.pathname==='/admin/courses' && [...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Open course desk')"),'Course history entry');
    await devtools.evaluate("document.querySelector('a[href=\"/admin/daily\"]').click()");
    await wait(()=>devtools.evaluate("location.pathname==='/admin/daily' && !!document.querySelector('header a[href=\"/admin/courses\"]')"),'Forward Daily entry');
    await devtools.evaluate('history.back()');
    await wait(()=>devtools.evaluate("location.pathname==='/admin/courses' && [...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Open course desk')"),'Clean Back returns to Course');
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
    await devtools.evaluate('window.__draftPrompts=0;window.confirm=()=>{window.__draftPrompts++;return false};history.back()');
    await wait(()=>devtools.evaluate("window.__draftPrompts===1 && location.pathname==='/admin/courses'"),'Denied browser Back restores current entry');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Final approval')"),true,'Back denial preserves the private draft');
    await devtools.evaluate('history.forward()');
    await wait(()=>devtools.evaluate("window.__draftPrompts===2 && location.pathname==='/admin/courses'"),'Denied browser Forward restores current entry');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Final approval')"),true,'Forward denial preserves the private draft');

    await adminClick('Lock');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Final approval')"),true,
      'Course lock must respect rejected discard confirmation');
    await devtools.evaluate("window.confirm=()=>true");
    await adminClick('Lock');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Course locked and private editor gone');
    assert.equal(await devtools.evaluate("document.querySelector('main form input[type=password]').value"),'');
    assert.equal(courseDeskWrites,0,'Course read/edit/lock smoke cannot mutate drafts or launch AI');
    await devtools.evaluate("window.confirm=()=>{throw Error('Clean Back must not prompt')};history.back()");
    await wait(()=>devtools.evaluate("location.pathname==='/admin/daily' && !!document.querySelector('header a[href=\"/admin/courses\"]')"),'Clean browser Back navigates after Lock');
    await devtools.evaluate('history.forward()');
    await wait(()=>devtools.evaluate("location.pathname==='/admin/courses' && [...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Open course desk')"),'Clean browser Forward');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Open course desk');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Draft inbox (0)')"),'Course reopened for approved Back');
    await adminClick('+ Create a draft');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Final approval')"),'Unsaved draft before approved Back');
    await devtools.evaluate('window.confirm=()=>true;history.back()');
    await wait(()=>devtools.evaluate("location.pathname==='/admin/daily' && !!document.querySelector('header a[href=\"/admin/courses\"]')"),'Approved browser Back discards and navigates');
    assert.equal(courseDeskWrites,0,'History navigation cannot save, publish or generate');

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
    await loadDocument(origin+'/admin/daily');
    await wait(()=>devtools.evaluate("!!document.querySelector('header a[href=\"/admin/reviews\"]')"),'Daily to Review history link');
    await devtools.evaluate("document.querySelector('header a[href=\"/admin/reviews\"]').click()");

    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Master key\"]')"),'Reviews admin unlock');
    await adminInput('input[aria-label="Master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
    await wait(()=>devtools.evaluate("document.querySelector('h1')?.textContent==='Reviews (1)'"),'Private moderation row visible');
    await adminInput('input[aria-label="Review author name"]','Unsaved isolated review name');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('You have unsaved review changes')"),'Review edit marked unsaved');
    await devtools.evaluate('window.__reviewPrompts=0;window.confirm=()=>{window.__reviewPrompts++;return false};history.back()');
    await wait(()=>devtools.evaluate("window.__reviewPrompts===1 && location.pathname==='/admin/reviews'"),'Review Back denial preserves the desk');
    assert.equal(await devtools.evaluate("document.querySelector('input[aria-label=\"Review author name\"]').value"),'Unsaved isolated review name','Back denial preserves unsaved moderation text');

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
    const refreshReviews=async()=>{
      // Confirmation can render before the following failed read releases busy.
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Refresh reviews'&&!e.disabled)"),'Reviews refresh idle');
      await adminClick('Refresh reviews');
    };
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
    reviewListUnavailable=false;await refreshReviews();
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
    reviewListUnavailable=false;await refreshReviews();
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
      reviewListUnavailable=false;await refreshReviews();
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


    console.log('ISOLATED_ADMIN_DRAFT_NAVIGATION_PASS: canceled Course/Daily links, keyboard Newsletter and browser Back/Forward retain unsaved writing; approved link/Back discards navigate; clean history and saved writing never prompt. No extra editorial/provider/email requests.');
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
    await devtools.evaluate("window.__fixtureProposalSha='a'.repeat(40)");await adminClick('Refresh activity');
    const proposalText="document.querySelector('a[href$=\"/pull/902/files\"]')?.parentElement.parentElement.textContent";
    await wait(()=>devtools.evaluate(proposalText+"?.includes('Commit aaaaaaa · Phase 3 validation not reported')"),'First proposal revision validation');
    await devtools.evaluate("window.__fixtureProposalSha='b'.repeat(40);window.__fixtureHoldProposalChecks=true");await adminClick('Refresh activity');
    await wait(()=>devtools.evaluate(proposalText+"?.includes('Commit bbbbbbb') && !!window.__releaseProposalChecks"),'New proposal commit while validation is pending');
    assert.equal(await devtools.evaluate(proposalText+"?.includes('Validation not checked; do not merge')"),true,'Prior validation must not be displayed for a changed PR head');
    await devtools.evaluate('window.__releaseProposalChecks()');
    await wait(()=>devtools.evaluate(proposalText+"?.includes('Commit bbbbbbb · Phase 3 validation not reported')"),'New proposal revision validation');
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

    // Owner-only private generation test remains separate from exhausted live cycles.
    await loadDocument(origin+'/admin/daily');
    await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Private test Daily unlock');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
    const probe="document.querySelector('[aria-label=\"Private Daily generation test\"]')";
    await wait(()=>devtools.evaluate('!!'+probe),'Private test panel');
    const productionBeforeProbe={requests:dailyGenerationRequests,drafts:JSON.stringify(dailyDrafts),status:JSON.stringify(dailyStatus)};
    assert.equal(dailyProbeCalls,0,'Opening the test cannot call Gemini');
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Run one private generation test').disabled"),true,'Explicit free-tier review required');
    await devtools.evaluate(probe+".querySelector('input[type=checkbox]').click();window.confirm=()=>false");
    await adminClick('Run one private generation test');assert.equal(dailyProbeCalls,0,'Cancel confirmation is inert');
    await devtools.evaluate("window.confirm=()=>true;(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Run one private generation test');b.click();b.click();})()");
    await wait(()=>devtools.evaluate(probe+".textContent.includes('Private test passed: 10 exercises and 100 questions')"),'Private test success metadata');
    assert.equal(dailyProbeCalls,1);
    assert.equal(await devtools.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Run one private generation test').disabled"),true,'No immediate repeat');
    assert.deepEqual({requests:dailyGenerationRequests,drafts:JSON.stringify(dailyDrafts),status:JSON.stringify(dailyStatus)},productionBeforeProbe,'Test cannot reset, queue, save or publish the actual bank');
    for(const mode of ['failed','used','malformed','bad-diagnostics','validation']){
      dailyProbeMode=mode;await loadDocument();
      await wait(()=>devtools.evaluate("!!document.querySelector('main form input[type=password]')"),'Private test reload unlock');
      await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
      await wait(()=>devtools.evaluate('!!'+probe),'Private test panel reload');
      await devtools.evaluate(probe+".querySelector('input[type=checkbox]').click();window.confirm=()=>true");
      await adminClick('Run one private generation test');
      await wait(()=>devtools.evaluate(probe+".textContent.includes("+JSON.stringify(mode==='failed'?'Private test failed: PROVIDER_REJECTED (HTTP 400)':mode==='used'?'one-test allowance is already used':mode==='validation'?'Validation: EXERCISE_STRUCTURE':mode==='bad-diagnostics'?'diagnostic metadata could not be verified':'private test result could not be verified')+")"),'Private test '+mode+' disclosed');
    }
    assert.equal(await devtools.evaluate(probe+".textContent.includes('MAX_TOKENS') && "+probe+".textContent.includes('shortest explanation: 7 characters')"),true,'Safe stage/provider/length diagnostics render without model prose');
    assert.equal(await devtools.evaluate("document.body.textContent.includes('PRIVATE_DIAGNOSTIC_VALUE')"),false,'Forged diagnostic text cannot render');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:850,deviceScaleFactor:1,mobile:true});
    for(const theme of ['light','dark']){
      await devtools.evaluate("document.documentElement.classList.toggle('dark',"+(theme==='dark')+")");
      assert.ok(await devtools.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Private test fits 320px '+theme);
    }
    await adminClick('Lock');
    await wait(()=>devtools.evaluate('!'+probe),'Private test results cleared by lock');
    dailyProbeMode='held';
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
    await wait(()=>devtools.evaluate('!!'+probe),'Private test late-response panel');
    await devtools.evaluate(probe+".querySelector('input[type=checkbox]').click();window.confirm=()=>true");
    const beforeHeldProbe=dailyProbeCalls;
    await adminClick('Run one private generation test');await wait(()=>dailyProbeCalls===beforeHeldProbe+1,'Private request held');
    await adminClick('Lock');
    await wait(()=>devtools.evaluate('!'+probe),'Private request locks while pending');
    await adminInput('main form input[type=password]',ADMIN_FIXTURE_KEY);await adminClick('Unlock');
    await wait(()=>devtools.evaluate('!!'+probe),'New private test session opened');
    await sleep(700);
    assert.equal(await devtools.evaluate(probe+".textContent.includes('Private test passed:')"),false,'Old reply cannot restore a result in the new session');
    assert.equal(await devtools.evaluate(probe+".querySelector('input[type=checkbox]').checked"),false,'New session retains fresh consent requirement');
    assert.equal(dailyProbeCalls,beforeHeldProbe+1,'Unlock never retries an earlier request');
    await adminClick('Lock');dailyProbeMode='passed';
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    console.log('ISOLATED_DAILY_PRIVATE_TEST_PASS: explicit review+confirmation, real owner JWT attached, no automatic invocation/repeat, pass/400/quota states, unchanged production-cycle fixtures, lock clears result, 320px themes; fake backend/provider only.');

    // Reference information cannot become an execution quote or account write.
    await loadDocument(origin+'/trade/eurusd');
    // Prior owner-only cases intentionally retain the fixture session. Wait for
    // hydrated auth before deciding to sign out; an early absent menu is not a guest.
    await wait(()=>devtools.evaluate("!!document.querySelector('[aria-label=\"Account menu\"]')"),'FX owner fixture hydrated before sign-out');
    {
      await devtools.evaluate("document.querySelector('[aria-label=\"Account menu\"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,ctrlKey:false}))");
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent.trim()==='Sign out')"),'FX fixture sign-out menu');
      await devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.trim()==='Sign out').click()");
      await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]') && !localStorage.getItem('tradehq:portfolio-owner')"),'FX fixture guest');
      await loadDocument(origin+'/trade/eurusd');
    }
    const fxPanel="document.querySelector('[aria-label=\"Daily forex reference\"]')";
    await wait(()=>devtools.evaluate(fxPanel+"?.textContent.includes('Reference date:')"),'Dated FX reference renders');
    const beforeFx=await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))");
    assert.ok(await devtools.evaluate(fxPanel+".textContent.includes('1.234567') && "+fxPanel+".querySelector('time').dateTime==="+JSON.stringify(fxDate)), 'Actual source date and rate are visible');
    assert.ok(await devtools.evaluate(fxPanel+".textContent.includes('does not set trade prices or portfolio values')"));
    const readsBeforeNavigation=fxReferenceReads;
    await devtools.evaluate("document.querySelector('[aria-label^=\"Choose an asset\"]').click()");
    await wait(()=>devtools.evaluate("!!document.querySelector('#asset-search-panel input')"),'FX asset chooser');
    await adminInput('#asset-search-panel input','GBP/USD');
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('#asset-search-panel button')].some(e=>e.textContent.includes('GBP/USD'))"),'GBP choice');
    await devtools.evaluate("[...document.querySelectorAll('#asset-search-panel button')].find(e=>e.textContent.includes('GBP/USD')).click()");
    await wait(()=>devtools.evaluate("location.pathname==='/trade/gbpusd' && "+fxPanel+"?.textContent.includes('1.345678')"),'Client FX navigation shares cached batch');
    assert.equal(fxReferenceReads,readsBeforeNavigation,'Changing pair reuses one reference read');
    assert.deepEqual(await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))"),beforeFx,'Reading references cannot revalue or mutate the portfolio');
    await adminInput('input[aria-label="Amount in GBP/USD"]','1');
    await wait(()=>guestClick('Buy GBP/USD'),'Guest FX execution');
    await wait(()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio')).trades.length>"+beforeFx.trades.length),'FX trade saved locally');
    assert.equal(dataWrites,0,'FX guest transition must never attempt an account order');
    const afterFx=await devtools.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))");
    assert.equal(afterFx.trades[0].assetId,'gbpusd');
    assert.notEqual(afterFx.trades[0].price,1.345678,'Daily reference never supplies executable price');
    assert.equal(dataWrites,0,'Reference browsing/trading must not add forbidden backend writes');
    for(const mode of ['unavailable','future']){
      fxReferenceMode=mode;await loadDocument(origin+'/trade/eurusd');
      await wait(()=>devtools.evaluate(fxPanel+"?.textContent.includes('temporarily unavailable')"),'FX '+mode+' information disclosed');
      assert.equal(await devtools.evaluate(fxPanel+".querySelector('time')===null"),true,'Unavailable or future data cannot display a dated rate');
      assert.ok(await devtools.evaluate("!!document.querySelector('input[aria-label=\"Amount in EUR/USD\"]')"),'Order panel remains available');
    }
    fxReferenceMode='valid';await loadDocument(origin+'/trade/eurusd');
    await wait(()=>devtools.evaluate(fxPanel+"?.textContent.includes('Loading reference information')"),'Accessible FX loading status');
    await wait(()=>devtools.evaluate(fxPanel+"?.querySelector('time')!==null"),'Reference returns after outage');
    await devtools.send('Emulation.setDeviceMetricsOverride',{width:320,height:850,deviceScaleFactor:1,mobile:true});
    for(const theme of ['light','dark']){
      await devtools.evaluate("document.documentElement.classList.toggle('dark',"+(theme==='dark')+")");
      assert.ok(await devtools.evaluate("document.documentElement.scrollWidth<=innerWidth+1"),'320px '+theme+' reference fits');
      assert.ok(await devtools.evaluate(fxPanel+".getBoundingClientRect().width<=320"));
    }
    await loadDocument(origin+'/trade/btc');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Amount in BTC\"]')"),'BTC remains usable');
    assert.equal(await devtools.evaluate(fxPanel+'===null'),true,'Reference panel is forex only');
    console.log('ISOLATED_FX_REFERENCE_BROWSER_PASS: dated source, shared pair cache, real guest trade uses independent execution price, unchanged portfolio on reads, outage/future rejection, loading, 320px light/dark; no real provider calls.');

    console.log('ISOLATED_AUTOMATION_INBOX_PASS: compiled dashboard combines course, Daily and Newsletter drafts, failures, cooldown, open findings and proposals; collector evidence linked to commit; partial outages stay unknown while other feeds update; zero mutations. Fixture only.');
    console.log('ISOLATED_COURSE_PROGRESS_BROWSER_PASS: null tracks, null lessons and invalid lesson rows recovered; valid unrelated completion/badge retained after real lesson save and reload; fixture only.');
    const courseLesson = coursePath + "/what-is-an-option";
    const setRestoredProgress = async tracks => devtools.evaluate(`(() => {
      localStorage.setItem("tradehq_course_progress_v1", JSON.stringify({v: 1, tracks: ${JSON.stringify(tracks)}}));
      window.dispatchEvent(new Event("tradehq:course-progress-updated"));
    })()`);
    const restoredTrack = {
      "options-trading-fundamentals": { lessons: { "what-is-an-option": {status: "completed", score: 4} } },
    };
    await setRestoredProgress({});
    await loadDocument(origin + coursePath);
    await wait(() => devtools.evaluate(`!!document.querySelector('a[href="${courseLesson}"] svg.lucide-circle')`), "Open course shows incomplete lesson before restoration");
    await setRestoredProgress(restoredTrack);
    await wait(() => devtools.evaluate(`!!document.querySelector('a[href="${courseLesson}"] svg[class*="check"]')`), "Open course reflects restored lesson without reload");
    await setRestoredProgress({});
    await loadDocument(origin + "/courses");
    const card = `document.querySelector('a[href="${coursePath}"]')`;
    await wait(() => devtools.evaluate(card + "?.textContent.includes('0% complete')"), "Open catalog shows initial completion");
    await setRestoredProgress(restoredTrack);
    await wait(() => devtools.evaluate(card + "?.textContent.includes('20% complete')"), "Open catalog reflects restored completion without reload");
    console.log("ISOLATED_COURSE_RESTORATION_UI_PASS: track and catalog show asynchronous account progress without reload.");
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
