import asyncio,json,pathlib,sys,datetime
sys.path.insert(0,'/workspace/work/issue430')
from capture import EXTRACT
from playwright.async_api import async_playwright
OUT=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17/guide')
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(ignore_https_errors=True,permissions=['clipboard-read','clipboard-write']);p=await c.new_page()
  await p.goto('https://www.thetradehq.com/learn-trading-guide',wait_until='networkidle')
  async def cap(name):
   d=await p.evaluate(EXTRACT);d['atUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat();(OUT/(name+'.json')).write_text(json.dumps(d,indent=2));print(name,len(d['blocks']),flush=True)
  await p.get_by_role('button',name='More site pages',exact=True).click();await cap('desktop-menu');await p.keyboard.press('Escape')
  await p.set_viewport_size({'width':390,'height':844});await p.get_by_role('button',name='Open menu',exact=True).click();await p.get_by_role('dialog',name='Site menu').get_by_role('button',name='More',exact=True).click();await cap('mobile-menu')
  await p.keyboard.press('Escape');await p.get_by_role('button',name='Copy',exact=True).click();await cap('copy-response')
  # Block all popup navigation while inspecting the exact local share text.
  await p.evaluate('window.open=(url)=>{window.__auditShareURL=url;return null}')
  await p.get_by_role('button',name='Tweet',exact=True).click();share=await p.evaluate('window.__auditShareURL');(OUT/'share-target.json').write_text(json.dumps({'url':share,'note':'Captured locally; no social request, message or posting performed.'},indent=2))
  await p.set_viewport_size({'width':1440,'height':1000});await cap('fresh-second-capture')
  # Check document head values, including schema, without relying on screenshots.
  head=await p.evaluate('()=>({title:document.title,meta:[...document.head.querySelectorAll("meta")].map(x=>({name:x.name||x.getAttribute("property"),content:x.content})),canonical:document.querySelector("link[rel=canonical]")?.href,schemas:[...document.querySelectorAll("script[type=\\"application/ld+json\\"]")].map(x=>JSON.parse(x.textContent))})');(OUT/'head-review.json').write_text(json.dumps(head,indent=2));print('HEAD',json.dumps(head),flush=True)
  # Check all outgoing link responses, without submitting forms or entering private routes.
  links=await p.locator('a[href]').evaluate_all('aa=>[...new Set(aa.map(a=>a.href).filter(u=>u.startsWith("https://www.thetradehq.com/")))]')
  sem=asyncio.Semaphore(4)
  async def link(u):
   async with sem:
    try:
     r=await c.request.get(u,timeout=25000);return {'url':u,'status':r.status,'finalURL':r.url}
    except Exception as e:return {'url':u,'error':str(e)[:180]}
  (OUT/'link-checks.json').write_text(json.dumps(await asyncio.gather(*[link(u) for u in links]),indent=2));await b.close()
asyncio.run(main())
