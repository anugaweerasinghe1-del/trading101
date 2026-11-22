/** Bounded, reproducible source-block inventory for the TradeHQ editorial audit.
 * This is NOT an assertion of a human, live-browser, copyright or policy review.
 * Generates public source-only evidence with SHA-256 and explicit unreviewed states.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync, mkdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {uniqueRoutes, DOMAIN} from "./routes.ts";
import {buildContentMap} from "./content.ts";
import {applyCourseEditorialCorrections} from "../src/lib/courseEditorialCorrections.ts";

const base = "docs/audits/adsense-2026-11-22-exhaustive";
const text = readFileSync(join(base,"035-second-pass-route-reconciliation.csv"),"utf8");
const rows = [...text.matchAll(/^"([^"]+)","([^"]+)"/gm)].map(m=>({url:m[1],mode:m[2]}));
assert.equal(rows.length,163,"The exact audited publisher list must have 163 entries");
const expected=new Map(rows.map(r=>[r.url,r.mode]));
assert.equal(expected.size,163,"Duplicate expected canonical route");
const approved=JSON.parse(readFileSync(join(base,"approved-public-course-source-2026-11-22.json"),"utf8"));
assert.equal(approved.docs.length,3,"Expected exactly three already published dynamic course snapshots");
const routes=uniqueRoutes().filter(x=>!x.noindex);
const content=await buildContentMap();
const pages=[], blocks=[], seen=new Set();
function sha256(value){return createHash("sha256").update(value,"utf8").digest("hex")}
function addPage(path,meta,mode,cb){
  const url=DOMAIN+(path==="/"?"/":path);
  assert.equal(seen.has(url),false,"Repeated route: "+url);
  assert.equal(expected.get(url),mode,"Unexpected reviewed route/mode: "+url);
  seen.add(url);
  const mine=[];
  function add(kind,sourceKey,value){
    if(value===null||value===undefined)return;
    const text=String(value);
    assert.ok(text.trim(),"Empty block "+url+" "+kind+" "+sourceKey);
    const id=path+"#"+String(mine.length+1).padStart(4,"0");
    const item={id,url,kind,sourceKey,sha256:sha256(text),utf8Bytes:Buffer.byteLength(text,"utf8"),
      assessedByThisGenerator:false,contentReviewStatus:"NOT_ATTESTED_PER_BLOCK",
      riskClassification:"NOT_ASSESSED",issueIds:[]};
    blocks.push(item);mine.push(item);
  }
  cb(add);
  assert.ok(mine.length>=5,"Unusually short publisher source: "+url);
  const pageHash=sha256(mine.map(x=>x.kind+"|"+x.sourceKey+"|"+x.sha256).join("\n"));
  pages.push({url,title:meta,secondPassMode:mode,pageSourceHash:pageHash,
    inventoriedBlocks:mine.length,perBlockIndividuallyAttested:0,
    firstPass:"PAGE_LEVEL_REVIEW_RECORDED",secondPass:"BOUNDED_BODY_REVIEW_RECORDED",
    finalStatus:"BLOCKED_FULL_RENDERED_BLOCK_AND_MEDIA_ACCEPTANCE"});
}
for(const r of routes){
  const page=content.get(r.path);
  assert.ok(page && page.sections?.length,"Crawler-visible content required for "+r.path);
  addPage(r.path,r.title,expected.get(DOMAIN+(r.path==="/"?"/":r.path)),add=>{
    add("meta","title",r.title);
    add("meta","description",r.description);
    add("main-heading","h1",r.h1);
    add("intro","summary",r.summary);
    page.sections.forEach((s,i)=>{
      add("section-heading","sections."+i+".h",s.h);
      (s.p||[]).forEach((v,j)=>add("paragraph","sections."+i+".p."+j,v));
      (s.list||[]).forEach((v,j)=>add("list-item","sections."+i+".list."+j,v));
    });
    (page.links||[]).forEach((l,i)=>{
      add("link-label","links."+i+".label",l.label);
      add("link-destination","links."+i+".href",l.href);
    });
  });
}
for(const {slug,document:raw} of approved.docs){
  assert.equal(raw.slug,slug,"Approved course slug mismatch");
  assert.equal(raw.lessons.length,3,"Expected three lessons per approved dynamic course");
  const d=applyCourseEditorialCorrections(raw);
  function index(add){
    for(const k of ["title","tagline","description","level","prerequisites","progression","notFor"])
      add("course-metadata",k,d[k]);
    if(d.badge){add("course-badge","badge.name",d.badge.name);
      add("course-badge","badge.description",d.badge.description)}
    (d.outcomes||[]).forEach((s,i)=>add("course-outcome","outcomes."+i,s));
    (d.lessons||[]).forEach((l,i)=>{
      add("lesson-link","lessons."+i+".title",l.title);
      add("lesson-summary","lessons."+i+".summary",l.summary);
    });
  }
  addPage("/courses/"+slug,d.title,expected.get(DOMAIN+"/courses/"+slug),index);
  d.lessons.forEach(l=>{
    const route="/courses/"+slug+"/"+l.slug;
    addPage(route,l.title,expected.get(DOMAIN+route),add=>{
      add("lesson-title","title",l.title);
      add("lesson-summary","summary",l.summary);
      (l.body||[]).forEach((s,i)=>add(/^#+ /.test(s)?"section-heading":"paragraph","body."+i,s));
      (l.keyTakeaways||[]).forEach((s,i)=>add("takeaway","keyTakeaways."+i,s));
      (l.sources||[]).forEach((s,i)=>{add("reference-label","sources."+i+".label",s.label);
        add("reference-url","sources."+i+".url",s.url)});
      (l.quiz||[]).forEach((q,i)=>{
        add("quiz-question","quiz."+i+".question",q.question);
        (q.options||[]).forEach((s,j)=>add("quiz-option","quiz."+i+".options."+j,s));
        add("quiz-answer-index","quiz."+i+".correctAnswer",q.correctAnswer);
        add("quiz-explanation","quiz."+i+".explanation",q.explanation);
      });
    });
  });
}
assert.equal(routes.length,151,"Expected 151 statically indexable publisher routes");
assert.equal(pages.length,163,"Missing source publishers");
assert.equal(seen.size,expected.size,"Source inventory differs from page ledger");
for(const url of expected.keys())assert.ok(seen.has(url),"Uninventoried canonical URL "+url);
const directory=join(base,"generated-block-receipt");
mkdirSync(directory,{recursive:true});
function csv(x){return '"'+String(x).replace(/"/g,'""')+'"'}
const columns=["url","title","pageSourceHash","inventoriedBlocks","perBlockIndividuallyAttested","firstPass","secondPass","secondPassMode","finalStatus"];
writeFileSync(join(directory,"editorial-page-coverage.csv"),
  columns.join(",")+"\n"+pages.map(p=>columns.map(c=>csv(p[c])).join(",")).join("\n")+"\n");
writeFileSync(join(directory,"editorial-block-evidence.jsonl"),
  blocks.map(b=>JSON.stringify(b)).join("\n")+"\n");
const report={schema:"tradehq-editorial-source-inventory-v1",scope:"Source blocks only; no policy/rights/visual attestation",
  canonicalPages:pages.length,staticallyGenerated:routes.length,approvedDynamic:approved.docs.length*4,
  sourceBlocks:blocks.length,attestedIndividualBlocks:0,
  sourceSha256:sha256(JSON.stringify(pages.map(p=>[p.url,p.pageSourceHash]))),
  blockers:["Full hydrated and no-JS rendered body parity","Manual second reading per block",
    "External URLs and source suitability","Licensed media provenance","480-URL independent current public crawl",
    "Native deployment SHA of production provider","Owner/account verification and age-appropriate advertising eligibility"]};
writeFileSync(join(directory,"SUMMARY.json"),JSON.stringify(report,null,2)+"\n");
console.log("PASS generated bounded source-block inventory",JSON.stringify(report));
