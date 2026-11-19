import asyncio, datetime, hashlib, json
from pathlib import Path
from playwright.async_api import async_playwright

BASE="https://www.thetradehq.com"
OUT=Path(__file__).parent/"portfolio"
FAQ=[
"What does the TradeHQ portfolio tracker show?",
"Are the portfolio statistics based on real prices?",
"How do I reset my virtual portfolio?",
]
async def take(browser,width,theme,js,query=""):
    context=await browser.new_context(viewport={"width":width,"height":900},java_script_enabled=js)
    await context.route("**/*",lambda r:r.continue_() if r.request.url.startswith(BASE+"/") and r.request.method=="GET" else r.abort())
    page=await context.new_page()
    errors=[]
    page.on("pageerror",lambda e: errors.append(str(e)))
    response=await page.goto(BASE+"/portfolio"+query,wait_until="domcontentloaded")
    assert response.status==200
    faq=[]
    if js:
        await page.get_by_role("heading",name="Portfolio Dashboard",exact=True).wait_for()
        reject=page.get_by_role("button",name="Reject",exact=True)
        if await reject.is_visible():
            await reject.click()
        if theme=="light":
            await page.get_by_role("button",name="Switch to light theme",exact=True).click()
        await page.wait_for_timeout(2200)
        for question in FAQ:
            entry=page.get_by_role("button",name=question,exact=True)
            await entry.click()
            controls=await entry.get_attribute("aria-controls")
            panel=page.locator(f'[id="{controls}"]')
            await panel.wait_for(state="visible")
            faq.append({"question":question,"answer":(await panel.inner_text()).strip(),"expanded":await entry.get_attribute("aria-expanded")})
    data=await page.evaluate("""() => {
      const rows=[], walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let n;
      while(n=walker.nextNode()){
        const e=n.parentElement,t=n.textContent.trim();
        if(!t || e.closest('script,style,template')) continue;
        rows.push({text:t,tag:e.tagName.toLowerCase(),visible:e.checkVisibility({visibilityProperty:true}),area:e.closest('[data-publisher-notes],header,main,footer,section')?.tagName.toLowerCase()});
      }
      const notes=document.querySelector('[data-publisher-notes="/portfolio"]');
      return {body:document.body.innerText, occurrences:rows, title:document.title,
        canonical:document.querySelector('link[rel=canonical]')?.href,
        meta:[...document.querySelectorAll('meta[name],meta[property]')].map(e=>[e.getAttribute('name')||e.getAttribute('property'),e.content]),
        schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>JSON.parse(e.textContent)),
        notes:notes&&[...notes.querySelectorAll('h2,h3,p,li')].map(e=>({tag:e.tagName.toLowerCase(),text:e.textContent.trim()})),
        links:[...document.querySelectorAll('a[href]')].map(a=>({label:a.innerText,href:a.getAttribute('href'),visible:a.checkVisibility({visibilityProperty:true})})),
        images:[...document.querySelectorAll('img,video,iframe,canvas')].map(e=>[e.tagName.toLowerCase(),e.currentSrc||e.src,e.alt||e.title]),
        controls:[...document.querySelectorAll('button,input,select,textarea,[role=slider],[role=switch]')].map(e=>({node:e.tagName,label:e.getAttribute('aria-label'),text:e.innerText.trim(),role:e.getAttribute('role'),pressed:e.getAttribute('aria-pressed'),expanded:e.getAttribute('aria-expanded'),disabled:!!e.disabled,visible:e.checkVisibility({visibilityProperty:true})})), horizontalOverflow:document.documentElement.scrollWidth>innerWidth };
    }""")
    raw=await response.body()
    if not js:
        (OUT/"production482-initial.html").write_bytes(raw)
    data["accessibilityTree"]=await page.locator("body").aria_snapshot()
    data.update(url=page.url,width=width,theme=theme,js=js,faq=faq,http=response.status,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        responseSHA256=hashlib.sha256(await response.body()).hexdigest(),pageErrors=errors)
    await context.close()
    return data

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path="/usr/bin/chromium",args=["--no-sandbox"])
        cases=[(390,"dark",False,""),(390,"light",True,""),(1440,"dark",True,""),(1440,"light",True,""),(390,"dark",True,"")]
        output=await asyncio.gather(*(take(browser,*c) for c in cases))
        import xml.etree.ElementTree as ET, csv
        context=await browser.new_context()
        await context.route("**/*",lambda r:r.continue_() if r.request.url.startswith(BASE+"/") and r.request.method=="GET" else r.abort())
        sitemaps=[];urls=set()
        for name in ['sitemap.xml','course-sitemap.xml']:
            page=await context.new_page();res=await page.goto(BASE+'/'+name,wait_until='domcontentloaded');assert res.status==200
            raw=await res.body();(OUT/('production482-'+name)).write_bytes(raw)
            found={e.text for e in ET.fromstring(raw).iter() if e.tag.endswith('loc')};urls |= found
            sitemaps.append(dict(url=BASE+'/'+name,http=res.status,count=len(found),sha256=hashlib.sha256(raw).hexdigest()))
            await page.close()
        with Path('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-queue.csv').open() as f:queued={r['url'] for r in csv.DictReader(f) if r['inventory_scope']=='CURRENT-SITEMAP'}
        (OUT/'SITEMAP-482.json').write_text(json.dumps(dict(sitemaps=sitemaps,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),liveDistinct=len(urls),queuedPublisherDistinct=len(queued),additionalCanonical=sorted(urls-queued),missingCanonical=sorted(queued-urls)),indent=2)+'\n')
        await context.close()
        await browser.close()
    for i,row in enumerate(output):
        path=OUT/f"production482-capture-{i}.json"
        path.write_text(json.dumps(row,ensure_ascii=False,indent=2)+"\n")
        print(i,row["url"],row["http"],len(row["occurrences"]),len(row["faq"]),row["horizontalOverflow"],row["pageErrors"])
asyncio.run(main())
