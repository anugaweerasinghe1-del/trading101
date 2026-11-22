"""Reconcile direct reading events with source snapshots; never infer substantive PASS from hashes."""
import csv,json,datetime,collections
from pathlib import Path
P=Path(__file__).resolve().parent;OLD=P.parent/'final-2026-11-22';E=P/'evidence'
def jl(p):return [json.loads(s) for s in p.read_text().splitlines() if s.strip()]
def csvwrite(name,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (P/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys,lineterminator="\n");w.writeheader();w.writerows(rows)
 target=P/name;target.write_text("\n".join(line.rstrip() for line in target.read_text().splitlines())+"\n")
old=jl(OLD/'EDITORIAL-BLOCK-EVIDENCE.jsonl');prior={r['blockId']:r for r in old if r['reviewStatus']=='ASSESSED_SOURCE_ONLY'}
baseline=jl(E/'source-inventory/editorial-block-evidence.jsonl');current=jl(E/'candidate-source-inventory/editorial-block-evidence.jsonl')
events=jl(P/'READING-EVENTS.jsonl');eventByUrl={u:r for r in events for u in r['urls']}
assert len(events)==19 and len(eventByUrl)==145
assert len(current)==6098 and len(set(r['url'] for r in current))==163
reread={ '/courses/bitcoin-simulator-practice-trading/executing-spot-trades-in-the-simulator#0010','/courses/bitcoin-simulator-practice-trading/executing-spot-trades-in-the-simulator#0013','/courses/diversification-and-position-sizing/foundations-of-asset-allocation#0011','/courses/diversification-and-position-sizing/foundations-of-asset-allocation#0049'}
assert {r['id'] for r in baseline if r['id'] in prior and r['sha256']!=prior[r['id']]['contentHash']}==reread
changes={r['id'] for r in current if r['sha256']!=next(x['sha256'] for x in baseline if x['id']==r['id'])}
assert len(changes)==4
records=[]
for i,b in enumerate(current,1):
 p=prior.get(b['id']);ev=eventByUrl.get(b['url'])
 assert ev or p
 notes=ev['judgment'] if ev else p['assessment']
 if b['id'] in reread:notes='Current #534 replacement reread in full in this continuation; fee examples 5094.90-5005=89.90 and4895.10-5005=-109.90 reconciled. Current guest/server path limitations retained.'
 if b['id'] in changes:notes+=' Candidate replacement also directly read in diff; exact production reread required before finding closure.'
 records.append({'pageUrl':b['url'],'blockId':b['id'],'contentHash':b['sha256'],'blockType':b['kind'],'layer':'SOURCE','originalTextReference':f'evidence/candidate-source-inventory/editorial-block-evidence.jsonl:{i}','sourceKey':b['sourceKey'],'reviewDate':'2026-11-22','reviewer':'Codex direct text reading; no delegated or professional reviewer claimed','applicablePolicy':'https://support.google.com/publisherpolicies/answer/11185754','assessment':notes,'factualVerificationResult':'SOURCE_ASSESSED; arithmetic checks stated in reading event; external factual/support exceptions remain','sourceVerificationResult':'Not a blanket claim-support, rights or originality clearance; see source/media ledger','findingClassification':'CONFIRMED_EDITORIAL_ERROR' if b['id']=='/wiki/double-bottom#0010' else 'PLAUSIBLE_QUALITY_RISK' if b['id'] in changes else 'NO_NEW_FINDING_ESTABLISHED_WITHIN_SOURCE_READING_SCOPE','requiredCorrection':'See CONT22-E01 / CONT22-Q01 and release evidence' if b['id'] in changes else '', 'reviewStatus':'ASSESSED_SOURCE_ONLY','finalVerifiedStatus':'NOT_FULLY_VERIFIED','sha':'a7f2a39ea843883563d4f5c02220448a68f22597'})
for b in jl(E/'interactive-unreviewed.jsonl'):
 records.append({'pageUrl':b['url'],'blockId':b['id'],'contentHash':b['sha256'],'blockType':b['kind'],'layer':'INTERACTIVE_SOURCE','originalTextReference':'evidence/interactive-unreviewed.jsonl#'+b['id'],'reviewDate':'','reviewer':'Enumeration only; no individual reading attested','applicablePolicy':'https://support.google.com/publisherpolicies/answer/11185754','factualVerificationResult':'UNREVIEWED','sourceVerificationResult':'UNREVIEWED','findingClassification':'NOT_ASSESSED','requiredCorrection':'Read and independently evaluate before any closure claim','reviewStatus':'UNREVIEWED','finalVerifiedStatus':'NOT_FULLY_VERIFIED','sha':'a7f2a39ea843883563d4f5c02220448a68f22597'})
for b in old:
 if b['layer']!='SOURCE':
  b=dict(b)
  if str(b.get('originalTextReference','')).startswith('evidence/'):
   b['originalTextReference']='../final-2026-11-22/'+b['originalTextReference']
  records.append(b)
assert len(records)==14933
(P/'EDITORIAL-BLOCK-EVIDENCE.jsonl').write_text(''.join(json.dumps(r)+'\n' for r in records))
coverage=[]
for url in sorted({b['url'] for b in current}):
 mine=[r for r in records if r['pageUrl']==url]
 coverage.append({'url':url,'sourceBlocks':sum(r['layer']=='SOURCE' for r in mine),'sourceBlocksRead':sum(r['reviewStatus']=='ASSESSED_SOURCE_ONLY' for r in mine),'knownOtherLayerRecords':sum(r['layer']!='SOURCE' for r in mine),'unreviewedRecords':sum(r['reviewStatus']!='ASSESSED_SOURCE_ONLY' for r in mine),'fullyVerifiedBlocks':0,'sourceBodyStatus':'ENUMERATED_BODY_SOURCE_READ','fullPageStatus':'BLOCKED_INCOMPLETE_RENDERED_INTERACTIVE_FACTUAL_RIGHTS_ACCEPTANCE','sha':'a7f2a39ea843883563d4f5c02220448a68f22597'})
csvwrite('EDITORIAL-PAGE-COVERAGE.csv',coverage)
# Existing HTTP and browser receipts are dated evidence; do not relabel their deployment SHA.
with (OLD/'CURRENT-URL-INVENTORY.csv').open() as f:urls=list(csv.DictReader(f))
freshFile=E/'current-release-http.json'
if freshFile.exists():
 fresh={r['url']:r for r in json.loads(freshFile.read_text())}
 currentViews={r['route'] for r in json.loads((E/'production-browser.json').read_text())}
 for r in urls:
  n=fresh[r['url']];r['priorBrowserEvidenceSha']=r['observedReleaseSha']
  r.update(httpStatus=n['status'],observedAt=n['checkedAt'],redirectChain=json.dumps(n['redirectChain']),finalUrl=n['finalUrl'],observedReleaseSha=n['sha'])
  for field,newfield in [('canonical','canonical'),('metaRobots','robots'),('title','title'),('description','description'),('mainHeading','h1')]:
   if newfield in n:r[field]=n[newfield]
  changed=r['url'].removeprefix('https://www.thetradehq.com') in currentViews
  r['desktopStatus']=r['mobileStatus']='CURRENT_CHANGED_ROUTE_OBSERVED' if changed else 'PRIOR_BOUNDED_OBSERVATION; not rerun on current release'
  r['continuationStatus']='Fresh known-cohort HTTP/metadata only; prior indexability/template evidence retained separately; full technical acceptance not certified.'
else:
 for r in urls:r['continuationStatus']='Carried dated HTTP metadata; route topology unchanged by #536. Full technical acceptance not certified.'
csvwrite('CURRENT-URL-INVENTORY.csv',urls)
with (OLD/'SOURCE-AND-MEDIA-LEDGER.csv').open() as f:media=list(csv.DictReader(f))
for r in media:r['continuationStatus']='Prior bounded observation retained; not full rights or source-support closure'
for s in json.loads((E/'reference-sections/results.json').read_text()):
 media.append({'kind':'bounded-reference-section','url':s.get('url'),'continuationStatus':'BOUNDED_CLAIM_SUPPORTED' if s['id'] in ['fomc','mes','ice','nyse','iv'] else 'SUPPORT_NOT_OBTAINED_FROM_THIS_HTML','evidence':'evidence/reference-sections/results.json#'+s['id'],'limitations':'Exact excerpts assessed; not all statements or full-document validity. SEBI PDF separately supports rounded overall cohort.'})
media += [{'kind':'bounded-reference-section','url':'https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI','continuationStatus':'BOUNDED_FORMULA_SUPPORTED','evidence':'DEFECT-EVENTS.jsonl CONT22-E01','limitations':'Formula only; not whole article or investment strategy validation'},{'kind':'bounded-reference-section','url':'https://www.sebi.gov.in/sebi_data/attachdocs/sep-2024/1727085659479.pdf','continuationStatus':'BOUNDED_CLAIM_SUPPORTED','evidence':'evidence/reference-sections/sebi-overall-verification.json','limitations':'Executive summary92.8% rounds93%; cohort and date retained, not full report review'}]
csvwrite('SOURCE-AND-MEDIA-LEDGER.csv',media)
with (OLD/'DEFECT-LEDGER.csv').open() as f:ledger=list(csv.DictReader(f))
for b in jl(P/'DEFECT-EVENTS.jsonl'):
 ledger.append({'id':'FINAL22-Q01' if b['id']=='CONT22-Q01' else b['id'],'classification':b['classification'],'severity':'low','url':b['url'],'block':b['blockId'],'evidence':b['evidence'],'suggestedFix':b.get('remediation'),'commitOrPR':'PR #536, candidate a7f2a39ea843883563d4f5c02220448a68f22597','status':'CANDIDATE_TESTED_AWAITING_REQUIRED_CI_AND_PRODUCTION'})
release=E/'production-verification.json'
if release.exists():
 v=json.loads(release.read_text())
 for id,classification in [('FINAL22-Q01','PLAUSIBLE QUALITY RISK'),('CONT22-E01','CONFIRMED EDITORIAL ERROR')]:ledger.append({'id':id,'classification':classification,'commitOrPR':v['sha']+' PR #536','tests':'Full local Cloudflare build, required exact-head checks and native preview; RSI ratio counterexample; course source/HTML/bootstrap safety','deploymentVerification':'evidence/production-verification.json + production-browser.json','status':'FIXED_AND_PRODUCTION_VERIFIED'})
csvwrite('DEFECT-LEDGER.csv',ledger)
counts={'technicalKnownCohort':481,'canonicalPublisherRoutes':163,'sourceBodiesRead':163,'sourceBlockRecordsAssessed':6098,'interactiveSourceLeafRecordsUnreviewed':3728,'initialHtmlRecordsIndividuallyUnreviewed':5107,'knownBlockRecordsAllLayers':14933,'unreviewedKnownRecords':8835,'fullyVerifiedPages':0,'fullyVerifiedBlocks':0,'repositoryMediaFiles':54,'visuallyScreenedRasters':50,'mediaRightsCleared':0,'externalUniqueDestinationUrls':146,'externalDestinationAccounting':'Prior canonical146; embedded SEBI PDF is an additional corroborating document, not a newly linked publisher destination. Further interactive external destinations not fully reconciled.','boundedSourceSectionsRead':11,'fullySourceClearedDestinations':0,'applicablePolicyControls':22,'boundedPolicyPass':6,'policyRisk':9,'policyBlocked':7,'notApplicablePolicyControls':3,'productionAuthenticatedPlanned':14,'productionAuthenticatedExecuted':0,'releaseControls':6,'releaseControlsPassed':5 if release.exists() else 0,'releaseControlsBlocked':1 if release.exists() else 6,'scope':'Known lower bounds; overlap among source, initial HTML and interactive units. Hidden/UGC/all-assets denominator not certified.'}
(P/'COUNTS.json').write_text(json.dumps(counts,indent=2)+'\n')
print(json.dumps(counts))
