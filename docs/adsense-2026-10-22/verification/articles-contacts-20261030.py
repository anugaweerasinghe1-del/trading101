from pathlib import Path
import subprocess,json
r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence/fullpage-light-articles-20261030');q=[]
for p in sorted(r.glob('*.json')):
 if len(p.stem)!=16:continue
 d=json.loads(p.read_text())
 if d['outcome']!='COLLECTED_NOT_HUMAN_REVIEWED':continue
 names=sorted(r.glob('contact-'+p.stem+'-*.jpg'))
 if not names:names=map(Path,json.loads(subprocess.check_output(['python3','/workspace/scratch/tradehq-audit/visual-contact.py',str(r),d['path']],text=True)))
 q.extend({'path':d['path'],'name':x.name}for x in names)
(r/'review-queue.json').write_text(json.dumps(q,indent=2)+'\n');print('completed routes',len(set(x['path']for x in q)),'sheets',len(q))
