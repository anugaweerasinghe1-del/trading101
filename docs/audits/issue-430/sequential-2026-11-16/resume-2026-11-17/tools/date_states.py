import asyncio,json,pathlib,datetime,sys
from playwright.async_api import async_playwright
P=pathlib.Path(__file__).resolve().parents[1]/'guide'
fixtures=json.loads((pathlib.Path(__file__).resolve().parent/'date-fixtures.json').read_text())
terms=json.loads((pathlib.Path(__file__).resolve().parent/'glossary-projection-source.json').read_text())
async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);out=[]
  for x in fixtures['fixtures']:
   c=await b.new_context(ignore_https_errors=True,timezone_id='UTC');await c.add_init_script('''{const OriginalDate=Date; const fixed=OriginalDate.parse(%s); window.Date=class extends OriginalDate{constructor(...a){super(...(a.length?a:[fixed]))}static now(){return fixed}};}'''%json.dumps(x['date']+'T12:00:00Z'));p=await c.new_page();await p.goto(sys.argv[1]+'/learn-trading-guide',wait_until='networkidle')
   h=p.get_by_role('heading',name='Wiki Spotlight',exact=True);cards=await h.locator('../..').locator('a[href^="/wiki/"]').evaluate_all('(es)=>es.map(e=>({href:e.getAttribute("href"),text:e.innerText,paragraphs:[...e.querySelectorAll("p")].map(p=>p.textContent)}))')
   expected=terms[x['start']:x['start']+3]
   for actual,t in zip(cards,expected):
    assert actual['href']=='/wiki/'+t['slug'];assert actual['paragraphs']==[t['term'],t['difficulty']+' · '+t['readTime'],t['definition'][:100]+'…'],(actual,t)
   assert len(cards)==3
   sentiment=await p.get_by_role('heading',name='Practice Sentiment Example',exact=True).locator('../..').inner_text();assert str(x['sentiment']) in sentiment;v=x['sentiment'];label='Extreme Fear' if v<25 else 'Fear' if v<45 else 'Neutral' if v<55 else 'Greed' if v<75 else 'Extreme Greed';assert label.casefold() in sentiment.casefold()
   out.append(dict(x,cards=cards,sentimentText=sentiment,actualDate=await p.evaluate('new Date().toDateString()'),capturedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),fixture='Explicit browser-only date fixture, not historical production observation'))
   (P/(sys.argv[2]+'-date-states.json')).write_text(json.dumps(out,indent=2));print(x['date'],x['start'],label,'PASS',flush=True);await c.close()
  await b.close()
asyncio.run(main())
