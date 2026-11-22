import asyncio,json,datetime,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin=sys.argv[1];out=Path('/tmp/tradehq-audit-1118/daily')
async def main():
 rows=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  for fail in [False,True]:
   c=await b.new_context(viewport={'width':390,'height':900});await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort());page=await c.new_page();await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_text('Current Streak',exact=True).wait_for();await page.wait_for_timeout(800)
   if fail:await page.evaluate('''() => { const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){ if(k==='tradehq:daily-streak')throw new DOMException('Controlled quota failure','QuotaExceededError'); return original.call(this,k,v); }; }''')
   article=page.locator('main article').first;before=await page.locator('.grid.grid-cols-3').first.inner_text();await article.get_by_role('button').first.click();await article.get_by_text('Decision Review',exact=True).wait_for();after=await page.locator('.grid.grid-cols-3').first.inner_text();saved=await page.evaluate("localStorage.getItem('tradehq:daily-streak')");alerts=await page.get_by_role('alert').all_inner_texts();await page.reload(wait_until='domcontentloaded');await page.get_by_text('Current Streak',exact=True).wait_for();reloaded=await page.locator('.grid.grid-cols-3').first.inner_text();rows.append(dict(controlledStreakWriteFailure=fail,before=before,after=after,saved=saved,alerts=alerts,reloaded=reloaded,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat()));await c.close()
  await b.close()
 (out/'storage-probe.json').write_text(json.dumps(dict(origin=origin,scope='Actual public code in disposable guest browsers. One baseline; one explicitly injected storage-write exception, not an observed natural quota incident. All external/nonGET requests blocked.',rows=rows),indent=2)+'\n');print(json.dumps(rows))
asyncio.run(main())
