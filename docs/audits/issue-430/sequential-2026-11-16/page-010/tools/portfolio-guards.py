import asyncio,json,datetime,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix=sys.argv[1:3]
async def run(b,width):
 c=await b.new_context(viewport={'width':width,'height':900})
 await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort())
 await c.add_init_script("""Object.defineProperty(window,'Notification',{value:class {static permission='default';static async requestPermission(){return 'denied';}},configurable:true});""")
 page=await c.new_page();res=await page.goto(origin+'/portfolio',wait_until='domcontentloaded');assert res.status==200
 reject=page.get_by_role('button',name='Reject',exact=True)
 if await reject.count():await reject.click()
 region=page.get_by_role('region',name='Backup and restore your virtual portfolio')
 file=region.locator('input[type=file]')
 await file.set_input_files(dict(name='wrong.docx',mimeType='application/octet-stream',buffer=b'fixture'))
 await region.get_by_text('Choose a TradeHQ .json backup. Word documents and screenshots cannot restore simulated trades.',exact=True).wait_for()
 extension=await region.get_by_role('status').inner_text()
 await file.set_input_files(dict(name='large.json',mimeType='application/json',buffer=b' ' * 5000001))
 await region.get_by_text('This file exceeds the 5 MB backup limit.',exact=True).wait_for()
 large=await region.get_by_role('status').inner_text()
 await page.get_by_role('button',name='Alerts',exact=True).click()
 await page.get_by_text('Enable notifications in your browser settings',exact=True).wait_for()
 assert await page.get_by_role('button',name='Alerts',exact=True).get_attribute('aria-pressed')=='false'
 row=dict(width=width,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),wrongExtension=extension,over5MB=large,notificationPermissionFixture='denied; OS API replaced, no native permission prompt or notification',notificationMessage='Enable notifications in your browser settings',alertsPressed=False)
 await c.close();return row
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  rows=await asyncio.gather(*(run(b,w) for w in [390,1440]));await b.close()
 f=Path('/tmp/tradehq-audit-1118/portfolio')/(prefix+'-guards.json');f.write_text(json.dumps(dict(origin=origin,scope='Published guest UI, disposable file fixtures, isolated Notification API denial. GET same-origin only.',rows=rows),indent=2)+'\n');print(f)
asyncio.run(main())
