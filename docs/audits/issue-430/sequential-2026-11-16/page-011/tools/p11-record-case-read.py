"""Record supplied substantive judgments; never generates editorial judgments."""
import argparse, datetime, hashlib, json
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('page_root');parser.add_argument('phase',choices=['first','second']);parser.add_argument('judgments');parser.add_argument('--source-sha',required=True)
a=parser.parse_args();p=Path(a.page_root);bank=json.loads((p/'published-bank.json').read_text());rows=json.loads((p/'block-ledger.json').read_text());notes=json.loads(Path(a.judgments).read_text());now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for key,reasons in notes.items():
 ix=int(key);e=bank['exercises'][ix];groups=[('brief',e['scenario']),('visual',e['visual'])]+[(f'q{i+1:02}',q)for i,q in enumerate(e['questions'])]+[('takeaway',e['reflectionGuide']),('sources',e['sources']),('unused-reflection',e['reflection'])]
 assert len(reasons)==len(groups)==15
 for (suffix,content),reason in zip(groups,reasons):
  assert isinstance(reason,str)and len(reason)>20
  id=f"STRICT-0011-DEEP-{e['id']}-{suffix}";existing=[r for r in rows if r['id']==id];sha=hashlib.sha256(json.dumps(content,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
  review=dict(status='REVIEWED',reason=reason,reviewer='Codex assistant, substantive full-case first read' if a.phase=='first' else 'Codex assistant; separate substantive skeptical full-case reread',reviewedAtUTC=now)
  if a.phase=='first':
   assert not existing,'Do not repeat completed first reads'
   rows.append(dict(id=id,text=e['title']+' / '+suffix,content=content,sha256=sha,contentReference=f'published-bank.json#/exercises/{ix}',source='Published approved Daily bank; src/components/DailyPractice.tsx',sourceRevision=a.source_sha,scope='Public date-selected bank data; not a natural-current-date browser observation. Reflection prompt is source-only.',pass1=review,pass2=dict(status='PENDING',reason='Separate substantive skeptical reread not recorded yet.')))
  else:
   assert len(existing)==1 and existing[0]['sha256']==sha and existing[0]['pass1']['status']=='REVIEWED'and existing[0]['pass2']['status']=='PENDING'
   existing[0]['pass2']=review;existing[0]['outcome']='NO-ISSUE-IDENTIFIED-IN-STATED-SCOPE'
(p/'block-ledger.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n');print(a.phase,len(notes),'complete-case judgments recorded;',len(rows),'overlapping groups; no page closure')
