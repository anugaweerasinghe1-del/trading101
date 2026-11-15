import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const [origin,tag]=process.argv.slice(2);assert.ok(origin&&tag);const root='/workspace/work/issue-430-review-service';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();const modules=[];const requests=[];const pending=[];
 await context.route('**/*',route=>{const req=route.request();if(!['GET','HEAD','OPTIONS'].includes(req.method())){requests.push({method:req.method(),url:new URL(req.url()).origin+new URL(req.url()).pathname,blocked:true});return route.abort();}return route.continue();});
 page.on('response',response=>{if(/\/adminFunctionError-[^/]+\.js/.test(response.url()))pending.push((async()=>{const source=await response.text();modules.push({url:response.url(),status:response.status(),sha256:crypto.createHash('sha256').update(source).digest('hex'),hasSpecificQuotaMessage:source.includes('exhausted its quota'),hasSpecificServiceMessage:source.includes('returned HTTP'),hasSpecificRejectionMessage:source.includes('rejected this revision')});})());});
 const response=await page.goto(origin+'/admin/courses',{waitUntil:'networkidle',timeout:60000});await page.getByRole('button',{name:'Open course desk'}).waitFor();await Promise.all(pending);const body=await page.locator('body').innerText();assert.ok(modules.length>0,'Error adapter chunk must actually load');for(const m of modules){assert.equal(m.status,200);assert.ok(m.hasSpecificQuotaMessage&&m.hasSpecificServiceMessage&&m.hasSpecificRejectionMessage,'Latest diagnostic code must be served');}
 const compiledAdapterChecks=await page.evaluate(async moduleURL=>{
   const exports=await import(moduleURL);const outcomes=[];
   for(const [code,error,expected] of [
     ['COURSE_CHANGED','Course changed since review.','saved revision changed'],
     ['COURSE_VALIDATION','Course is incomplete.','content checks'],
     ['COURSE_REVIEW_BLOCKED','Independent course quality review blocked this draft.','rejected this revision'],
     ['COURSE_REVIEW_UNAVAILABLE','Independent course review unavailable. Draft withheld (HTTP 404).','returned HTTP 404'],
     ['COURSE_REVIEW_QUOTA','Free AI quota exhausted.','exhausted its quota'],
     ['COURSE_REVIEW_CONFIG','Course publication configuration requires a verified free Gemini model.','refreshing cannot fix'],
     ['COURSE_SOURCES_UNAVAILABLE','Too few verified sources.','reference sources'],
     ['COURSE_WRITE_FAILED','PRIVATE_PROVIDER_TOKEN','server diagnostics']
   ]){
     const values=await Promise.all(Object.values(exports).filter(fn=>typeof fn==='function').map(fn=>fn({context:new Response(JSON.stringify({code,error}),{status:409})})));
     const messages=values.filter(value=>typeof value==='string');
     outcomes.push({code,passed:messages.length===1&&messages[0].includes(expected)&&!messages[0].includes('PRIVATE_PROVIDER_TOKEN'),displayed:messages[0]});
   }
   return outcomes;
 },modules[0].url);assert.ok(compiledAdapterChecks.length===8&&compiledAdapterChecks.every(check=>check.passed),'Actual served browser adapter must classify all eight failure fixtures safely');
 const structuredFeedbackCheck=await page.evaluate(async moduleURL=>{
 const exports=await import(moduleURL);const wire={code:'COURSE_REVIEW_BLOCKED',error:'Independent course quality review blocked this draft.',reviewFindings:['Fixture concern: verify this calculation.']};
 const values=await Promise.all(Object.values(exports).filter(fn=>typeof fn==='function').map(fn=>fn({context:new Response(JSON.stringify(wire),{status:409})})));
 return values.some(value=>value&&typeof value==='object'&&JSON.stringify(value.reviewFindings)===JSON.stringify(wire.reviewFindings));
 },modules[0].url);assert.equal(structuredFeedbackCheck,true,'Production compiled adapter must preserve designated reviewer concerns');
 const structuredDiagnosticChecks=await page.evaluate(async moduleURL=>{
 const exports=await import(moduleURL);const out=[];
 for(const [code,expected] of [['PASS_WITH_FINDINGS','combined PASS with findings'],['OUTPUT_TRUNCATED','output limit'],['INVALID_JSON','INVALID_JSON']]){
  const body={code:'COURSE_REVIEW_UNAVAILABLE',error:'Independent course review unavailable. Draft withheld.',reviewDiagnostics:{code,findingCount:3,apiKey:'PRIVATE_PROVIDER_TOKEN'},providerPayload:'PRIVATE_PROVIDER_TOKEN'};
  const values=await Promise.all(Object.values(exports).filter(fn=>typeof fn==='function').map(fn=>fn({context:new Response(JSON.stringify(body),{status:409})})));
  const messages=values.filter(value=>typeof value==='string');const details=values.find(value=>value&&typeof value==='object'&&value.reviewDiagnostics?.code===code);
  out.push({code,passed:messages.length===1&&messages[0].includes(expected)&&!!details&&!JSON.stringify(values).includes('PRIVATE_PROVIDER_TOKEN'),displayed:messages[0]});
 }
 return out;
 },modules[0].url);assert.ok(structuredDiagnosticChecks.length===3&&structuredDiagnosticChecks.every(r=>r.passed),'Actual production adapter must preserve safe diagnostics and specific messages');
 assert.equal(response.status(),200);assert.match(body,/Course desk/);assert.match(body,/Master key/);assert.equal(await page.locator('input[type=password]').inputValue(),'');
 const html=await response.text();fs.writeFileSync(root+'/'+tag+'-admin-native.html',html);fs.writeFileSync(root+'/'+tag+'-admin-rendered.txt',body);await page.screenshot({path:root+'/'+tag+'-admin-mobile.png',fullPage:true});
 const result={observedAtUTC:new Date().toISOString(),origin,url:page.url(),status:response.status(),state:'New isolated guest context; locked course desk; no admin key or owner session supplied.',nativeHTMLSHA256:crypto.createHash('sha256').update(html).digest('hex'),renderedTextSHA256:crypto.createHash('sha256').update(body).digest('hex'),loadedErrorModules:modules,compiledAdapterChecks,structuredFeedbackCheck,structuredDiagnosticChecks,compiledAdapterChecksUseOnlySyntheticFailureFixtures:true,nonReadRequests:requests,publicationAttempted:false,editorialPageReview:false};fs.writeFileSync(root+'/'+tag+'-admin-release.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
