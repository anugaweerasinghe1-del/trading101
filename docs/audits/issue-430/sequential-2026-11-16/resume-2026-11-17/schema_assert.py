import asyncio,sys,json,pathlib,hashlib,datetime
from playwright.async_api import async_playwright
P=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17/guide')
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(ignore_https_errors=True);p=await c.new_page()
  r=await p.goto(sys.argv[1]+'/learn-trading-guide',wait_until='networkidle')
  schemas=await p.locator('script[type="application/ld+json"]').evaluate_all('aa=>aa.map(x=>JSON.parse(x.textContent))')
  article=next(x for x in schemas if x.get('@type')=='TechArticle');assert article['image']=='https://www.thetradehq.com/tradehq-preview-2026.png',article
  result={'page':p.url,'status':r.status,'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'article':article,'canonical':await p.locator('link[rel=canonical]').get_attribute('href'),'schemas':schemas}
  image=await p.goto(article['image'],wait_until='load');data=await image.body();assert image.status==200 and image.headers.get('content-type','').startswith('image/')
  result['image']={'url':p.url,'status':image.status,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  (P/(sys.argv[2]+'-schema-assertion.json')).write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));await b.close()
asyncio.run(main())
