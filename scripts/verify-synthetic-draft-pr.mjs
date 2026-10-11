import assert from "node:assert/strict";
import {syntheticGate,fixtureBody,createSyntheticDraft} from "./agent-synthetic-draft-pr.mjs";
const SHA="a".repeat(40);
const good={repo:"anugaweerasinghe1-del/trading101",actor:"anugaweerasinghe1-del",
  event:"workflow_dispatch",ref:"refs/heads/main",confirm:"SYNTHETIC_DRAFT_ONLY",
  enabled:"true",stop:"explicitly-resumed-for-fixture",run:"38199999999",attempt:"1",sha:SHA};
const permitted=syntheticGate(good);
assert.equal(permitted.path,"docs/repair-fixtures/synthetic-style-review.md");
assert.match(fixtureBody(good),/mb-6/);
for(const bad of [
  {actor:"visitor"},{event:"issues"},{event:"schedule"},{ref:"refs/heads/fork"},
  {confirm:"yes"},{enabled:"false"},{enabled:undefined},{stop:"STOPPED"},
  {stop:undefined},{run:"bad"},{attempt:"2"},{sha:"short"},{repo:"attacker/repo"},
])assert.throws(()=>syntheticGate({...good,...bad}));
let calls=[];
const api=async(method,path,body)=>{
  calls.push({method,path,body});
  if(path==="/git/ref/heads/main")return {object:{sha:SHA}};
  if(path.startsWith("/pulls?"))return [];
  if(path.startsWith("/git/commits/"))return {tree:{sha:"b".repeat(40)}};
  if(path==="/git/blobs")return {sha:"c".repeat(40)};
  if(path==="/git/trees")return {sha:"d".repeat(40)};
  if(path==="/git/commits")return {sha:"e".repeat(40)};
  if(path==="/git/refs")return {ref:body.ref,object:{sha:body.sha}};
  if(path==="/pulls" && method==="POST")return {number:104,draft:true,base:{ref:"main"},head:{sha:"e".repeat(40)}};
  if(path==="/pulls/104/files?per_page=100")return [{filename:permitted.path,status:"added"}];
  throw Error("Unexpected mock URL");
};
const result=await createSyntheticDraft(good,{request:api});
assert.equal(result.number,104);assert.equal(result.draft,true);
assert.deepEqual(calls.filter(x=>x.method==="POST").map(x=>x.path),
  ["/git/blobs","/git/trees","/git/commits","/git/refs","/pulls"]);
await assert.rejects(createSyntheticDraft({...good,actor:"intruder"},{request:api}));
await assert.rejects(createSyntheticDraft(good,{request:async(m,p)=>{
  if(p==="/git/ref/heads/main")return{object:{sha:"f".repeat(40)}};return api(m,p)}}));
await assert.rejects(createSyntheticDraft(good,{request:async(m,p)=>{
  if(p==="/git/ref/heads/main")return{object:{sha:SHA}};
  if(p.startsWith("/pulls?"))return [{title:"[Fixture] Synthetic styling review — NOT a production repair",
    created_at:new Date().toISOString()}];return api(m,p)}}));
await assert.rejects(createSyntheticDraft(good,{request:async(m,p,b)=>{
  if(p==="/pulls/104/files?per_page=100")return[{filename:"src/pages/Trade.tsx",status:"modified"}];
  return api(m,p,b)}}));
console.log("Synthetic PR gate: owner-only dispatch, default-off, stop, exact main, 24h budget, one inert file, draft-only and unsafe diff denied.");
