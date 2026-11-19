import asyncio,datetime,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin=sys.argv[1];prefix=sys.argv[2];after=len(sys.argv)>3 and sys.argv[3]=='after';out=Path('/tmp/tradehq-audit-1118/daily')
async def main():
 rows=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for width,theme in [(390,'light'),(1440,'dark')]:
   c=await b.new_context(viewport={'width':width,'height':900},timezone_id='UTC');banks=[]
   async def route(r):
    q=r.request
    if q.url.startswith(origin+'/') and q.method=='GET':return await r.continue_()
    if q.method=='POST' and q.url.split('?')[0].endswith('/rest/v1/rpc/get_daily_practice_bank') and q.post_data in ['{}','null',None,'']:return await r.continue_()
    return await r.abort()
   await c.route('**/*',route);page=await c.new_page()
   await page.clock.set_fixed_time(datetime.datetime(2026,10,17,12,tzinfo=datetime.timezone.utc))
   await page.add_init_script('localStorage.setItem("theme",'+json.dumps(theme)+')')
   async def got(res):
    if res.url.split('?')[0].endswith('/rest/v1/rpc/get_daily_practice_bank') and res.status==200:banks.append(await res.json())
   page.on('response',got);await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_role('button',name='Start case study',exact=True).wait_for();await page.wait_for_timeout(1600)
   reject=page.get_by_role('button',name='Reject',exact=True)
   if await reject.count():await reject.click()
   title=await page.locator('#deeper-title').inner_text();assert title=='Correlation can change when you need it',title
   await page.get_by_role('button',name='Start case study',exact=True).click();section=page.locator('#deeper-practice');prompt=await section.locator('legend').inner_text()
   expected='Do three earlier observations establish a permanent correlation?' if after else 'Does three earlier observations establish a permanent correlation?'
   assert prompt==expected,prompt
   before=await page.evaluate('localStorage.getItem("tradehq:deeper-practice:v1")')
   await section.get_by_role('radio').nth(2).check();await section.get_by_role('button',name='Check answer',exact=True).click();await section.get_by_role('status').first.wait_for();feedback=await section.get_by_role('status').first.inner_text();stored=await page.evaluate('JSON.parse(localStorage.getItem("tradehq:deeper-practice:v1"))')
   assert stored[0]['answers']==[2] and stored[0]['exercise']['id']=='practice-32'
   rows.append(dict(width=width,theme=theme,controlledDate='2026-10-17',origin=origin,title=title,prompt=prompt,options=await section.locator('fieldset label').all_inner_texts(),feedback=feedback,rawBankPrompt=banks[-1]['exercises'][8]['questions'][0]['prompt'] if banks else 'RPC blocked/unavailable; starter fallback',snapshotPrompt=stored[0]['exercise']['questions'][0]['prompt'],savedAnswers=stored[0]['answers'],beforeStorage=before))
   await c.close()
  await b.close()
 (out/(prefix+'-correlation-prompt.json')).write_text(json.dumps(dict(atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),rows=rows,scope='Actual URL with controlled client date selecting an already published fictional case; disposable guest storage only. No bank publication or actual account operation.'),indent=2)+'\n');print(json.dumps(rows))
asyncio.run(main())
