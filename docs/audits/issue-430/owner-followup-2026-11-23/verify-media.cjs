// Bounded visual/media regression evidence; no authentication or ad requests.
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const origin=process.env.AUDIT_ORIGIN||'http://127.0.0.1:4173';
const rows=[];
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:1000}});
 await context.route(/googlesyndication|doubleclick|google-analytics/,r=>r.abort());
 const page=await context.newPage();
 for(const route of ['/courses','/courses/options-trading-fundamentals','/learn/1','/about']){
  const errors=[];const handler=e=>errors.push(e.message);page.on('pageerror',handler);
  await page.goto(origin+route,{waitUntil:'networkidle'});
  const reject=page.getByRole('button',{name:'Reject',exact:true});if(await reject.isVisible())await reject.click();
  await page.locator('nav a[aria-label="TradeHQ home"] svg').waitFor();
  const geometry=await page.locator('nav a[aria-label="TradeHQ home"] svg path').first().getAttribute('d');assert.equal(geometry,'M14 46 L28 22 L36 34 L50 18');
  const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src')),heading:document.querySelector('h1')?.textContent}));
  assert(metrics.heading&&!/doesn.t exist|not found/i.test(metrics.heading),'Expected publisher page, not an error template: '+route);assert(!metrics.overflow,route+' horizontal overflow');assert.equal(metrics.brokenImages.length,0);assert.deepEqual(errors,[]);
  if(route.startsWith('/courses'))assert(await page.locator('span[aria-hidden="true"]').filter({hasText:'TradeHQ'}).count()>0);
  if(route==='/about'){assert(await page.locator('#media-credits').isVisible());assert(await page.locator('a[href="/media-credits.json"]').count()>0);}
  rows.push({route,width,...metrics,brandGeometry:geometry,uncaughtErrors:errors});
  page.off('pageerror',handler);
 }
 await page.goto(origin+'/courses',{waitUntil:'networkidle'});
 let audioRequests=0;page.on('request',r=>{if(r.url().includes('/audio/'))audioRequests++});
 await page.reload({waitUntil:'networkidle'});assert.equal(audioRequests,0,'No unsolicited audio preload');
 await page.getByRole('button',{name:'Play background music',exact:true}).click();
 await page.getByRole('button',{name:'Mute background music',exact:true}).waitFor();assert(audioRequests>0);
 await page.getByRole('button',{name:'Mute background music',exact:true}).click();
 rows.push({width,audio:'No initial request; deliberate play fetches new track; mute succeeds'});
 await page.screenshot({path:`/tmp/tradehq-courses-${width}.png`});
 await context.close();
}
if(!process.env.AUDIT_ORIGIN){const p=await browser.newPage({viewport:{width:1731,height:909},deviceScaleFactor:1});await p.goto(origin+'/courses',{waitUntil:'networkidle'});let reject=p.getByRole('button',{name:'Reject',exact:true});if(await reject.isVisible())await reject.click();await p.screenshot({path:'public/tradehq-preview-2026.png'});await p.close();}
await browser.close();fs.writeFileSync(process.env.AUDIT_MEDIA_OUTPUT||__dirname+'/MEDIA-BROWSER-EVIDENCE.json',JSON.stringify({origin,checkedAt:new Date().toISOString(),scope:'Four representative routes at two widths; actual brand, image loading, overflow, JS errors and optional audio. Not complete accessibility certification.',observations:rows},null,2)+'\n');console.log('PASS',rows.length,'bounded route/media observations');
})().catch(e=>{console.error(e);process.exit(1)});
