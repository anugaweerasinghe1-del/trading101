import asyncio,csv,json,pathlib,hashlib,datetime
from playwright.async_api import async_playwright
ROOT=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16');OUT=ROOT/'resume-2026-11-17'
async def main():
 rows=list(csv.DictReader((ROOT/'page-queue.csv').open()));results=[]
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(ignore_https_errors=True,java_script_enabled=False);sem=asyncio.Semaphore(6)
  async def run(row):
   async with sem:
    p=await c.new_page();d={'sequence':int(row['sequence']),'url':row['url'],'cohort':row['inventory_scope'],'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'editorialReviewCredit':0,'captureScope':'initial HTML/head only; JavaScript disabled; no account or interactive test'}
    try:
     r=await p.goto(row['url'],wait_until='domcontentloaded',timeout=35000);text=await r.text()
     d.update(status=r.status,finalURL=p.url,htmlBytes=len(text.encode()),htmlSHA256=hashlib.sha256(text.encode()).hexdigest(),title=await p.title(),canonical=await p.locator('link[rel=canonical]').first.get_attribute('href') if await p.locator('link[rel=canonical]').count() else None,robots=await p.locator('meta[name=robots]').first.get_attribute('content') if await p.locator('meta[name=robots]').count() else None,xRobotsTag=r.headers.get('x-robots-tag'),bodyCharacters=len(await p.locator('body').inner_text()))
     chain=[];req=r.request
     while req.redirected_from:
      req=req.redirected_from;chain.append(req.url)
     d['redirectChain']=list(reversed(chain))
    except Exception as e:d['error']=str(e)[:240]
    await p.close();results.append(d)
    if len(results)%40==0:
     print('technical captures',len(results),'of',len(rows),flush=True)
     (OUT/'technical-inventory-checkpoint.json').write_text(json.dumps(sorted(results,key=lambda x:x['sequence']),indent=2))
  await asyncio.gather(*[run(row) for row in rows]);await b.close()
 (OUT/'technical-inventory-initial-html.json').write_text(json.dumps(sorted(results,key=lambda x:x['sequence']),indent=2))
 from collections import Counter
 summary={'capturedInitialHTML':len(results),'statuses':dict(Counter(str(x.get('status','ERROR')) for x in results)),'editorialCredit':0,'technicalScope':'Initial public GET/head only; no account, hydrated UI, content quality or advertising-serving certification. Dynamic/public UGC contents not manually reviewed.'};(OUT/'technical-inventory-summary.json').write_text(json.dumps(summary,indent=2));print(summary)
asyncio.run(main())
