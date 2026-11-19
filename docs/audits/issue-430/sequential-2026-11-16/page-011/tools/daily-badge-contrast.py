import asyncio,json,datetime,sys
from pathlib import Path
from playwright.async_api import async_playwright
origin,prefix=sys.argv[1:3];mode=sys.argv[3] if len(sys.argv)>3 else 'observe';out=Path('/tmp/tradehq-audit-1118/daily')
async def case(b,w):
 c=await b.new_context(viewport={'width':w,'height':900});await c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') and r.request.method=='GET' else r.abort());page=await c.new_page();await page.goto(origin+'/daily',wait_until='domcontentloaded');await page.get_by_text('Personal Best',exact=True).wait_for()
 await page.evaluate("()=>localStorage.setItem('tradehq:daily-streak',JSON.stringify({current:14,longest:14,totalCompleted:14,lastCompletedDate:new Date().toLocaleDateString('en-CA'),history:[]}))")
 await page.reload(wait_until='domcontentloaded');await page.get_by_text('Personal Best',exact=True).wait_for();await page.get_by_role('button',name='Switch to light theme',exact=True).click()
 section=page.get_by_text('Streak Badges',exact=True).locator('xpath=ancestor::section[1]');await section.scroll_into_view_if_needed();await page.evaluate('document.fonts.ready');await page.wait_for_timeout(500)
 cells=section.locator('.grid.grid-cols-5 > div');rows=[]
 for i in [0,4]:
  label=cells.nth(i).locator('div').nth(1);css=await label.evaluate('e=>{let c=getComputedStyle(e);return {text:e.innerText,color:c.color,opacity:c.opacity,fontSize:c.fontSize,fontWeight:c.fontWeight,textShadow:c.textShadow}}');box=await label.bounding_box();rows.append(dict(index=i,css=css,box=box))
 path=out/f'{prefix}-badge-contrast-{w}.png';await page.screenshot(path=str(path));await c.close();return dict(width=w,atUTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),labels=rows,screenshot=path.name)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);rows=await asyncio.gather(*(case(b,w)for w in[390,1440]));await b.close()
 from PIL import Image
 def lum(c):
  v=[x/255 for x in c];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v];return .2126*v[0]+.7152*v[1]+.0722*v[2]
 import re
 for row in rows:
  im=Image.open(out/row['screenshot']).convert('RGB')
  for l in row['labels']:
   box=l['box'];bg=im.getpixel((round(box['x']+box['width']/2),round(box['y']-2)));nums=[float(x)for x in re.findall(r'[\d.]+',l['css']['color'])];alpha=nums[3]if len(nums)>3 else 1;fg=tuple(round(nums[i]*alpha+bg[i]*(1-alpha))for i in range(3));l.update(sampledBackground=bg,compositedText=fg,contrast=(max(lum(fg),lum(bg))+.05)/(min(lum(fg),lum(bg))+.05))
 if mode=='after':assert all(l['contrast']>=4.5 for row in rows for l in row['labels']),rows
 (out/(prefix+'-badge-contrast.json')).write_text(json.dumps(dict(origin=origin,scope='Daily light-theme UI at stated origin with explicitly synthetic guest streak14. Background sampled adjacent to text; no account or real completion history.',rows=rows),indent=2)+'\n');print(json.dumps(rows))
asyncio.run(main())
