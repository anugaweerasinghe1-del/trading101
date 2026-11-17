import asyncio,json,pathlib,difflib,hashlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430')
OLD=ROOT/'sequential-2026-11-15/policies';NEW=ROOT/'sequential-2026-11-16/resume-2026-11-17/policies'
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);c=await b.new_context(ignore_https_errors=True);sem=asyncio.Semaphore(3)
  async def run(r):
   async with sem:
    p=await c.new_page();await p.goto(r['sourceURL'],wait_until='domcontentloaded')
    # Include collapsed policy text, exclude executable scripts/styles.
    text=await p.locator('article').first.evaluate('e=>{let c=e.cloneNode(true);c.querySelectorAll("script,style").forEach(x=>x.remove());return c.textContent}')
    text=' '.join(text.split());(NEW/('full-'+r['articleText'])).write_text(text)
    old=' '.join((OLD/r['articleText']).read_text().split());a=old.split();bb=text.split();s=difflib.SequenceMatcher(None,a,bb,autojunk=False)
    diff=[{'type':t,'old':' '.join(a[i:j]),'new':' '.join(bb[k:l])} for t,i,j,k,l in s.get_opcodes() if t!='equal']
    result={'url':r['sourceURL'],'characters':len(text),'sha256':hashlib.sha256(text.encode()).hexdigest(),'changes':diff};await p.close();return result
  d=await asyncio.gather(*[run(r) for r in json.loads((OLD/'rule-source-registry.json').read_text())]);(NEW/'full-comparison.json').write_text(json.dumps(d,indent=2));print(json.dumps(d,indent=2));await b.close()
asyncio.run(main())
