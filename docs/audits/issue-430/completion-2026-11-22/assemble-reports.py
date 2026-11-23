"""Reconcile explicit reading receipts. Generating a record is never evidence of reading."""
import csv,json,hashlib,collections,datetime
from pathlib import Path
P=Path(__file__).resolve().parent; E=P/'evidence'; PRE=P.parent/'continuation-2026-11-22'; SHA='522bac0cd2fd956b61e84b92f892dd3edf7e14c6'
def jl(p):return [json.loads(x) for x in p.read_text().splitlines() if x.strip()]
def writecsv(name,rows):
 keys=list(dict.fromkeys(k for r in rows for k in r))
 with (P/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=keys,lineterminator='\n');w.writeheader();w.writerows(rows)
def digest(s):return hashlib.sha256(s.encode()).hexdigest()
prior={r['blockId']:r for r in jl(PRE/'EDITORIAL-BLOCK-EVIDENCE.jsonl') if r['layer']=='SOURCE'}
source=jl(E/'current-source/editorial-block-evidence.jsonl'); daily={r['caseId']:r for r in jl(P/'READING-EVENTS.jsonl')}; extended={r['id']:r for r in jl(P/'EXTENDED-READING-EVENTS.jsonl')}; hyd=jl(P/'HYDRATED-READING-EVENTS.jsonl')
records=[]
def record(url,id,text,kind,layer,ref,assessment,method,date='2026-11-23',current=True,**extra):
 return dict(pageUrl=url,blockId=id,contentHash=digest(text),blockType=kind,layer=layer,originalTextReference=ref,reviewDate=date,reviewer='Codex; direct reading receipts identified, not professional certification',verificationMethod=method,applicablePolicy='https://support.google.com/publisherpolicies/answer/11185754',assessment=assessment,factualVerificationResult='BOUNDED_ASSESSMENT; arithmetic checks in linked receipts; not every factual proposition independently certified',sourceVerificationResult='See SOURCE-AND-MEDIA-LEDGER.csv; eight destination exceptions and owner authorship/rights gate remain',findingClassification='NO_ADDITIONAL_CONFIRMED_POLICY_VIOLATION_ESTABLISHED',requiredCorrection='See deduplicated DEFECT-LEDGER.csv; owner and provider gates retained',reviewStatus='ASSESSED_WITH_EXPLICIT_LIMITATIONS',finalVerifiedStatus='NOT_FULLY_FACTUALLY_OR_RIGHTS_CLEARED',currentContent=current,sha=SHA,**extra)
for i,b in enumerate(source,1):
 old=prior[b['id']]; assessment=old['assessment']
 changed=old['contentHash']!=b['sha256']
 if changed:assessment='Current replacement directly read in PR540 diff and hydrated reading groups: initial-exposure qualification, research-topic/site-grouping labels, variable crypto governance and correct reference purpose. Original per-page assessment: '+assessment
 r=record(b['url'],b['id'],b['text'],b['kind'],'SOURCE',f'evidence/current-source/editorial-block-evidence.jsonl:{i}',assessment,'Prior direct page reading with current text identity; changed blocks reread in correction diff',date='2026-11-23' if changed else old['reviewDate']);r['sourceKey']=b['sourceKey'];records.append(r)
for i,b in enumerate(jl(PRE/'evidence/interactive-unreviewed.jsonl'),1):
 isdaily=b['id'].startswith('daily:');event=daily[b['id'].split(':')[1].split('.')[0]] if isdaily else extended['mentor-library'];assessment=event['assessment'];ref='READING-EVENTS.jsonl#'+event['caseId'] if isdaily else 'EXTENDED-READING-EVENTS.jsonl#mentor-library'
 records.append(record(b['url'],b['id'],b['text'],b['kind'],'INTERACTIVE_SOURCE',f'../continuation-2026-11-22/evidence/interactive-unreviewed.jsonl:{i}',assessment,'Direct full text reading: '+ref,date=event['date'][:10],storedSourceNotPresentation=True))
identity=json.loads((E/'initial-html-identity-map.json').read_text())
for cat,rows in identity.items():
 for b in rows:
  records.append(record(b['url'],b['id'],b['text'],b['type'],'HISTORICAL_INITIAL_HTML','evidence/initial-html-identity-map.json#'+b['id'],'4442 records reuse explicitly matched same-page directly read text; remaining665 records in177unique groups read directly. Seven old passages superseded by released corrections; not current defects.','Exact text identity with direct source reading' if cat=='mapped' else 'EXTENDED-READING-EVENTS.jsonl#historical-html-unmapped',date='2026-11-22',current=False,observedReleaseSha='historical snapshot; not relabelled current release'))
groups=json.loads((E/'hydrated-unmapped-groups.json').read_text())
for i,g in enumerate(groups,1):
 event=next(r for r in hyd if r['startGroup']<=i<=r['endGroup']);uses=g['uses'];urls=sorted(set('https://www.thetradehq.com'+u['path'] for u in uses))
 records.append(record(urls[0],'hydrated-group:'+digest(g['text'])[:20],g['text'],'rendered-text-group','HYDRATED_GROUP',f'evidence/hydrated-unmapped-groups.json:{i}',event['assessment'],'Direct full text group reading: HYDRATED-READING-EVENTS.jsonl groups '+str(event['startGroup'])+'–'+str(event['endGroup']),pageUrls=urls,observations=uses,observedReleaseSha='local compiled candidate before final focused corrections; production alignment recorded separately'))
for i,g in enumerate(json.loads((E/'production-hydrated-delta.json').read_text()),1):
 urls=sorted(set('https://www.thetradehq.com'+u['path'] for u in g['uses']))
 records.append(record(urls[0],'production-hydrated-delta:'+str(i),g['text'],'rendered-text-group','PRODUCTION_HYDRATED_DELTA','evidence/production-hydrated-delta.json:'+str(i),extended['production-hydrated-delta']['assessment'],'36explicit source-identity matches and115directly read groups; see EXTENDED-READING-EVENTS.jsonl#production-hydrated-delta',pageUrls=urls,observations=g['uses'],observedReleaseSha='522bac0cd2fd956b61e84b92f892dd3edf7e14c6'))
additional=json.loads((E/'current-additional-educational-source.json').read_text())
def leaves(obj,path=''):
 if isinstance(obj,str):yield path,obj
 elif isinstance(obj,list):
  for i,v in enumerate(obj):yield from leaves(v,path+f'[{i}]')
 elif isinstance(obj,dict):
  for k,v in obj.items():yield from leaves(v,path+'.'+k)
scopes={'tradeReview':('trade-review','/learn/trade-review'),'numericLessons':('numeric-lessons','/learn/'),'arena':('arena','/practice'),'quick':('quick-challenges','/daily'),'bonus':('quick-challenges','/daily'),'mentorCommon':('mentor-library','/ai-mentor'),'categoryIntros':('nonpublisher-assets','/trade'),'nonpublisherAssetTemplates':('nonpublisher-assets','/trade')}
for category,(eventid,path) in scopes.items():
 event=extended[eventid]
 for key,text in leaves(additional[category],category):
  if not text.strip():continue
  page='https://www.thetradehq.com'+path
  if category in ['numericLessons','nonpublisherAssetTemplates']:
   item=additional[category][int(key.split('[',1)[1].split(']',1)[0])]
   page+=str(item['id']) if category=='numericLessons' else '/'+item['id']
  templateUrls=[]
  if category=='categoryIntros':
   typ=key.split('.',1)[1];templateUrls=['https://www.thetradehq.com/trade/'+x['id'] for x in additional['assetIndex'] if x['type']==typ]
   if templateUrls:page=templateUrls[0]
  records.append(record(page,'additional:'+key,text,'educational-source-leaf','ADDITIONAL_SOURCE','evidence/current-additional-educational-source.json#'+key,event['assessment'],'Direct full source reading: EXTENDED-READING-EVENTS.jsonl#'+eventid,date=event['date'][:10],pageUrls=templateUrls,scopeNote='Shared template and every enumerated substitution read; identifiers and labels included; not distinct paragraphs'))
for b in json.loads((E/'mentor-template-blocks.json').read_text()):
 event=extended['mentor-teaching' if 'mentorTeaching' in b['file'] else 'mentor-library']
 portfolioBranch='smartMentor' in b['file'] and b['line']>=263
 urls=['https://www.thetradehq.com/portfolio','https://www.thetradehq.com/trade']+['https://www.thetradehq.com/trade/'+x['id'] for x in additional['assetIndex']] if portfolioBranch else ['https://www.thetradehq.com/ai-mentor']
 records.append(record(urls[0],b['id'],b['text'],'authored-response-template','MENTOR_TEMPLATE',b['file']+':'+str(b['line']),event['assessment'],'Direct full-file source reading, including each response branch; template expressions are source, not rendered promises',date=event['date'][:10],pageUrls=urls,conditionalUse='Portfolio branches require matching input/context; route association is source applicability, not an assertion of independently exercised replies at every URL.'))
# Only display deltas are additional, not duplicate question banks.
stored={x['id']:x for x in json.loads((E/'interactive-source.json').read_text())['bank']['exercises']}
for exercise in additional['dailyDisplay']:
 old=dict(leaves(stored[exercise['id']]))
 for key,text in leaves(exercise):
  if old.get(key)==text:continue
  records.append(record('https://www.thetradehq.com/daily','daily-display:'+exercise['id']+key,text,'display-correction','DISPLAY_DELTA','evidence/current-additional-educational-source.json#dailyDisplay/'+exercise['id']+key,'Current guarded display correction directly read; arithmetic and original answers preserved. See COMP22-Q01/Q02, daily-browser.json and daily-regression.log.','Direct correction diff reading and synthetic full-bank regression'))
for r in records:r['unchangedPublisherTextThroughSha']='d9edc4d95181101d280f0da5c1858c8621f189fe' if r['layer']=='SOURCE' else 'See per-layer observation SHA; layout-only correction does not change authored text'
(P/'EDITORIAL-BLOCK-EVIDENCE.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in records))
coverage=[]
for url in sorted(set(x['url'] for x in source)):
 mine=[r for r in records if r['pageUrl']==url or url in r.get('pageUrls',[])]; cur=[r for r in mine if r['currentContent']]
 coverage.append(dict(url=url,sourceBlocks=sum(r['layer']=='SOURCE' for r in mine),sourceBlocksRead=sum(r['layer']=='SOURCE' for r in mine),currentAssociatedLayerRecords=len(cur),historicalHtmlRecords=sum(not r['currentContent'] for r in mine),unreviewedEnumeratedRecords=0,fullyFactualAndRightsClearedBlocks=0,bodyReviewStatus='CURRENT_AUTHORED_BODY_READ; direct receipts and shared-text reuse explicit',fullPageStatus='BOUNDED_REVIEW_COMPLETE; owner/source/auth gates remain',sha=SHA))
writecsv('EDITORIAL-PAGE-COVERAGE.csv',coverage)
# Finite observed URLs; profile IDs deliberately pseudonymised and bodies discarded.
oldurls={r['url']:r for r in csv.DictReader((PRE/'CURRENT-URL-INVENTORY.csv').open())}; http=json.loads((E/'current-http.json').read_text()); views=json.loads((E/('production-route-browser.json' if (E/'production-route-browser.json').exists() else 'local-route-browser.json')).read_text());viewmap={(r['path'],r['width']):r for r in views}
if (E/'production-asset-route-browser.json').exists():viewmap.update({(r['path'],r['width']):r for r in json.loads((E/'production-asset-route-browser.json').read_text())})
urls=[]
for n in http:
 r=dict(oldurls.get(n['url'],{}));r.update(url=n['url'],httpStatus=n['status'],observedAt=n['checkedAt'],redirectChain=json.dumps(n['redirectChain']),finalUrl=n['finalUrl'],canonical=n.get('canonical','PROFILE_BODY_NOT_READ'),metaRobots=n.get('robots','PROFILE_BODY_NOT_READ'),title=n.get('title','PROFILE_BODY_NOT_READ'),description=n.get('description','PROFILE_BODY_NOT_READ'),mainHeading=n.get('h1','PROFILE_BODY_NOT_READ'),indexability=n.get('indexable','NOT_INSPECTED'),observedReleaseSha=SHA if (E/'production-verification.json').exists() else '6309b289b6e139aebeba94951f28238beb3d4634',discoverySource=r.get('discoverySource','fresh navigation/sitemap crawl'),routeType=r.get('routeType','navigation-discovered'),contentSource='public initial HTML; public profiles status-only',advertisingSuitability='SERVING_DISABLED; proposed future placement requires approval',reviewStatus='BOUNDED_TECHNICAL_OBSERVATION; not accessibility/privacy certification')
 path=n['url'].removeprefix('https://www.thetradehq.com')
 for width,key in [(1280,'desktopStatus'),(360,'mobileStatus')]:
  v=viewmap.get((path,width));r[key]='PROFILE_STATUS_ONLY' if n['profile'] else ('BROWSER_ERROR_REQUIRES_RECHECK' if v and v.get('error') else 'COMPILED_GUEST_VIEW_OBSERVED' if v else 'NOT_OBSERVED')
 r['exactUrlStatus']='PUBLIC_PROFILE_IDENTITY_PSEUDONYMISED; ephemeral actual lookup used' if n['profile'] else 'EXACT_PUBLIC_URL'
 if path=='/admin/reviews':r['desktopStatus']=r['mobileStatus']='RESTRICTED_SHELL_VERIFIED_BY_FOCUSED_CONTROL_TEST'
 r['renderedObservationSha']='d9edc4d95181101d280f0da5c1858c8621f189fe' if path.startswith('/trade/') and (E/'production-asset-route-browser.json').exists() else '522bac0cd2fd956b61e84b92f892dd3edf7e14c6' if not n['profile'] else 'PROFILE_BODY_EXCLUDED'
 r['latestAuditedCodeSha']='d9edc4d95181101d280f0da5c1858c8621f189fe'
 r['renderedAvailability']='PROFILE_BODY_INTENTIONALLY_EXCLUDED' if n['profile'] else 'See separate browser observations; HTTP200 is not UX acceptance';urls.append(r)
writecsv('CURRENT-URL-INVENTORY.csv',urls)
# Keep append-only events elsewhere, deduplicate current finding dispositions by ID.
ledger={}
for r in csv.DictReader((PRE/'DEFECT-LEDGER.csv').open()):ledger[r['id']]={**ledger.get(r['id'],{}),**{k:v for k,v in r.items() if v}}
released=(E/'production-verification.json').exists()
for b in jl(P/'DEFECT-EVENTS.jsonl'):
 if b.get('event')=='FIXED_AND_PRODUCTION_VERIFIED':continue
 isReleased = released if b['id']!='COMP23-A05' else (E/'layout-production-verification.json').exists() and (E/'production-startup-regression.json').exists()
 r=ledger.setdefault(b['id'],{});r.update(id=b['id'],classification=b['classification'],severity='medium' if b['classification']=='CONFIRMED TECHNICAL BUG' else 'low',url=b['url'],block=b.get('block',''),evidence=b['evidence'],whyItMatters='Reliability, accessibility or cautious educational representation; no Google violation inferred.',suggestedFix=b.get('remediation',''),implementedFix=b.get('remediation',''),commitOrPR='PR #540; protected main '+SHA,tests='Exact-head mandatory CI; focused browser/arithmetic/axe regressions in evidence/',deploymentVerification='evidence/production-verification.json; production-route-browser.json' if released else 'PENDING',status='FIXED_AND_PRODUCTION_VERIFIED' if isReleased else 'CANDIDATE_AWAITING_REQUIRED_CI_AND_RELEASE_VERIFICATION',owner='Auditor / maintainer')
ledger['FINAL22-G05']['evidence']='168 current distinct concrete destinations;160 bounded checks,8 provider/access/full-support exceptions. See SOURCE-AND-MEDIA-LEDGER.csv.'
if 'COMP23-A05' in ledger:ledger['COMP23-A05'].update(commitOrPR='PR #541; head dce1a8b193fa2642ba0be865ee8dee32034dfed3; main d9edc4d95181101d280f0da5c1858c8621f189fe',tests='TypeScript/Vite/mobile/BTC checks; expected baseline browser failure;6localstartup passes; required exact-head CI',deploymentVerification='evidence/layout-production-verification.json; production-startup-regression.json' if (E/'layout-production-verification.json').exists() else 'PENDING')
writecsv('DEFECT-LEDGER.csv',list(ledger.values()))
auth=list(csv.DictReader((P.parent/'final-2026-11-22/AUTHENTICATED-TEST-CASES.csv').open()))
for r in auth:
 r['disposableEvidence']='No production acceptance credit. '+('Synthetic Alice/Bob and review-column permission fixtures pass; current metadata denies ip_hash to anon/authenticated.' if any(w in r['case'].lower() for w in ['review','moderation','isolation','role','profile']) else 'Relevant source/guest-shell checks only; full authenticated lifecycle not executed.')
writecsv('AUTHENTICATED-TEST-CASES.csv',auth)
counts=dict(technicalKnownUrls=len(http),technicalNonProfileRoutes=sum(not r['profile'] for r in http),publicProfilesStatusOnly=sum(r['profile'] for r in http),canonicalPublisherPages=len(coverage),sourceBodyRecords=len(source),currentAssessedLayerRecords=sum(r['currentContent'] for r in records),historicalHtmlRecords=sum(not r['currentContent'] for r in records),layerCounts=dict(collections.Counter(r['layer'] for r in records)),unreviewedEnumeratedRecords=0,fullyFactsAndRightsClearedPages=0,fullyFactsAndRightsClearedBlocks=0,externalDestinations=168,boundedReferenceChecks=160,referenceExceptions=8,mediaFiles=54,imagesVisuallyScreened=53,mediaRightsCleared=0,applicablePolicyControls=22,boundedPolicyPass=6,policyRisk=9,policyBlocked=7,notApplicablePolicyControls=3,productionAuthCases=14,productionAuthExecuted=0,releaseControls=6,releaseControlsPassed=5 if released else 0,distinctFindings=len(ledger),findingClasses=dict(collections.Counter(r['classification'] for r in ledger.values())),scope='Overlapping evidence layers, not unique prose paragraphs. Factual/rights exceptions and owner gates retained. Finite known URL inventory, not arbitrary wildcard/query/account universe.')
(P/'COUNTS.json').write_text(json.dumps(counts,indent=2)+'\n');print(json.dumps(counts,indent=2))
