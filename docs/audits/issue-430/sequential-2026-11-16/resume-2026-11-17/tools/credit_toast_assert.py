import asyncio,json,pathlib,sys,datetime
from playwright.async_api import async_playwright
P=pathlib.Path(__file__).resolve().parents[1]/'guide'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=[]
  for width in [1440,390]:
   for theme in ['light','dark']:
    c=await b.new_context(ignore_https_errors=True,viewport={'width':width,'height':900});p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    r=await p.goto(sys.argv[1]+'/learn-trading-guide',wait_until='networkidle');await p.locator('.thq-compound-calculator').wait_for()
    if theme=='light':await p.get_by_role('button',name='Switch to light theme',exact=True).click()
    artist=p.get_by_role('link',name='Long Road Ahead by Kevin MacLeod (incompetech.com)',exact=True);license=p.get_by_role('link',name='Creative Commons Attribution 4.0',exact=True)
    assert await artist.get_attribute('href')=='https://incompetech.com/music/royalty-free/?isrc=USUAN1100588';assert await license.get_attribute('href')=='https://creativecommons.org/licenses/by/4.0/'
    await artist.scroll_into_view_if_needed();await p.wait_for_timeout(200);credit=await artist.locator('..').inner_text();assert await artist.is_visible() and await license.is_visible();await p.screenshot(path=str(P/(sys.argv[2]+f'-credit-{width}-{theme}.png')))
    # Source-controlled local denial exercises the existing error UI, not provider failure.
    await p.evaluate('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw new Error("Explicit local audit fixture denial")}}})');await p.get_by_role('button',name='Copy',exact=True).click();dismiss=p.get_by_role('button',name='Dismiss notification',exact=True);await dismiss.wait_for();ax=await p.get_by_role('region',name='Notifications (F8)',exact=True).aria_snapshot();assert 'button "Dismiss notification"' in ax;await dismiss.press('Enter');await dismiss.wait_for(state='hidden',timeout=5000)
    d={'width':width,'theme':theme,'atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':r.status,'creditText':credit,'toastAX':ax,'keyboardDismissed':True,'runtimeErrors':errors,'overflow':await p.evaluate('document.documentElement.scrollWidth>innerWidth'),'fixture':'Explicit clipboard denial; no actual clipboard/provider defect inferred'};assert not d['overflow'] and not errors;rows.append(d);(P/(sys.argv[2]+'-credit-toast.json')).write_text(json.dumps(rows,indent=2));print(width,theme,'credit/name/keyboard PASS',flush=True);await c.close()
  await b.close()
asyncio.run(main())
