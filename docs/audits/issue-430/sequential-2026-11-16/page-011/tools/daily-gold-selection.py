import asyncio,json,datetime,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix,mode=sys.argv[1:4];out=Path('/tmp/tradehq-audit-1118/daily')
async def run(b,w,choice=0):
 c=await b.new_context(viewport={'width':w,'height':900},timezone_id='UTC');await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort());page=await c.new_page();await page.clock.install(time=datetime.datetime(2026,11,29,12,tzinfo=datetime.timezone.utc));await page.goto(origin+'/daily',wait_until='domcontentloaded')
 await page.get_by_role('heading',name='Gold breaks $2,800 to new all-time highs.',exact=True).wait_for();article=page.get_by_role('heading',name='Gold breaks $2,800 to new all-time highs.',exact=True).locator('xpath=ancestor::article[1]');clicked=['Buy gold but avoid miners',"Buy miners — they'll catch up",'Short — too extended'][choice];await article.get_by_role('button',name=clicked,exact=True).click();await article.get_by_text('Decision Review',exact=True).wait_for()
 details=await article.get_by_text('Your stated reasoning:',exact=False).all_inner_texts()
 assert len(details)==(2 if mode=='before' else 1),details
 state=await page.evaluate("JSON.parse(localStorage.getItem('tradehq:daily-streak'))")
 assert state['history'][0]['challengeId']==27 and state['history'][0]['decision']==('short' if choice==2 else 'long')
 row=dict(width=w,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),controlledClientDate='2026-11-29 UTC',clicked=clicked,selectedReasoning=details,article=await article.aria_snapshot(),storedDirection=('short' if choice==2 else 'long'));await c.close();return row
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=await asyncio.gather(*(run(b,w,n)for w in [390,1440] for n in ([0] if mode=='before' else [0,1,2])));await b.close()
 f=out/(prefix+'-gold-selection.json');f.write_text(json.dumps(dict(scope='Daily quick exercise at stated origin with explicitly controlled client date selecting existing scenario27. Disposable on-device choice only, no actual future market observation or account/rank change.',origin=origin,rows=rows),indent=2,ensure_ascii=False)+'\n');print(json.dumps([dict(width=x['width'],clicked=x['clicked'],selected=x['selectedReasoning'])for x in rows]))
asyncio.run(main())
