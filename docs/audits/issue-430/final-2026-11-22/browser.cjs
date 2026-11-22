// Public read-only browser observations. Ad and telemetry requests are blocked
// and recorded as attempted requests, so blocking cannot manufacture a PASS.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out=__dirname,origin='https://www.thetradehq.com';
const crawl=JSON.parse(fs.readFileSync(path.join(out,'evidence/live-crawl.json')));
const settleTrade=process.argv.includes('--settled-trade');
const noJs=process.argv.includes('--sample-nojs');
const samplePaths=new Set(['/','/about','/privacy','/learn','/wiki/macd','/trade/btc','/auth','/courses/bitcoin-simulator-practice-trading']);
let paths=crawl.pages.filter(p=>p.inSitemap).map(p=>new URL(p.url).pathname);
if(settleTrade)paths=paths.filter(p=>p.startsWith('/trade/'));
if(noJs)paths=[...samplePaths];
const outputFile=settleTrade?'browser-settled-trade.json':noJs?'browser-nojs.json':'browser.json';
const ugc=new Set(['/reviews','/leaderboard','/challenge']);
const screenshotPaths=new Set(['/','/about','/privacy','/learn','/wiki/macd','/trade/btc','/courses/bitcoin-simulator-practice-trading']);
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const records=settleTrade&&fs.existsSync(path.join(out,'evidence',outputFile))?JSON.parse(fs.readFileSync(path.join(out,'evidence',outputFile))).filter(x=>!x.error):[];
try{for(const width of [1280,360]){
const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',javaScriptEnabled:!noJs});
let current,errors=[],blockedAds=[],blockedWrites=[];
await context.route('**/*',async route=>{
 const req=route.request(),u=req.url();
 if(/googlesyndication|doubleclick|googleadservices|adservice\.google|cdn\.amplitude|api.*amplitude/.test(u)){
  if(/googlesyndication|doubleclick|googleadservices|adservice\.google/.test(u))blockedAds.push(u.split('?')[0]);
  return route.abort();
 }
 if(!['GET','HEAD','OPTIONS'].includes(req.method())){
  // Permit only the published-course catalog RPC, a public read.
  if(!/\/rpc\/get_published_course_catalog(?:\?|$)/.test(u)){blockedWrites.push(new URL(u).pathname);return route.abort();}
 }
 return route.continue();
});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(String(e).slice(0,350)));
for(const p of paths){
 if(settleTrade&&records.some(x=>x.url===origin+p&&x.width===width))continue;
 current=p;errors=[];blockedAds=[];blockedWrites=[];
 const record={url:origin+p,width,checkedAt:new Date().toISOString(),scope:'public guest; no submissions; writes/ads/telemetry intercepted'};
 try{
  const start=Date.now();const response=await page.goto(origin+p,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(800);
  if(settleTrade)await page.waitForFunction(()=>document.querySelector('main h1'),null,{timeout:15000});
  record.httpStatus=response.status();record.elapsedMs=Date.now()-start;
  Object.assign(record,await page.evaluate((exclude)=>{
    const main=document.querySelector('main');
    const text=exclude?'[UGC BODY EXCLUDED]':main?.innerText||'';
    const visible=e=>!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length);
    return {title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,
      robots:document.querySelector('meta[name=robots]')?.content,h1Count:document.querySelectorAll('h1').length,
      mainText:text,mainAvailable:!!main,bodyScrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,
      missingImageAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).map(i=>i.getAttribute('src')),
      brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')),
      unnamedButtons:[...document.querySelectorAll('button')].filter(visible).filter(b=>!b.innerText.trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('aria-labelledby')&&!b.getAttribute('title')).length,
      unlabeledInputs:[...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(visible).filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.getAttribute('title')).map(e=>({type:e.type,name:e.name})),
      adsInDom:document.querySelectorAll('ins.adsbygoogle,iframe[src*=doubleclick],script[src*=adsbygoogle]').length,
      media:exclude?[]:[...document.images].map(i=>({src:i.currentSrc,alt:i.getAttribute('alt'),naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})),
      layoutShifts:'NOT_MEASURED'};
  },ugc.has(p)));
  if(screenshotPaths.has(p)&&!ugc.has(p))await page.screenshot({path:path.join(out,'evidence',`screen-${p.replace(/[^a-z0-9]/gi,'_')||'home'}-${width}-${noJs?'nojs':settleTrade?'settled':'initial'}.png`),fullPage:false});
 }catch(e){record.error=String(e).slice(0,350);}
 record.runtimeErrors=[...errors];record.attemptedAdRequests=[...new Set(blockedAds)];record.blockedWritePaths=[...new Set(blockedWrites)];
 if(record.mainText)record.mainSha256=crypto.createHash('sha256').update(record.mainText).digest('hex');
 records.push(record);fs.writeFileSync(path.join(out,'evidence',outputFile),JSON.stringify(records,null,2)+'\n');
 console.log(JSON.stringify({path:p,width,error:record.error,overflow:record.bodyScrollWidth>width+2,runtimeErrors:record.runtimeErrors.length,adAttempts:record.attemptedAdRequests.length}));
}
await context.close();
}}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
