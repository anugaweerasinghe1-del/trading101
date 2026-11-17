import asyncio,pathlib,json,sys,hashlib,datetime
from playwright.async_api import async_playwright
P=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17/guide')
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(ignore_https_errors=True,viewport={'width':390,'height':844});p=await c.new_page()
  await p.goto('https://www.thetradehq.com/learn-trading-guide',wait_until='networkidle')
  cases=[]
  for initial,monthly in [(100000000,1000000),(-1,-1),(0,0)]:
   await p.locator('#compound-initial-capital').fill(str(initial));await p.locator('#compound-monthly-add').fill(str(monthly))
   d=await p.locator('text=Final Value').evaluate('e=>{let n=e.nextElementSibling;return {text:n.innerText,width:n.clientWidth,scrollWidth:n.scrollWidth,overflow:getComputedStyle(n).overflow,whiteSpace:getComputedStyle(n).whiteSpace}}')
   d.update(requestedInitial=initial,requestedMonthly=monthly,inputs=await p.locator('input').evaluate_all('aa=>aa.map(x=>({id:x.id,value:x.value}))'));cases.append(d)
  (P/'input-edge-observations.json').write_text(json.dumps(cases,indent=2));print('EDGES',cases,flush=True)
  assets=[]
  for path in ['/og-image.jpg','/logo.svg']:
   r=await p.goto('https://www.thetradehq.com'+path,wait_until='load');body=await r.body();target=P/('review-'+path[1:]);target.write_bytes(body);assets.append({'url':p.url,'status':r.status,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'file':target.name})
  (P/'media-receipts.json').write_text(json.dumps(assets,indent=2));print('MEDIA',assets,flush=True)
  await p.goto('https://www.nyse.com/network/article/nyse-increases-resiliancy-during-extreme-volatility',wait_until='domcontentloaded');text=await p.locator('body').inner_text();(P/'nyse-source.txt').write_text(text);print('NYSE',len(text),flush=True)
  await b.close()
asyncio.run(main())
