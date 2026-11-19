import json,hashlib,re,sys
from pathlib import Path
p=Path(sys.argv[1]);prefix=sys.argv[2];r=json.loads((p/'block-ledger.json').read_text());cross=json.loads((p/'CURRENT-FRAGMENT-CROSSWALK.json').read_text())['groups']
def strings(x):
 if isinstance(x,str):yield x
 elif isinstance(x,list):
  for v in x:yield from strings(v)
 elif isinstance(x,dict):
  for v in x.values():yield from strings(v)
corpus=[]
for x in r:
 values=list(strings(x.get('content',[])))+[x['text']]
 for f in x.get('contentReference',x.get('capture','')).split('; '):
  f=f.split('#')[0].split(' and responsive')[0]
  if (p/f).is_file() and f.endswith('.json'):values += list(strings(json.loads((p/f).read_text())))
 for f in x.get('productionEvidence',[]):
  f=f.split('#')[0]
  if (p/f).is_file():values +=list(strings(json.loads((p/f).read_text())))
 corpus.append((x['id'],values))
for x in cross:corpus.append((';'.join(x['priorRecords']),[x['text']]))
groups={};unknown=[];raw=0
for i in range(5):
 f=p/f'{prefix}-capture-{i}.json';capture=json.loads(f.read_text())
 for n,x in enumerate(capture['occurrences']):
  raw+=1;groups.setdefault(x['text'],[]).append([i,n])
rows=[]
for text,locations in groups.items():
 if re.fullmatch(r'[\s\d.,+$%−–:/()\-]+(?:s ago)?',text):kind='GENERATED-NUMERIC-OR-CLOCK-FRAGMENT';hits=[]
 else:
  hits=[id for id,vs in corpus if any(text in v for v in vs)]
  kind='TEXT-PRESENT-IN-REFERENCED-REVIEW-PROJECTION' if hits else 'UNRECONCILED'
  if not hits:unknown.append(dict(locations=locations,text=text))
 rows.append(dict(locations=locations,sha256=hashlib.sha256(text.encode()).hexdigest(),text=text,kind=kind,reviewReferences=hits))
v=dict(scope='Occurrence-to-existing-evidence trace only. Containment in an artifact is not a substantive review or closure. Page-level decision also requires individual judgments, source/control crosswalk and actual release evidence.',captures=5,rawOccurrences=raw,groups=len(rows),unreconciled=unknown,occurrences=rows)
(p/(prefix.upper()+'-RAW-TIEOUT.json')).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n');print(json.dumps(dict(raw=raw,groups=len(rows),unreconciled=unknown),ensure_ascii=False,indent=2))
