/**
 * Read-only production page/link inventory. GET requests only, one page at a time.
 * Initial HTML is evidence of published content, not proof of hydrated UX,
 * originality, account eligibility or Google's private review outcome.
 */
import {readFileSync, writeFileSync} from "node:fs";
const ORIGIN = "https://www.thetradehq.com";
const reportOnly = process.argv.includes("--report-only");
const report = {checkedAt:new Date().toISOString(), sitemap:ORIGIN+"/sitemap.xml", count:0, pages:[], links:[], externalReferences:[], problems:[], warnings:[], limits:[
  "Sequential GET crawl of current sitemaps, discovered anchors and historical route seeds",
  "Initial HTML review is separate from the compiled browser matrix and live interactions",
  "Historical seeds are only discovery inputs; every reported observation is fetched again",
  "No account sessions, form submissions, ad clicks, model requests or paid APIs",
  "Word counts and link checks do not establish originality or guarantee AdSense approval"
]};
const decode = value => value.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const clean = html => decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi," ").replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
function attr(tag,name) {
  const match=tag.match(new RegExp("(?:^|\\s)"+name+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))","i"));
  return decode(match?(match[1]??match[2]??match[3]??""):"");
}
function tag(html,name,key,value) {
  return [...html.matchAll(new RegExp("<"+name+"\\b[^>]*>","gi"))].map(m=>m[0]).find(t=>attr(t,key).toLowerCase()===value)??"";
}
async function get(url) {
  let last;
  for(let attempt=1;attempt<=3;attempt++) {
    try {
      const response=await fetch(url,{headers:{"User-Agent":"TradeHQ-ReadOnly-Publisher-Audit/2.0","Accept":"text/html,application/xml;q=0.9,*/*;q=0.5","Cache-Control":"no-cache"},redirect:"follow",signal:AbortSignal.timeout(18000)});
      if((response.status===429||response.status>=500)&&attempt<3) throw Error("Retryable HTTP "+response.status);
      return {response,html:await response.text()};
    } catch(error) {last=error;if(attempt<3)await new Promise(r=>setTimeout(r,1000*attempt));}
  }
  throw last;
}
const queue=[], queued=new Set(), sitemapPages=new Set(), external=new Set();
const sources=new Map(), documentIds=new Map();
function normalize(value,base=ORIGIN) {
  try {
    const url=new URL(decode(value),base);
    if(!/^https?:$/.test(url.protocol))return null;
    if(!["www.thetradehq.com","thetradehq.com"].includes(url.hostname))return null;
    url.protocol="https:";url.host="www.thetradehq.com";url.hash="";url.search="";
    url.pathname=url.pathname.replace(/\/+$/,"")||"/";
    if(/^\/(?:api|publisher-notes)(?:\/|$)/.test(url.pathname)||/\.(?:js|css|json|png|jpe?g|svg|ico|woff2?|mp3|mp4|xml|txt|pdf|zip)$/i.test(url.pathname))return null;
    return url.href;
  }catch{return null;}
}
function enqueue(value,from) {
  const url=normalize(value,from);
  if(!url)return;
  if(!sources.has(url))sources.set(url,new Set());
  sources.get(url).add(from);
  if(queued.has(url))return;
  if(queue.length>=1000){if(!report.problems.some(x=>x.type==="inventory-cap"))report.problems.push({type:"inventory-cap",detail:"Review incomplete: over 1000 distinct page paths"});return;}
  queued.add(url);queue.push(url);
}
try {
  for(const sitemap of [ORIGIN+"/sitemap.xml",ORIGIN+"/course-sitemap.xml"]) {
    const {response,html}=await get(sitemap);
    if(!response.ok||!/<(?:urlset|sitemapindex)\b/.test(html))throw Error("Sitemap unavailable or invalid: "+sitemap+" HTTP "+response.status);
    const locations=[...html.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m=>decode(m[1].trim()));
    if(sitemap.endsWith("/sitemap.xml"))report.count=locations.length;
    for(const location of locations) {
      const url=normalize(location);
      if(!url){report.problems.push({type:"invalid-sitemap-location",url:location});continue;}
      sitemapPages.add(url);enqueue(url,sitemap);
    }
  }
  try {
    const seeds=JSON.parse(readFileSync("docs/adsense-2026-10-19/Baseline-357-HTTP-Observations.json","utf8")).observations;
    for(const seed of seeds)enqueue(seed.url,"historical-route-discovery");
    report.historicalSeedCount=seeds.length;
  }catch(error){report.problems.push({type:"historical-seeds-unavailable",detail:String(error.message)});}
  console.log("LIVE_SITEMAP_URL_COUNT "+report.count);
  for(let index=0;index<queue.length;index++) {
    const url=queue[index], page={index:index+1,url,checkedAt:new Date().toISOString(),status:null,words:0,errors:[],warnings:[],title:"",canonical:"",h1Count:0,inSitemap:sitemapPages.has(url)};
    try {
      const {response,html}=await get(url);page.status=response.status;page.finalUrl=response.url;
      if(response.status!==200)page.errors.push("unexpected-http-status:"+response.status);
      if(!/text\/html/i.test(response.headers.get("content-type")??""))page.errors.push("non-html-response");
      if(normalize(response.url)===null)page.errors.push("unexpected-redirect-destination");
      page.title=clean(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]??"");
      page.canonical=attr(tag(html,"link","rel","canonical"),"href");
      const robots=attr(tag(html,"meta","name","robots"),"content")+" "+(response.headers.get("x-robots-tag")??"");
      page.indexable=!/noindex/i.test(robots);
      page.robots=robots.trim();
      const final=normalize(response.url);
      if(page.inSitemap&&!page.indexable)page.errors.push("sitemap-page-noindex");
      if(page.indexable) {
        if(page.title.length<8)page.errors.push("missing-or-uninformative-title");
        if(/loading the interactive experience|page not found|temporarily unavailable/i.test(page.title))page.errors.push("placeholder-title");
        if(!page.canonical||normalize(page.canonical)!==final)page.errors.push("canonical-mismatch:"+page.canonical);
      }
      page.description=attr(tag(html,"meta","name","description"),"content");
      page.h1Count=[...html.matchAll(/<h1\b/gi)].length;
      const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
      page.content=clean(main?.[1]??"");
      page.words=page.content.split(/\s+/).filter(Boolean).length;
      page.headings=[...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(m=>clean(m[1]));
      if(page.indexable) {
        if(page.h1Count!==1)page.errors.push("unexpected-h1-count:"+page.h1Count);
        if(!main)page.errors.push("no-main-landmark");
        if(page.description.length<35)page.warnings.push("short-or-missing-meta-description");
        if(page.words<160)page.warnings.push("limited-initial-main-content:"+page.words);
        if(/error loading|cannot load content|lorem ipsum|under construction/i.test(page.content.slice(0,1800)))page.warnings.push("possible-visible-error-or-placeholder-copy");
      }
      documentIds.set(url,new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(m=>decode(m[1]))));
      for(const match of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
        const href=attr(match[0].slice(0,match[0].indexOf(">")+1),"href");
        if(!href||/^(?:mailto|tel|javascript|data):/i.test(href))continue;
        let destination;try{destination=new URL(href,response.url);}catch{page.errors.push("malformed-link:"+href);continue;}
        const target=normalize(destination.href);
        if(target) {
          report.links.push({from:url,to:target,fragment:destination.hash.slice(1),label:clean(match[1])});
          enqueue(target,url);
        } else if(/^https?:$/.test(destination.protocol)&&!["www.thetradehq.com","thetradehq.com"].includes(destination.hostname))external.add(destination.href);
      }
      page.accessScope=/\/(?:admin|auth|settings|trader\/me)(?:\/|$)/.test(new URL(url).pathname)?"public shell only; authenticated functionality not tested":"public initial HTML";
    }catch(error){page.errors.push("fetch-error:"+String(error?.message??error).slice(0,250));}
    report.pages.push(page);
    for(const type of page.errors)report.problems.push({url,type});
    for(const type of page.warnings)report.warnings.push({url,type});
    console.log("PAGE_REVIEW "+JSON.stringify(page));
  }
  for(const link of report.links) {
    const target=report.pages.find(page=>page.url===link.to);
    if(!target||target.status!==200)report.problems.push({type:"broken-internal-destination",...link,status:target?.status??null});
    if(link.fragment&&target?.indexable&&!documentIds.get(link.to)?.has(decodeURIComponent(link.fragment)))
      report.warnings.push({type:"fragment-needs-hydrated-check",...link});
  }
  report.externalReferences=[...external].sort();
  report.discoveredCount=queue.length;
}catch(error){report.problems.push({type:"inventory-blocked",detail:String(error?.message??error)});}
writeFileSync("adsense-live-sitemap-audit.json",JSON.stringify(report,null,2)+"\n");
console.log("AUDIT_SUMMARY "+JSON.stringify({sitemapCount:report.count,checked:report.pages.length,discovered:report.discoveredCount,internalLinks:report.links.length,externalReferences:report.externalReferences.length,failures:report.problems.length,warnings:report.warnings.length,report:"adsense-live-sitemap-audit.json"}));
for(const problem of report.problems)console.log("AUDIT_PROBLEM "+JSON.stringify(problem));
for(const warning of report.warnings)console.log("AUDIT_WARNING "+JSON.stringify(warning));
if(!reportOnly&&report.problems.length)process.exitCode=1;
