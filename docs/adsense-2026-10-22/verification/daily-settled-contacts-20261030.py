from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');f=r/'daily-curriculum-settled-20261030';o=r/'daily-settled-personal-20261030';o.mkdir(exist_ok=True);q=[];receipt=json.loads((r/'DAILY-CURRICULUM-SETTLED-BROWSER-20261030.json').read_text())
for row in receipt['rows']:
 ident=row['id'];names=[f'{ident}-q{n}-{w}.png'for n in [1,10]for w in [360,1280]];im=Image.new('RGB',(1640,1656),'#dddddd');d=ImageDraw.Draw(im)
 for j,n in enumerate(names):
  x=0 if j%2==0 else 360;y=j//2*828;src=Image.open(f/n).convert('RGB');d.text((x+3,y+5),n,fill='black');im.paste(src,(x,y+28))
 name=ident+'.jpg';im.save(o/name,quality=94);q.append({'name':name,'id':ident,'sourceCaptures':names,'sha256':hashlib.sha256((o/name).read_bytes()).hexdigest()})
(o/'review-queue.json').write_text(json.dumps({'scope':'Settled historical isolated fixture first/final checked question only. No source-commit/current-production/all-question personal visual credit.','sheets':q},indent=2)+'\n');print([x['id']for x in q])
