import asyncio,json,pathlib,sys,datetime
from playwright.async_api import async_playwright
OUT=pathlib.Path('/workspace/work/tradehq-audit/docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17/guide')
def lum(rgb):
 vals=[v/255 for v in rgb];return sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for w,v in zip([.2126,.7152,.0722],vals))
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=[]
  for width in [1440,390]:
   for theme in ['light','dark']:
    c=await b.new_context(ignore_https_errors=True,viewport={'width':width,'height':900});p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    r=await p.goto(sys.argv[1]+'/learn-trading-guide',wait_until='networkidle');await p.locator('.thq-compound-calculator').wait_for()
    await p.locator('html').evaluate('(e,t)=>{e.classList.remove("dark","light");e.classList.add(t)}',theme);await p.wait_for_timeout(400)
    d=await p.locator('.thq-compound-calculator').evaluate('e=>({panel:getComputedStyle(e).backgroundColor, accents:[...e.querySelectorAll("[class*=text-emerald-400],[class*=text-red-400]")].map(n=>({text:n.innerText,color:getComputedStyle(n).color,font:getComputedStyle(n).fontSize})),text:e.innerText,overflow:document.documentElement.scrollWidth>innerWidth})')
    import re
    bg=list(map(int,re.findall(r'\d+',d['panel'])[:3]))
    for x in d['accents']:
     fg=list(map(int,re.findall(r'\d+',x['color'])[:3]));x['contrastOnPanel']=round((max(lum(bg),lum(fg))+.05)/(min(lum(bg),lum(fg))+.05),3)
     assert x['contrastOnPanel']>=4.5,(theme,x)
    assert d['panel']=='rgb(3, 5, 6)' and not d['overflow'] and not errors
    d.update(width=width,theme=theme,status=r.status,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),runtimeErrors=errors)
    await p.screenshot(path=str(OUT/(sys.argv[2]+'-'+str(width)+'-'+theme+'.png')),full_page=True);rows.append(d);await c.close()
  (OUT/(sys.argv[2]+'-appearance.json')).write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2));await b.close()
asyncio.run(main())
