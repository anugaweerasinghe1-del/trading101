import asyncio,json,datetime,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix=sys.argv[1:3];tmp=Path('/tmp/tradehq-audit-1118');out=tmp/'daily';bank=json.load(open('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-011/published-bank.json'));exercise=next(x for x in bank['exercises'] if x['id']=='practice-19')
async def run(browser,width,theme,kind,failure):
 c=await browser.new_context(viewport={'width':width,'height':900},timezone_id='UTC');await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort());page=await c.new_page();await page.clock.set_fixed_time(datetime.datetime(2026,11,19,12,tzinfo=datetime.timezone.utc));await page.add_init_script('localStorage.setItem("theme",'+json.dumps(theme)+')');await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_text('Current Streak',exact=True).wait_for();await page.wait_for_timeout(600)
 if kind=='deep':
  fixture=dict(date='2026-11-19',bankId=bank['id'],exercise=exercise,answers=[q['correctAnswer'] for q in exercise['questions'][:9]],reflection='')
  await page.evaluate('(p)=>localStorage.setItem("tradehq:deeper-practice:v1",JSON.stringify([p]))',fixture);await page.reload(wait_until='domcontentloaded');await page.get_by_text('Current Streak',exact=True).wait_for()
 if failure:await page.evaluate('''() => { const original=Storage.prototype.setItem;window.restoreStreakWrites=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(k,v){if(k==='tradehq:daily-streak')throw new DOMException('Controlled quota failure','QuotaExceededError');return original.call(this,k,v);};}''')
 if kind=='quick':
  article=page.locator('main article').first;await article.get_by_role('button').first.click();await article.get_by_text('Decision Review',exact=True).wait_for()
 else:
  await page.get_by_role('button',name='Continue case study',exact=True).click();section=page.locator('#deeper-practice');await section.get_by_role('radio').nth(exercise['questions'][9]['correctAnswer']).check();await section.get_by_role('button',name='Check answer',exact=True).click();await section.get_by_text('Case complete · 10/10 correct',exact=True).wait_for()
 stats=await page.locator('.grid.grid-cols-3').first.inner_text();alert=page.get_by_role('alert').filter(has_text='Your streak update');stored=await page.evaluate("localStorage.getItem('tradehq:daily-streak')");beforeRetry=dict(stats=stats,stored=stored,alert=await alert.all_inner_texts())
 if failure:
  assert stats.startswith('0\nCURRENT STREAK') and stored is None,(stats,stored);assert await alert.count()==1
  if kind=='deep':assert await page.evaluate("JSON.parse(localStorage.getItem('tradehq:deeper-practice:v1'))[0].answers.length")==10
  await page.evaluate('window.restoreStreakWrites()');await page.get_by_role('button',name='Retry saving streak',exact=True).click();assert await alert.count()==0
 else:assert stats.startswith('1\nCURRENT STREAK') and stored is not None
 final=json.loads(await page.evaluate("localStorage.getItem('tradehq:daily-streak')"));assert final['current']==final['longest']==final['totalCompleted']==1 and len(final['history'])==1
 assert final['history'][0]['challengeId']==(0 if kind=='deep' else 17)
 await page.reload(wait_until='domcontentloaded');await page.get_by_text('Current Streak',exact=True).wait_for();reloaded=await page.locator('.grid.grid-cols-3').first.inner_text();assert reloaded.startswith('1\nCURRENT STREAK')
 assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth')
 row=dict(atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),width=width,theme=theme,path=kind,controlledWriteException=failure,beforeRetry=beforeRetry,finalStored=final,reloadedStats=reloaded,deepSavedAnswers=await page.evaluate("JSON.parse(localStorage.getItem('tradehq:deeper-practice:v1')||'[]')[0]?.answers.length ?? null"));await c.close();return row
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=[]
  for width,theme,kind,failure in [(390,'light','quick',False),(1440,'dark','quick',False),(390,'dark','quick',True),(1440,'light','quick',True),(390,'light','deep',True),(1440,'dark','deep',True)]:rows.append(await run(browser,width,theme,kind,failure))
  await browser.close()
 (out/(prefix+'-streak-storage.json')).write_text(json.dumps(dict(origin=origin,scope='Actual URL/browser application. Explicit fixed date2026-11-19, disposable guests, injected quota exceptions and synthetic nine-answer approved-case snapshots for the deeper final-answer path. No genuine prior progress, real quota incident, account operation or publication is claimed. External/nonGET blocked.',rows=rows),ensure_ascii=False,indent=2)+'\n');print(json.dumps([dict(width=x['width'],path=x['path'],failure=x['controlledWriteException'],persisted=x['finalStored']['current'],deepSavedAnswers=x['deepSavedAnswers']) for x in rows]))
asyncio.run(main())
