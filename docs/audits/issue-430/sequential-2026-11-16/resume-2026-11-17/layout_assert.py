import asyncio,json,sys,pathlib,datetime
from playwright.async_api import async_playwright
P=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17/guide')
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=[]
  for width in [1440,390]:
   for theme in ['light','dark']:
    c=await b.new_context(ignore_https_errors=True,viewport={'width':width,'height':844});p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    r=await p.goto(sys.argv[1]+'/learn-trading-guide',wait_until='networkidle');calc=p.locator('.thq-compound-calculator');await calc.wait_for()
    if theme=='light':await p.get_by_role('button',name='Switch to light theme',exact=True).click()
    await p.wait_for_timeout(450);h=p.get_by_role('heading',name='Command Center',exact=True);a=await calc.bounding_box();z=await h.bounding_box();d={'width':width,'theme':theme,'calculator':a,'commandHeading':z,'gap':z['y']-(a['y']+a['height']),'runtimeErrors':errors,'status':r.status,'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'calculatorBody':await calc.inner_text(),'overflow':await p.evaluate('document.documentElement.scrollWidth>innerWidth')}
    await h.scroll_into_view_if_needed();await p.wait_for_timeout(300);await p.screenshot(path=str(P/(sys.argv[2]+f'-layout-{width}-{theme}.png')));rows.append(d)
    (P/(sys.argv[2]+'-layout.json')).write_text(json.dumps(rows,indent=2))
    assert d['gap']>=0 and not d['overflow'] and not errors,d
    assert '$9,441' in d['calculatorBody'] and '$2,441' in d['calculatorBody'],d
    print(width,theme,'gap',d['gap'],flush=True);await c.close()
  await b.close()
asyncio.run(main())
