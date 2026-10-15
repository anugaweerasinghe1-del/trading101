import assert from "node:assert/strict";
import { getFeatureInventory, hasObviousDuplicate } from "./agent-feature-inventory.mjs";
import { assessBrowserHtml, probeBrowserRoute } from "./agent-browser-smoke.mjs";
const inventory=getFeatureInventory();
assert.ok(inventory.features.length>=14,"Need a meaningful source-backed feature inventory.");
assert.ok(inventory.routes.length>=25,"Require actual declared site routes.");
for(const f of inventory.features){
 assert.ok(f.file.startsWith("src/pages/"));
 assert.ok(f.evidence.length>0,"Need verifiable source snippets for "+f.name);
}
assert.ok(hasObviousDuplicate({title:"Peer Challenge Duel Creator",userExperience:"Generate shareable peer challenges"},[]));
assert.ok(hasObviousDuplicate({title:"Daily Quiz and Streak Tracker",userExperience:"quiz streaks"},[]));
assert.ok(hasObviousDuplicate({title:"Interactive Candlestick Pattern Sandbox",userExperience:"A candlestick sandbox"},["Interactive Candlestick Pattern Sandbox"]));
assert.equal(hasObviousDuplicate({title:"Accessible keyboard-navigation guide",userExperience:"Explain keyboard access in a tutorial"},[]),false);
const valid = html=>'<html><head><title>Test</title></head><body><div id="root"><main><h1>TradeHQ site</h1><p>'+html+'</p></main></div></body></html>';
assert.equal(assessBrowserHtml("/",valid("A sufficiently detailed site renders here and includes educational explanations and plenty of useful information.")),null);
assert.match(assessBrowserHtml("/","<html><body><div id=\"root\"></div></body></html>"),/very little/);
assert.match(assessBrowserHtml("/learn",valid('<main data-route-loading="" role="status">Loading your page. Your TradeHQ page is on its way. Please wait a moment while we get it ready.</main>')),/still loading/);
assert.match(assessBrowserHtml("/admin",valid("Completely unrelated heading with educational explanations long enough to pass the basic content check.")),/Admin landing/);
assert.match(assessBrowserHtml("/",valid("Something went wrong and API returned 429, an important public error")),/error is visibly/);
const healthy={status:0,stdout:valid('A sufficiently detailed site renders here and includes educational explanations and plenty of useful information.')};
const timeout={status:null,error:{code:'ETIMEDOUT',message:'spawnSync google-chrome ETIMEDOUT'}};
let calls=0;
assert.deepEqual(probeBrowserRoute('/',()=>++calls===1?timeout:healthy,{retryAllowed:true}),{failure:null,retried:true,recovered:true});
assert.equal(calls,2);
for(const result of [{status:0,stdout:valid('API returned 429, an important visible public error with sufficiently detailed text.')},{status:0,stdout:'<html><body><div id="root"></div></body></html>'},{status:1,stdout:''},{status:null,error:{code:'ENOENT',message:'Chrome missing'}}]){
  calls=0;const probe=probeBrowserRoute('/',()=>{calls++;return result},{retryAllowed:true});
  assert.ok(probe.failure);assert.equal(probe.retried,false);assert.equal(calls,1,'Application/unknown process failures must not be hidden by retries');
}
calls=0;assert.ok(probeBrowserRoute('/',()=>{calls++;return timeout},{retryAllowed:false}).failure);assert.equal(calls,1);
calls=0;assert.ok(probeBrowserRoute('/',()=>{calls++;return timeout},{retryAllowed:true}).failure);assert.equal(calls,2,'Repeated timeout stops after one retry');
console.log("Verified "+inventory.features.length+" source-backed features, "+inventory.routes.length+" routes, deterministic idea dedupe and public-browser failure detection.");
