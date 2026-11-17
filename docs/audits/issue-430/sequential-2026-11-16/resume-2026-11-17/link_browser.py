import asyncio,json,pathlib
from playwright.async_api import async_playwright
P=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17/guide')
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(ignore_https_errors=True);sem=asyncio.Semaphore(4)
  async def run(x):
   async with sem:
    p=await c.new_page()
    try:
     r=await p.goto(x['url'],wait_until='domcontentloaded',timeout=30000);d={'url':x['url'],'status':r.status,'finalURL':p.url,'title':await p.title()}
    except Exception as e:d={'url':x['url'],'error':str(e)[:180]}
    await p.close();return d
  d=await asyncio.gather(*[run(x) for x in json.loads((P/'link-checks.json').read_text())]);(P/'browser-link-checks.json').write_text(json.dumps(d,indent=2));print({'total':len(d),'not200':[x for x in d if x.get('status')!=200]})
  await b.close()
asyncio.run(main())
