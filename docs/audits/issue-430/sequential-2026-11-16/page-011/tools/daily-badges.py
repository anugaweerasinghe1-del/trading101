import asyncio,json,datetime,hashlib
from pathlib import Path
from playwright.async_api import async_playwright
import sys
origin,prefix,mode=sys.argv[1:4];out=Path('/tmp/tradehq-audit-1118/daily');out.mkdir(exist_ok=True)
async def bank(b):
 c=await b.new_context(viewport={'width':1440,'height':900});responses=[]
 async def route(r):
  q=r.request
  if q.url.startswith(origin+'/') and q.method=='GET':return await r.continue_()
  if q.method=='POST' and q.url.split('?')[0].endswith('/rest/v1/rpc/get_daily_practice_bank') and q.post_data in ['{}','null',None,'']:
   return await r.continue_()
  return await r.abort()
 await c.route('**/*',route);page=await c.new_page()
 async def got(res):
  if res.url.split('?')[0].endswith('/rest/v1/rpc/get_daily_practice_bank'):
   try:responses.append(dict(http=res.status,body=await res.json()))
   except Exception:responses.append(dict(http=res.status,bodyUnavailable=True))
 page.on('response',got)
 await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_role('heading',name="Today's Trading Scenario",exact=True).wait_for();await page.wait_for_timeout(5000)
 row=dict(atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Actual anonymous read-only public approved-bank RPC; SQL STABLE invoker SELECT confirmed in migration. No account, generation, publication or provider operation.',responses=responses,caseHeading=await page.locator('#deeper-title').inner_text(),bankFooter=await page.locator('#deeper-practice').inner_text())
 await c.close();(out/'production-public-bank.json').write_text(json.dumps(row,indent=2,ensure_ascii=False)+'\n');return dict(publicBankResponses=[dict(http=x['http'],type=type(x.get('body')).__name__,bankId=x.get('body',{}).get('id') if isinstance(x.get('body'),dict) else None) for x in responses],caseHeading=row['caseHeading'])
async def badges(b,w,longest):
 c=await b.new_context(viewport={'width':w,'height':900});await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort())
 state=dict(current=longest,longest=longest,totalCompleted=longest,lastCompletedDate=datetime.datetime.now(datetime.timezone.utc).date().isoformat(),history=[])
 
 page=await c.new_page();await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_text('Next:',exact=False).wait_for();await page.evaluate('(s)=>localStorage.setItem("tradehq:daily-streak",JSON.stringify(s))',state);await page.reload(wait_until='domcontentloaded');await page.get_by_text('Streak Badges',exact=True).wait_for();section=page.get_by_text('Streak Badges',exact=True).locator('xpath=ancestor::section[1]');await page.get_by_text('Next:',exact=False).wait_for();text=await section.inner_text()
 if mode=='before' and longest==7:assert 'DIAMOND' in text and 'Steel Mind' in text,text
 if mode=='before' and longest==14:assert 'MASTER' in text and 'Diamond Hands' in text,text
 if mode=='after':
  labels=['SPARK','IRON HAND','STEEL MIND','DIAMOND HANDS','LEGEND']
  cells=await section.locator('.grid.grid-cols-5 > div').all_inner_texts()
  assert len(cells)==5
  for cell,label,threshold in zip(cells,labels,[3,7,14,30,100]):assert label in cell and str(threshold)+'d' in cell,(cell,label)
  assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
 row=dict(width=w,syntheticLongest=longest,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),text=text)
 await c.close();return row
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);live={'bank':'previous live read preserved'};rows=await asyncio.gather(*(badges(b,w,n) for w in [390,1440] for n in [7,14]));await b.close()
 (out/(prefix+'-badge-labels.json')).write_text(json.dumps(dict(origin=origin,scope='Daily UI at stated origin with explicitly synthetic on-device streak state; no actual completion history, account, rank or server mutation.',rows=rows),indent=2,ensure_ascii=False)+'\n');print(json.dumps(live));print(json.dumps(rows,ensure_ascii=False))
asyncio.run(main())
