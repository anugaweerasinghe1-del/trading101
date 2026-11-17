import asyncio,json,pathlib,datetime,math,hashlib,sys
sys.path.insert(0,'/workspace/work/issue430')
from capture import EXTRACT
ROOT=pathlib.Path('/workspace/work/tradehq-audit');OUT=ROOT/'docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17'
def save(n,d):
 p=OUT/n;p.parent.mkdir(exist_ok=True,parents=True);p.write_text(json.dumps(d,indent=2,ensure_ascii=False))
async def main():
 from playwright.async_api import async_playwright
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  c=await b.new_context(ignore_https_errors=True,viewport={'width':1440,'height':1000});p=await c.new_page()
  await p.goto('https://www.thetradehq.com/learn-trading-guide',wait_until='networkidle')
  await p.locator('html').evaluate('(e)=>{e.classList.remove("dark");e.classList.add("light")}')
  color=await p.locator('text=Final Value').evaluate('e=>{let n=e.nextElementSibling;return {text:n.innerText,color:getComputedStyle(n).color,panel:getComputedStyle([...document.querySelectorAll("div")].find(x=>x.classList.contains("bg-[#030506]"))).backgroundColor}}')
  save('guide/contrast-reproduction.json',color);print('COLOR',color,flush=True)
  for i in range(6):
   await p.get_by_role('button',name='Complete',exact=True).click();await p.wait_for_timeout(350)
   save('guide/progress-'+str(i+1)+'.json',await p.evaluate(EXTRACT))
  await p.reload(wait_until='networkidle');save('guide/progress-reload.json',await p.evaluate(EXTRACT))
  for name,initial,monthly,rate,ded in [('zero',0,0,0,0),('no-growth',1000,50,0,0),('nominal12',1000,0,12,0),('deduction',1000,50,5,.1)]:
   await p.locator('#compound-initial-capital').fill(str(initial));await p.locator('#compound-monthly-add').fill(str(monthly))
   sliders=p.get_by_role('slider')
   for idx,value,step in [(0,rate,.5),(1,ded,.01)]:
    s=sliders.nth(idx);await s.focus();await s.press('Home')
    for _ in range(round(value/step)):await s.press('ArrowRight')
   await p.wait_for_timeout(150)
   d=await p.evaluate(EXTRACT)
   factor=1+rate/1200*(1-ded/100)
   expected=initial*factor**120+monthly*(120 if factor==1 else factor*(factor**120-1)/(factor-1))
   d['independentExpectedFinalValue']=expected;save('guide/calculator-'+name+'.json',d)
   print('CALC',name,expected,flush=True)
  await c.close()
  for day,answer,correct in [(18,'Double Bottom',True),(18,'Bull Flag',False),(16,'Golden Cross',True),(16,'Death Cross',False),(17,'Bear Trap',True),(17,'Short Squeeze',False)]:
   c=await b.new_context(ignore_https_errors=True)
   await c.add_init_script('''{const RealDate=Date; const fixed=new RealDate("2026-11-DAYT12:00:00Z").getTime();globalThis.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[fixed]))}static now(){return fixed}}}'''.replace('DAY',str(day)))
   p=await c.new_page();await p.goto('https://www.thetradehq.com/learn-trading-guide',wait_until='networkidle')
   await p.get_by_role('button',name=answer,exact=True).click();await p.wait_for_timeout(300)
   save('guide/quiz-'+str(day)+'-'+str(correct)+'.json',await p.evaluate(EXTRACT));await c.close()
  c=await b.new_context(ignore_https_errors=True);p=await c.new_page()
  prior=json.loads((ROOT/'docs/audits/issue-430/sequential-2026-11-16/page-queue.csv').read_text()) if False else None
  inv=[]
  for path in ['/sitemap.xml','/course-sitemap.xml','/robots.txt']:
   r=await p.goto('https://www.thetradehq.com'+path,wait_until='domcontentloaded');t=await r.text();(OUT/('inventory'+path.replace('/','-'))).write_text(t);inv.append({'path':path,'status':r.status,'sha256':hashlib.sha256(t.encode()).hexdigest()})
  save('inventory-refresh.json',inv)
  await b.close()
asyncio.run(main())
