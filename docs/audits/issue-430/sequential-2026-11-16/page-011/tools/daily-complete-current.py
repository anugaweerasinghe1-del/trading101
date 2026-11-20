import asyncio,json,datetime,hashlib
from pathlib import Path
from playwright.async_api import async_playwright
out=Path('/tmp/tradehq-audit-1118/daily');origin='https://www.thetradehq.com'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(viewport={'width':390,'height':900},timezone_id='UTC');banks=[]
  async def route(r):
   q=r.request
   if q.url.startswith(origin+'/') and q.method=='GET':return await r.continue_()
   if q.method=='POST' and q.url.split('?')[0].endswith('/rest/v1/rpc/get_daily_practice_bank') and q.post_data in ['{}','null',None,'']:return await r.continue_()
   return await r.abort()
  await c.route('**/*',route);page=await c.new_page()
  async def got(res):
   if res.url.split('?')[0].endswith('/rest/v1/rpc/get_daily_practice_bank') and res.status==200:banks.append(await res.json())
  page.on('response',got);await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_role('button',name='Start case study',exact=True).wait_for();await page.wait_for_timeout(1800)
  reject=page.get_by_role('button',name='Reject',exact=True)
  if await reject.count():await reject.click()
  assert banks and isinstance(banks[-1],dict);bank=banks[-1];title=await page.locator('#deeper-title').inner_text();exercise=next(x for x in bank['exercises'] if x['title']==title)
  await page.get_by_role('button',name='Start case study',exact=True).click();section=page.locator('#deeper-practice');brief=await section.locator('details').inner_text();rows=[]
  for i,q in enumerate(exercise['questions']):
   await section.locator('legend').wait_for();prompt=await section.locator('legend').inner_text();options=await section.locator('fieldset label').all_inner_texts();pick=q['correctAnswer'] if i%2==0 else (q['correctAnswer']+1)%3
   await section.get_by_role('radio').nth(pick).check();await section.get_by_role('button',name='Check answer',exact=True).click();await section.get_by_role('status').first.wait_for();feedback=await section.get_by_role('status').first.inner_text();assert q['explanation'] in feedback
   rows.append(dict(index=i+1,prompt=prompt,options=options,picked=pick,correctAnswer=q['correctAnswer'],feedback=feedback))
   if i<9:await section.get_by_role('button',name='Next question',exact=True).click()
  await section.get_by_text('Case takeaway',exact=True).wait_for();completed=await section.aria_snapshot();textInputs=await section.locator('textarea,input[type=text],[contenteditable=true],[role=textbox]').count();stored=await page.evaluate("Object.fromEntries(Object.entries(localStorage).filter(([k])=>/daily.*practice|practice.*daily/.test(k)))")
  row=dict(atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),origin=origin,bankId=bank['id'],bankCanonicalSHA256=hashlib.sha256(json.dumps(bank,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),exerciseId=exercise['id'],title=title,briefing=brief,questions=rows,completed=completed,textInputCount=textInputs,sourceReflectionPrompt=exercise['reflection'],reflectionPromptRendered=exercise['reflection'] in await section.inner_text(),localPracticeRecords=stored,scope='Real current published case and public read-only bank; disposable guest checked answers only, alternating correct/incorrect for state coverage. No account, scored trophy or ranking operation.')
  await b.close()
 (out/'production-current-complete-case.json').write_text(json.dumps(row,indent=2,ensure_ascii=False)+'\n');print(json.dumps(dict(exercise=row['exerciseId'],questions=len(rows),textInputCount=textInputs,reflectionPromptRendered=row['reflectionPromptRendered'])))
asyncio.run(main())
