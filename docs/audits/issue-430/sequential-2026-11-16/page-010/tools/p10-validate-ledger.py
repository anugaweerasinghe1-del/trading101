import json,hashlib,itertools,sys
from pathlib import Path
p=Path(sys.argv[1]);r=json.loads((p/'block-ledger.json').read_text());h=lambda s:hashlib.sha256(s).hexdigest();canon=lambda x:json.dumps(x,ensure_ascii=False,sort_keys=True).encode();errors=[];forms={};pending=[]
resolutions={x['blockId']:x['resolvedFiles'] for x in json.loads((p/'REFERENCE-RESOLUTIONS.json').read_text())}
for x in r:
 id=x['id'];poss={'text':x['text'].encode()}
 if 'content' in x:poss['canonical-content']=canon(x['content'])
 ref=x.get('contentReference',x.get('capture',''));f,_,fragment=ref.partition('#')
 for f1 in resolutions.get(id,f.split('; ')):
  if f1 and not (p/f1).is_file():errors.append(id+': missing reference '+f1)
 if '#rows/' in ref:
  rows=json.loads((p/f).read_text())['rows'];key=fragment.split('/',1)[1];vs=[a[key] for a in rows if key in a]
  for n in range(1,len(vs)+1):
   for sub in itertools.combinations(vs,n):poss['projection-subset-'+str(n)+'-'+h(canon(sub))[:6]]=canon(list(sub))
 matched=[k for k,v in poss.items() if h(v)==x['sha256']]
 if not matched:errors.append(id+': declared content hash does not resolve')
 else:forms[id]=matched[0]
 for ps in ['pass1','pass2']:
  if x[ps]['status']!='REVIEWED':pending.append(id+':'+ps)
  elif not x[ps].get('reason'):errors.append(id+': no substantive assessment')
 if not x.get('source') or not x.get('sourceRevision'):errors.append(id+': missing source/version')
if len({x['id'] for x in r})!=len(r):errors.append('duplicate IDs')
index={x['id']:x['sha256'] for x in json.loads((p/'REVIEW-INDEX.json').read_text())['blocks']}
if {x['id']:x['sha256'] for x in r}!=index:errors.append('review index omits, changes or invents a content group')
inv=json.loads((p/'SOURCE-EXPRESSION-INVENTORY.json').read_text());cw=json.loads((p/'SOURCE-STATE-CROSSWALK.json').read_text())
assert len(inv['rows'])==491
if {x['id'] for x in inv['rows']}!={i for x in cw['components'] for i in x['sourceExpressions']}:errors.append('source syntax crosswalk omits records')
for c in cw['components']:
 if h((p/c['snapshot']).read_bytes())!=c['fileSHA256']:errors.append('source hash mismatch '+c['source'])
 if not set(c['reviewedBlockReferences']) <= {x['id'] for x in r}:errors.append('invented source review reference')
if '--require-closed' in sys.argv and pending:errors.append('closure rejected: pending substantive reviews')
if '--require-closed' in sys.argv:
 import datetime
 release=json.loads((p/'RELEASE-482.json').read_text());native=release['native'];active=native['activeProduction']
 if active['sha']!=release['mergeSHA'] or active['branch']!='main' or active['environment']!='production' or active['status']!='success':errors.append('native production receipt differs from release')
 if len(release['requiredChecks'])!=5 or not all(c['head_sha']==release['headSHA'] and c['conclusion']=='success' for c in release['requiredChecks']):errors.append('final-head required checks incomplete')
 stamp=lambda x:datetime.datetime.fromisoformat(x.replace('Z','+00:00'))
 for f in release['liveEvidence']:
  if h((p/f['file']).read_bytes())!=f['sha256']:errors.append('live artifact hash mismatch')
  if not all(stamp(t)>stamp(native['observedAt']) for t in f['observedAtUTC']):errors.append('public reread did not follow native observation')
 if json.loads((p/'PRODUCTION482-RAW-TIEOUT.json').read_text())['unreconciled']:errors.append('current authored occurrence trace incomplete')

result=dict(pageId='STRICT-0010',records=len(r),firstPass=sum(x['pass1']['status']=='REVIEWED' for x in r),secondPass=sum(x['pass2']['status']=='REVIEWED' for x in r),integrityErrors=errors,pending=pending,sourceSyntaxMappings=len(inv['rows']),hashForms=forms,limitation='Validates reference/hash coverage only. Editorial judgment, runtime scope and strict closure require the separate records.')
(p/'LEDGER-VALIDATION-482.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='hashForms'},indent=2));sys.exit(bool(errors))
