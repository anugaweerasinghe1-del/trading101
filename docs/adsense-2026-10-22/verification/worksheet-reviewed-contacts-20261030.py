from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
stage=sys.argv[1];r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');d=json.loads((r/('WORKSHEET-SCOPE-'+stage.upper()+'-20261030.json')).read_text());assert len(d['rows'])==100 and d['outcome']=='PASS';f=r/('worksheet-scope-'+stage+'-20261030');queue=[]
for theme in ['light','dark']:
 for width in [360,390,768,1280,1920]:
  rows=[x for x in d['rows']if x['width']==width and x['theme']==theme];assert len(rows)==10
  for start in [0,5]:
   chosen=rows[start:start+5];cw=min(width,768);cols=3 if width<500 else 2;thumbs=[]
   for x in chosen:
    im=Image.open(f/x['screenshot']).convert('RGB');im.thumbnail((cw,900));thumbs.append(im)
   ch=max(i.height for i in thumbs)+30;out=Image.new('RGB',(cw*cols,ch*((5+cols-1)//cols)),'#ddd');draw=ImageDraw.Draw(out)
   for i,(x,im) in enumerate(zip(chosen,thumbs)):
    xx=(i%cols)*cw;yy=(i//cols)*ch;out.paste(im,(xx,yy+30));draw.text((xx+3,yy+7),x['path']+' '+str(width)+' '+theme,fill='black')
   n=f'review-{width}-{theme}-{start//5}.jpg';out.save(f/n,quality=94);queue.append({'name':n,'sourceCaptures':[x['screenshot']for x in chosen]})
(f/'review-queue.json').write_text(json.dumps(queue,indent=2)+'\n');print(stage,len(queue),'sheets generated; personal viewing required')
