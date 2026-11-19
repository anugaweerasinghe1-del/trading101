import asyncio,json,datetime,hashlib,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix=sys.argv[1:3];out=Path('/tmp/tradehq-audit-1118/daily')
async def run(b,w,js):
 c=await b.new_context(viewport={'width':w,'height':900},java_script_enabled=js);await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort());page=await c.new_page();res=await page.goto(origin+'/daily',wait_until='domcontentloaded');assert res.status==200
 notes=await page.locator('[data-publisher-notes="/daily"]').locator('h2,h3,p,li').evaluate_all('(es)=>es.map(e=>({tag:e.tagName.toLowerCase(),text:e.textContent.trim()}))');assert len(notes)==31
 assert 'Checked answers are saved on this browser' in notes[13]['text'];assert 'Answers and reflections are saved' not in notes[13]['text'];assert notes[19]['text']=='The existing short bonus quiz plus a case takeaway with a review guide.'
 before=json.loads(Path('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-011/production-daily-initial-capture-0.json').read_text())['notes'];changes=[i for i,(a,z)in enumerate(zip(before,notes))if a!=z];assert changes==[13,19]
 row=dict(width=w,javaScript=js,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),http=res.status,notes=notes,changedNoteIndexes=changes,responseSHA256=hashlib.sha256(await res.body()).hexdigest());await c.close();return row
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=await asyncio.gather(run(b,390,False),run(b,1440,True));await b.close()
 f=out/(prefix+'-copy-readback.json');f.write_text(json.dumps(dict(origin=origin,scope='Publisher-note output against stated origin; public bank POST blocked, so no private/account or live-bank operation is claimed by this static-copy check.',rows=rows),indent=2,ensure_ascii=False)+'\n');print(f)
asyncio.run(main())
