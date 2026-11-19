import asyncio,datetime,json,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix,mode=sys.argv[1:4]
async def case(browser,width,kind):
 c=await browser.new_context(viewport={'width':width,'height':900})
 await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort())
 page=await c.new_page()
 if kind=='small-price':
  await page.goto(origin+'/trade/pepe',wait_until='domcontentloaded')
  reject=page.get_by_role('button',name='Reject',exact=True)
  if await reject.count():await reject.click()
  if width<1024:await page.get_by_role('button',name='Trade PEPE',exact=True).click()
  await page.get_by_role('spinbutton',name='Amount in PEPE').fill('100000')
  await page.get_by_role('button',name='Buy PEPE',exact=True).click()
  await page.get_by_text('Bought 100000 PEPE',exact=True).wait_for()
  state=await page.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))")
  await page.goto(origin+'/portfolio',wait_until='domcontentloaded')
  await page.get_by_role('heading',name='Positions',exact=True).wait_for()
  pos=page.get_by_role('heading',name='Positions',exact=True).locator('..')
  before=await pos.inner_text()
  if mode=='before':assert '$0.0000' in before
  else:
   assert '$0.0000\n' not in before
   assert any(float(x)>0 and float(x)<0.0001 for x in __import__('re').findall(r'\$([0-9.]+)',before))
  scenario=page.get_by_role('heading',name='Scenario Builder',exact=False).locator("xpath=ancestor::div[contains(@class,'backdrop-blur-xl')][1]")
  await scenario.get_by_placeholder('e.g. What if BTC drops 30% in 30 days?').fill('PEPE rises 10%')
  await scenario.get_by_role('button',name='Run Scenario',exact=True).click()
  await scenario.get_by_text('Model Mean',exact=True).wait_for()
  table=await scenario.get_by_text('Expected',exact=True).locator('../..').inner_text()
  if mode=='before':assert '$0\n$0\n' in table
  else:assert '$0\n' not in table
  result=dict(storedPrice=state['positions'][0]['asset']['price'],positions=before,scenario=table)
 else:
  await page.goto(origin+'/portfolio',wait_until='domcontentloaded')
  reject=page.get_by_role('button',name='Reject',exact=True)
  if await reject.count():await reject.click()
  region=page.get_by_role('region',name='Backup and restore your virtual portfolio')
  payload=dict(format='tradehq-practice-portfolio',version=1,exportedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),portfolio=dict(cash=0,totalValue=0,positions=[],trades=[]))
  await region.locator('input[type=file]').set_input_files(dict(name='zero-guest.json',mimeType='application/json',buffer=json.dumps(payload).encode()))
  await region.get_by_role('heading',name='Preview backup before restoring',exact=True).wait_for()
  page.once('dialog',lambda d:d.accept())
  await region.get_by_role('button',name='Confirm guest restore',exact=True).click()
  await region.get_by_text('Guest portfolio restored successfully',exact=False).wait_for()
  state=await page.evaluate("JSON.parse(localStorage.getItem('tradehq_portfolio'))")
  assert state['totalValue']==state['cash']==0
  risk=page.get_by_role('heading',name='Risk Assessment',exact=True).locator('..')
  text=await risk.inner_text()
  if mode=='before':assert 'NaN%' in text
  else:assert 'NaN' not in text and '0.0%' in text
  result=dict(restoredUnverifiedGuest=True,riskAssessment=text)
 await c.close()
 return dict(width=width,kind=kind,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),**result)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  rows=await asyncio.gather(*(case(b,w,k) for w in [390,1440] for k in ['small-price','zero-value']))
  await b.close()
 f=Path('/tmp/tradehq-audit-1118/portfolio')/(prefix+'-price-zero.json')
 f.write_text(json.dumps(dict(scope='Disposable guest PEPE orders and explicitly unverified zero-value file imports. Same-origin GET only; no provider or account operation.',rows=rows),ensure_ascii=False,indent=2)+'\n');print(f)
asyncio.run(main())
