"""Structural consistency only; does not perform content/compliance review."""
import pathlib,json,csv,re,collections
P=pathlib.Path(__file__).resolve().parent
required=['CURRENT-URL-INVENTORY.csv','EDITORIAL-PAGE-COVERAGE.csv','EDITORIAL-BLOCK-EVIDENCE.jsonl','POLICY-REQUIREMENTS-MATRIX.md','SOURCE-AND-MEDIA-LEDGER.csv','DEFECT-LEDGER.csv','RELEASE-VERIFICATION.md','FINAL-ADSENSE-READINESS-REPORT.md']
for name in required:assert (P/name).is_file(),name
readcsv=lambda n:list(csv.DictReader((P/n).open()))
urls=readcsv(required[0]);assert len({r['url'] for r in urls})==len(urls)
assert all(r['httpStatus']!='NOT_YET_CHECKED' for r in urls)
pages=readcsv(required[1]);assert len({r['url'] for r in pages})==len(pages)
assert {r['url'] for r in pages}=={r['url'] for r in urls if r['routeType']=='publisher'}
rows=[json.loads(x) for x in (P/required[2]).read_text().splitlines() if x.strip()]
fields=['pageUrl','blockId','contentHash','blockType','originalTextReference','reviewDate','verificationMethod','applicablePolicy','factualVerificationResult','sourceVerificationResult','requiredCorrection','finalVerifiedStatus']
for r in rows:
 assert all(k in r for k in fields),(r.get('blockId'),[k for k in fields if k not in r])
 assert re.fullmatch('[a-f0-9]{64}',r['contentHash'])
 assert r.get('reviewStatus')=='ASSESSED_WITH_EXPLICIT_LIMITATIONS',r['blockId']
keys=[(r['pageUrl'],r['layer'],r['blockId']) for r in rows];assert len(set(keys))==len(keys),'Duplicate evidence identifier'
assert sum(int(r['sourceBlocks']) for r in pages)==sum(r['layer']=='SOURCE' for r in rows)
findings=readcsv(required[5]);assert len({r['id'] for r in findings})==len(findings)
sm=readcsv(required[4]);assert len({r['urlOrPath'] for r in sm if r['type']=='REFERENCE'})==sum(r['type']=='REFERENCE' for r in sm)
counts=json.loads((P/'COUNTS.json').read_text());assert counts['finiteKnownUrls']==len(urls);assert counts['canonicalPublisherPages']==len(pages);assert counts['individualAssessmentRecords']==len(rows);assert counts['distinctFindings']==len(findings)
# Pins are private synthetic identities. Provider deployment UUIDs and content IDs are legitimate public evidence.
private=[]
cache=P.parent/'owner-followup-2026-11-23/.cache'
def pins(value):
 if isinstance(value,dict):
  for key,item in value.items():
   if key.lower() in {'userid','user_id','email','password','profile_id','profileid'} and isinstance(item,str) and len(item)>5:private.append(item)
   else:pins(item)
 elif isinstance(value,list):
  for item in value:pins(item)
for name in ['identities.json','adsense-access-session.json']:
 if (cache/name).exists():pins(json.loads((cache/name).read_text()))
for p in P.rglob('*'):
 if not p.is_file() or '.cache' in p.parts:continue
 text=p.read_text(errors='replace')
 for value in private:assert value not in text,str(p)+' contains a private test pin'
 assert not re.search(r'eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\.',text),str(p)+' JWT-like value'
print(json.dumps({'validation':'STRUCTURAL_AND_PRIVATE_PIN_CHECK_ONLY','urls':len(urls),'publisherPages':len(pages),'assessmentRecords':len(rows),'findings':len(findings),'contentAndPolicyPassNotInferred':True}))
