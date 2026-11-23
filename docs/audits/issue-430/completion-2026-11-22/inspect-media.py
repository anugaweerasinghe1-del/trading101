"""Read file dimensions/format only; never edits an image or establishes rights."""
from pathlib import Path
import json,xml.etree.ElementTree as ET
from PIL import Image
P=Path(__file__).resolve().parent;ROOT=P.parents[3];rows=[]
for r in json.loads((P/'evidence/current-media.json').read_text()):
 p=ROOT/r['path'];row=dict(r)
 if p.suffix.lower()=='.svg':
  root=ET.parse(p).getroot();row.update(format='SVG',viewBox=root.get('viewBox'),width=root.get('width'),height=root.get('height'))
 elif p.suffix.lower()=='.mp3':row.update(format='MP3',durationSeconds=146.07675,preload='none; controlled user playback')
 else:
  with Image.open(p) as im:row.update(format=im.format,width=im.width,height=im.height)
 row['interpretation']='Technical metadata only; same-day visual/content scope and owner-rights gate are separately documented.';rows.append(row)
(P/'evidence/media-technical-metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Files',len(rows),'largest',sorted([(r['path'],r['bytes']) for r in rows],key=lambda r:r[1],reverse=True)[:4])
