import asyncio,json,hashlib,datetime,pathlib
from playwright.async_api import async_playwright

ROOT=pathlib.Path('/workspace/work/tradehq-audit')
OUT=ROOT/'docs/audits/issue-430/sequential-2026-11-16/resume-2026-11-17'
OUT.mkdir(exist_ok=True)
def save(name,data):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(data if isinstance(data,str) else json.dumps(data,indent=2,ensure_ascii=False))
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
EXTRACT='''() => {
 const path=e=>{let a=[];while(e&&e.nodeType===1){a.unshift(e.tagName.toLowerCase()+':nth-child('+([...e.parentNode.children].indexOf(e)+1)+')');e=e.parentElement;}return a.join('>')};
 let blocks=[]; const walk=e=>{if(['SCRIPT','STYLE','NOSCRIPT'].includes(e.tagName))return;for(let n of e.childNodes){if(n.nodeType===3&&n.textContent.trim()){let s=getComputedStyle(e);blocks.push({location:path(e),text:n.textContent.trim(),kind:e.tagName.toLowerCase(),visible:!!e.getClientRects().length&&s.visibility!=='hidden',color:s.color,background:s.backgroundColor});}else if(n.nodeType===1)walk(n)}};walk(document.body);
 return {blocks,head:document.head.innerHTML,title:document.title,links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.innerText,href:a.href})),images:[...document.images].map(i=>({src:i.currentSrc,alt:i.alt,width:i.naturalWidth,height:i.naturalHeight})),inputs:[...document.querySelectorAll('input,[role="slider"]')].map(i=>({id:i.id,label:i.getAttribute('aria-label'),value:i.value||i.getAttribute('aria-valuenow')})),overflow:document.documentElement.scrollWidth>innerWidth,body:document.body.innerText};}'''
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  c=await b.new_context(ignore_https_errors=True,viewport={'width':1440,'height':1000})
  p=await c.new_page()
  url='https://www.thetradehq.com/learn-trading-guide'
  r=await p.goto(url,wait_until='networkidle',timeout=60000)
  save('guide/initial.html',await r.text())
  await p.wait_for_timeout(1800)
  async def cap(name):
   d=await p.evaluate(EXTRACT);d.update(capturedAtUTC=now(),status=r.status,url=p.url);save('guide/'+name+'.json',d)
   save('guide/'+name+'.txt',d['body']);await p.screenshot(path=str(OUT/'guide'/ (name+'.png')),full_page=True)
   print(name,len(d['blocks']),len(d['body']),d['overflow'],flush=True)
  await cap('desktop-default')
  print('BUTTONS',await p.get_by_role('button').all_text_contents(),flush=True)
  await p.locator('html').evaluate('(e)=>{e.classList.remove("dark");e.classList.add("light")}')
  await cap('desktop-light')
  await p.set_viewport_size({'width':390,'height':844});await cap('mobile-light')
  await p.locator('html').evaluate('(e)=>{e.classList.remove("light");e.classList.add("dark")}')
  await cap('mobile-dark')
  await c.close()
  c=await b.new_context(java_script_enabled=False,ignore_https_errors=True)
  p=await c.new_page();await p.goto(url,wait_until='load');save('guide/nojs.json',await p.evaluate(EXTRACT));await c.close()
  # Independently capture current official policies, with the prior article selector.
  c=await b.new_context(ignore_https_errors=True)
  registry=json.loads((ROOT/'docs/audits/issue-430/sequential-2026-11-15/policies/rule-source-registry.json').read_text())
  sem=asyncio.Semaphore(3)
  async def policy(item):
   async with sem:
    p=await c.new_page();u=item['sourceURL'];entry={'url':u,'capturedAtUTC':now()}
    try:
     r=await p.goto(u,wait_until='domcontentloaded',timeout=45000)
     article=p.locator('article').first
     text=await article.inner_text(timeout=10000)
     old=(ROOT/'docs/audits/issue-430/sequential-2026-11-15/policies'/item['articleText']).read_text()
     save('policies/'+item['articleText'],text)
     entry.update(status=r.status,characters=len(text),textSHA256=hashlib.sha256(text.encode()).hexdigest(),normalizedTextUnchanged=' '.join(text.split())==' '.join(old.split()),file=item['articleText'])
    except Exception as e:entry['error']=str(e)[:220]
    await p.close();return entry
  entries=await asyncio.gather(*[policy(x) for x in registry]);save('policies/refresh.json',entries);print('POLICIES',entries,flush=True)
  await c.close();await b.close()
if __name__=='__main__':asyncio.run(main())
