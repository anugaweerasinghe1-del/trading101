from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
stage=sys.argv[1];r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');d=json.loads((r/('PUBLIC-LEARNING-SCOPE-'+stage.upper()+'-20261030.json')).read_text());assert len(d['rows'])==140 and d['outcome']=='PASS';f=r/('public-learning-scope-'+stage+'-20261030');queue=[]
for theme in ['light','dark']:
 for w in [360,390,768,1280,1920]:
  rows=[x for x in d['rows']if x['width']==w and x['theme']==theme and x.get('kind')=='learning scope copy'];assert len(rows)==6
  cw=min(w,768);cols=3 if w<500 else 2;thumbs=[]
  for x in rows:
   im=Image.open(f/x['screenshot']).convert('RGB');im.thumbnail((cw,900));thumbs.append(im)
  ch=max(i.height for i in thumbs)+30;out=Image.new('RGB',(cw*cols,ch*((6+cols-1)//cols)),'#ddd');draw=ImageDraw.Draw(out)
  for i,(x,im) in enumerate(zip(rows,thumbs)):
   x0=(i%cols)*cw;y0=(i//cols)*ch;out.paste(im,(x0,y0+30));draw.text((x0+3,y0+7),x['path'][-45:]+' '+str(w)+' '+theme,fill='black')
  n=f'review-copy-{w}-{theme}.jpg';out.save(f/n,quality=94);queue.append(n)
  faq=next(x for x in d['rows']if x['width']==w and x['theme']==theme and x.get('screenshot','') and x.get('kind')!='learning scope copy');queue.append(faq['screenshot'])
(f/'review-queue.json').write_text(json.dumps(queue,indent=2)+'\n');print(stage,'20 sheets;70 raw captures;140 checks;not yet personally viewed')
