from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,sys
stage=sys.argv[1];r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence')
for prefix,kind in [('quote-input','source'),('quote-drawer-pointer','pointer')]:
 f=r/(prefix+'-'+stage+'-20261030');receipt=json.loads((r/(prefix.upper()+'-'+stage.upper()+'-20261030.json')).read_text());assert receipt['outcome']=='PASS';q=[]
 for theme in ['light','dark']:
  for w in ([360,390,768]if kind=='pointer'else[360,390,768,1280,1920]):
   if kind=='pointer':names=[x['screenshot']for x in receipt['rows']if x['width']==w and x['theme']==theme];assert len(names)==5
   else:
    names=[f'chart-{n}-{w}-{theme}.png'for n in ['usdjpy','eurgbp','eurusd','btc','trade']]
    if w>=1280:names +=[f'execution-{n}-{w}-{theme}.png'for n in ['usdjpy','eurgbp','eurusd','btc','trade']]
    names +=[f'markets-{w}-{theme}.png']
   groups=[names[i:i+6]for i in range(0,len(names),6)]
   for i,group in enumerate(groups):
    cols=3 if kind=='pointer'or w<768 else 2;tw=min(w,600 if kind=='pointer'else 720);images=[]
    for name in group:
     im=Image.open(f/name).convert('RGB');im=im.resize((tw,round(im.height*tw/im.width)));images.append((name,im))
    h=max(im.height for _,im in images)+28;out=Image.new('RGB',(tw*cols,((len(images)+cols-1)//cols)*h),'#ddd');d=ImageDraw.Draw(out)
    for j,(name,im)in enumerate(images):x=j%cols*tw;y=j//cols*h;d.text((x+2,y+5),name,fill='black');out.paste(im,(x,y+28))
    name=f'review-{w}-{theme}-{i}.jpg';out.save(f/name,quality=94);q.append({'name':name,'sha256':hashlib.sha256((f/name).read_bytes()).hexdigest(),'sourceCaptures':group})
 (f/'review-queue.json').write_text(json.dumps({'sheets':q,'scope':'Generation grants no personal view credit. Original offscreen mobile execution captures excluded; pointer replacements separate.'},indent=2)+'\n');print(kind,len(q),sum(len(x['sourceCaptures'])for x in q))
