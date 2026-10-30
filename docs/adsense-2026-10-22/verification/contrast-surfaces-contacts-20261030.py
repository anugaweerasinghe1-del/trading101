from pathlib import Path
from PIL import Image,ImageDraw
import json,sys
stage=sys.argv[1];r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');d=json.loads((r/('CONTRAST-SURFACES-'+stage.upper()+'-20261030.json')).read_text());assert d['outcome']=='PASS' and len(d['rows'])==50;f=r/('contrast-surfaces-'+stage+'-20261030');q=[]
for theme in ['light','dark']:
 for w in [360,390,768,1280,1920]:
  rows=[x for x in d['rows']if x['width']==w and x['theme']==theme];names=[n for x in rows for n in x.get('screenshots',[x.get('screenshot')])];assert len(names)==6;cw=min(w,768);ch=round(900*cw/w)+26;out=Image.new('RGB',(cw*3,ch*2),'#ddd');draw=ImageDraw.Draw(out)
  for i,n in enumerate(names):
   im=Image.open(f/n).convert('RGB').resize((cw,ch-26),Image.Resampling.LANCZOS);xx=i%3*cw;yy=i//3*ch;out.paste(im,(xx,yy+26));draw.text((xx+3,yy+5),n,fill='black')
  name=f'review-{w}-{theme}.jpg';out.save(f/name,quality=94);q.append({'name':name,'sourceCaptures':names})
(f/'review-queue.json').write_text(json.dumps(q,indent=2)+'\n');print(stage,'10 sheets/60captures generated; personal review required')
