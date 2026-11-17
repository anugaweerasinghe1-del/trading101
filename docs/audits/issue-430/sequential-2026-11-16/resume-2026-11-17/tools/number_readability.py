import asyncio,json,pathlib,datetime,sys
from playwright.async_api import async_playwright
P=pathlib.Path(__file__).resolve().parents[1]/'guide'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=[]
  for width in [320,390,1440]:
   for theme in ['light','dark']:
    c=await b.new_context(ignore_https_errors=True,viewport={'width':width,'height':900});p=await c.new_page();await p.goto(sys.argv[1]+'/learn-trading-guide',wait_until='networkidle');await p.get_by_role('button',name='Reject',exact=True).click()
    if theme=='light':await p.get_by_role('button',name='Switch to light theme',exact=True).click()
    await p.locator('#compound-initial-capital').fill('100000000');await p.locator('#compound-monthly-add').fill('1000000')
    for rate in [5,30]:
     if rate==30:await p.get_by_role('slider',name='Assumed nominal annual rate',exact=True).press('End')
     results=await p.locator('.thq-compound-calculator').get_by_text('Final Value',exact=True).locator('..').locator('..').locator('p.tabular-nums').evaluate_all('(es)=>es.map(e=>({text:e.textContent.trim(),clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,ellipsis:getComputedStyle(e).textOverflow,overflow:getComputedStyle(e).overflow,clipped:e.scrollWidth>e.clientWidth}))')
     assert len(results)==2
     x={'width':width,'theme':theme,'rate':rate,'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'results':results,'horizontalOverflow':await p.evaluate('document.documentElement.scrollWidth>innerWidth')};rows.append(x)
     if sys.argv[3]=='after':assert not any(v['clipped'] for v in results) and not x['horizontalOverflow'],x
     if rate==30:await p.get_by_text('Final Value',exact=True).scroll_into_view_if_needed();await p.screenshot(path=str(P/(sys.argv[2]+f'-numbers-{width}-{theme}.png')))
    (P/(sys.argv[2]+'-number-readability.json')).write_text(json.dumps(rows,indent=2));print(width,theme,'captured',flush=True);await c.close()
  await b.close()
asyncio.run(main())
