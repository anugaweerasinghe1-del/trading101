"""Export dated observations and explicit review limits; never turn extraction into PASS."""
import csv,json,hashlib
from pathlib import Path
from urllib.parse import urlsplit
OUT=Path(__file__).resolve().parent;E=OUT/'evidence'
def read(name):return json.loads((E/name).read_text())
def csvfile(name,rows):
    fields=list(dict.fromkeys(k for row in rows for k in row))
    with (OUT/name).open('w') as f:
        w=csv.DictWriter(f,fields);w.writeheader();w.writerows(rows)
crawl=read('live-crawl.json');additional=read('historical-reconciliation.json')+read('additional-app-routes.json')
browser=read('browser.json');settled=read('browser-settled-trade.json')
lookup={(r['url'],r['width']):r for r in browser+settled}
inventory=[]
for p in crawl['pages']+additional:
    url=p['url'];path=urlsplit(url).path;profile='[public-profile-' in url
    inventory.append({'url':url,'routeType':'public-profile-pseudonym' if profile else 'publisher' if p.get('inSitemap') else 'legacy-alias' if p.get('canonical') and p.get('canonical')!=url else 'application-or-utility',
      'discoverySource':p.get('discoverySource','current sitemaps and anchor crawl' if p in crawl['pages'] else 'historical 480-route queue'),
      'httpStatus':p.get('status'),'observedAt':p.get('checkedAt',crawl['checkedAt']),
      'redirectChain':'NOT_CAPTURED; final destination only' if not profile else 'NOT_CAPTURED; GET status only',
      'finalUrl':p.get('finalUrl','OMITTED_PROFILE_IDENTITY' if profile else url),
      'canonical':p.get('canonical','NOT_INSPECTED' if profile else ''),'indexability':p.get('indexable','NOT_INSPECTED'),
      'metaRobots':p.get('robots','NOT_INSPECTED'),'title':p.get('title','NOT_INSPECTED'),
      'description':p.get('description','NOT_INSPECTED'),'mainHeading':p.get('h1',' | '.join(p.get('headings',[])[:1])) if not profile else 'NOT_COLLECTED',
      'contentSource':'public initial HTML' if not profile else 'profile body intentionally not collected',
      'renderedAvailability':'BROWSER_OBSERVED' if (url,1280) in lookup else 'NOT_TESTED',
      'advertisingSuitability':'SERVING_DISABLED; individual eligibility not certified',
      'desktopStatus':'OBSERVED' if (url,1280) in lookup else 'UNREVIEWED',
      'mobileStatus':'OBSERVED' if (url,360) in lookup else 'UNREVIEWED',
      'reviewStatus':'HTTP_ONLY_PRIVACY_LIMIT' if profile else 'TECHNICAL_OBSERVATION_ONLY; not editorial closure'})
assert len(inventory)==len({r['url'] for r in inventory})==481
if (E/'final-release-http.json').exists():
    latest=read('final-release-http.json')
    if len(latest)==481:
        by_url={r['url']:r for r in latest}
        for row in inventory:
            r=by_url[row['url']]
            row.update(httpStatus=r['status'],observedAt=r['checkedAt'],redirectChain=json.dumps(r['redirectChain']),finalUrl=r['finalUrl'],observedReleaseSha=r['sha'])
            if not r['profile']:
                row.update(canonical=r.get('canonical',''),indexability=r.get('indexable','UNKNOWN'),metaRobots=r.get('robots',''),title=r.get('title',''),description=r.get('description',''),mainHeading=r.get('h1',''))
csvfile('CURRENT-URL-INVENTORY.csv',inventory)
source=[json.loads(s) for s in (E/'source-block-text.jsonl').read_text().splitlines()]
initial=[json.loads(s) for s in (E/'initial-html-blocks.jsonl').read_text().splitlines()]
read_paths={'/','/about','/privacy','/terms','/contact','/newsletter'}
read_courses=('cryptocurrency-price-feeds-and-valuation','bitcoin-simulator-practice-trading','diversification-and-position-sizing')
affected={
 '/courses/bitcoin-simulator-practice-trading/executing-spot-trades-in-the-simulator#0010',
 '/courses/bitcoin-simulator-practice-trading/executing-spot-trades-in-the-simulator#0013',
 '/courses/diversification-and-position-sizing/foundations-of-asset-allocation#0011',
 '/courses/diversification-and-position-sizing/foundations-of-asset-allocation#0049'}
quality={
 '/courses/bitcoin-simulator-practice-trading/setting-up-your-bitcoin-simulator-environment#0004',
 '/courses/bitcoin-simulator-practice-trading/setting-up-your-bitcoin-simulator-environment#0013',
 '/courses/cryptocurrency-price-feeds-and-valuation/api-delays-and-portfolio-valuation#0014'}
records=[]
for line,b in enumerate(source,1):
    path=urlsplit(b['url']).path
    assessed=path in read_paths or any(path.startswith('/courses/'+s) for s in read_courses)
    issue='FINAL22-001' if b['id'] in affected else 'FINAL22-Q01' if b['id'] in quality else ''
    factual='NOT_INDEPENDENTLY_VERIFIED'
    if assessed and b['kind'] in ['section-heading','main-heading','lesson-title','link-label','link-destination','reference-label','reference-url','meta']:
        factual='LABEL_OR_METADATA; destination/function/rights checks separate'
    if assessed and b['kind'].startswith('quiz-'):
        factual='ANSWER_LOGIC_READ; current selected answer checked against lesson; external factual authority separate'
    if assessed and b['kind']=='quiz-option':factual='DISTRACTOR_OR_ANSWER_IN_CONTEXT; not asserted as publisher fact in isolation'
    records.append({'pageUrl':b['url'],'blockId':b['id'],'contentHash':b['sha256'],'blockType':b['kind'],'layer':'SOURCE',
      'originalTextReference':'evidence/source-block-text.jsonl:'+str(line),'sourceKey':b['sourceKey'],
      'reviewDate':'2026-11-22' if assessed else None,'reviewer':'Codex: direct complete source-text reading in this run; same assistant' if assessed else None,
      'applicablePolicy':'https://support.google.com/publisherpolicies/answer/11185754',
      'assessment':'SOFTWARE_DESCRIPTION_CONTRADICTION' if b['id'] in affected else 'PEDAGOGICAL_CERTAINTY_RISK' if b['id'] in quality else 'READ; no additional finding established within this source-only assessment' if assessed else 'UNREVIEWED',
      'factualVerificationResult':factual,'sourceVerificationResult':'See source/media ledger; not a blanket source-support attestation' if assessed else 'UNREVIEWED',
      'findingClassification':'CONFIRMED TECHNICAL BUG' if b['id'] in affected else 'PLAUSIBLE QUALITY RISK' if b['id'] in quality else 'NO_NEW_FINDING_ESTABLISHED_WITHIN_SCOPE' if assessed else 'NOT_ASSESSED',
      'issueIds':[issue] if issue else [],'requiredCorrection':'See DEFECT-LEDGER.csv' if issue else '',
      'reviewStatus':'ASSESSED_SOURCE_ONLY' if assessed else 'UNREVIEWED','finalVerifiedStatus':'NOT_FULLY_VERIFIED',
      'sha':'0e5db6f9c4ab22e0f8ed38663c484c92afa4f48b'})
for line,b in enumerate(initial,1):
    records.append({'pageUrl':b['url'],'blockId':b['id'],'contentHash':b['sha256'],'blockType':b['type'],'layer':'INITIAL_HTML',
      'originalTextReference':'evidence/initial-html-blocks.jsonl:'+str(line),'reviewDate':None,'reviewer':None,
      'applicablePolicy':'https://support.google.com/publisherpolicies/answer/11112688',
      'assessment':'UNREVIEWED; overlaps source records; nested lists/tables can repeat text',
      'factualVerificationResult':'UNREVIEWED','sourceVerificationResult':'UNREVIEWED','findingClassification':'NOT_ASSESSED',
      'issueIds':[],'requiredCorrection':'Complete passage-level rendered/source reconciliation','reviewStatus':'UNREVIEWED','finalVerifiedStatus':'NOT_FULLY_VERIFIED',
      'sha':'0e5db6f9c4ab22e0f8ed38663c484c92afa4f48b'})
assert len({b['blockId'] for b in records})==len(records)
(OUT/'EDITORIAL-BLOCK-EVIDENCE.jsonl').write_text(''.join(json.dumps(x)+'\n' for x in records))
pages=[]
for url in dict.fromkeys(b['url'] for b in source):
    mine=[b for b in records if b['pageUrl']==url];src=[b for b in mine if b['layer']=='SOURCE'];ht=[b for b in mine if b['layer']=='INITIAL_HTML']
    pages.append({'url':url,'sourceBlocks':len(src),'initialHtmlBlocks':len(ht),'individuallyAssessedSourceBlocks':sum(b['reviewStatus']=='ASSESSED_SOURCE_ONLY' for b in src),
      'individuallyAssessedHtmlBlocks':0,'fullyVerifiedBlocks':0,'requiredHiddenInteractiveBlockTotal':'UNKNOWN',
      'desktopObserved':(url,1280) in lookup,'mobileObserved':(url,360) in lookup,
      'sourceBodyReview':'FRESH_BOUNDED_SOURCE_READ' if any(b['reviewStatus']=='ASSESSED_SOURCE_ONLY' for b in src) else 'UNREVIEWED_IN_THIS_RUN',
      'fullEditorialStatus':'BLOCKED_FULL_RENDERED_FACT_SOURCE_MEDIA_INTERACTION_REVIEW',
      'findings':';'.join(sorted({i for b in mine for i in b['issueIds']}))})
csvfile('EDITORIAL-PAGE-COVERAGE.csv',pages)
refs=read('reference-http-checks.json');uses={r['url']:r['uses'] for r in read('reference-discovery.json')}
reviewed_sources={'https://www.coingecko.com/en/methodology':'Market Data: Market Price of Coins; provider aggregation/outlier rules support the deliberately limited methodology discussion.',
 'https://docs.coingecko.com/reference/simple-price':'Notes: identifiers and optional last_updated_at support freshness/identifier cautions; no TradeHQ implementation attestation.',
 'https://www.investor.gov/introduction-investing/getting-started/asset-allocation':'Asset allocation, time horizon, risk tolerance and rebalancing; no universal required classroom target.',
 'https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset':'Asset Allocation 101 and Risk versus Reward; allocation depends on circumstances; examples are not recommended allocations.'}
media=read('repository-media.json')
ledger=[]
for r in refs:
    ledger.append({'kind':'EXTERNAL_REFERENCE','urlOrPath':r['url'],'httpStatus':r['status'],'finalUrl':r.get('finalUrl',''),
      'title':r.get('title',''),'uses':json.dumps(uses.get(r['url'],[])),
      'contentAssessment':reviewed_sources.get(r['url'],'UNREVIEWED_CLAIM_SUPPORT'),
      'result':'BOUNDED_SOURCE_SECTION_READ' if r['url'] in reviewed_sources else 'BLOCKED_ACCESS' if r['status']!=200 else 'HTTP_ONLY_NOT_SOURCE_VERIFICATION',
      'provenance':'Third-party reference, not publisher-owned material','remediation':'Check each associated claim, date and exact destination; HTTP 200 alone does not prove relevant content.'})
for r in media:
    ledger.append({'kind':'REPOSITORY_MEDIA','urlOrPath':r['path'],'sha256':r['sha256'],'bytes':r['bytes'],
      'width':r.get('width',''),'height':r.get('height',''),'contentAssessment':r['visualScreen'],
      'result':'OWNER EVIDENCE REQUIRED','provenance':'Owner reports AI image generation; no independent generation/license chain. Music separately attributed in footer; file identity not independently established.',
      'remediation':'Provide original generation/source records and applicable usage terms; verify music recording and attribution/license.'})
csvfile('SOURCE-AND-MEDIA-LEDGER.csv',ledger)
counts={'technicalUrls':len(inventory),'http200':sum(x['httpStatus']==200 for x in inventory),'expected404':sum(x['httpStatus']==404 for x in inventory),
 'profileStatusOnly':sum(x['routeType']=='public-profile-pseudonym' for x in inventory),
 'canonicalPublisherPages':len(pages),'fullyEditorialVerifiedPages':0,'sourcePagesRead':sum(p['individuallyAssessedSourceBlocks']>0 for p in pages),
 'sourceBlocks':len(source),'sourceBlocksAssessed':sum(b['reviewStatus']=='ASSESSED_SOURCE_ONLY' for b in records),
 'initialHtmlBlocks':len(initial),'totalInventoriedBlockRecords':len(records),'fullyVerifiedBlocks':0,
 'browserPublisherVisits':len(browser),'settledAssetVisits':len(settled),'noJsSampleVisits':len(read('browser-nojs.json')),
 'repositoryMedia':len(media),'visuallyScreenedRasters':sum(r['visualScreen']=='CONTACT_SHEET_SCREENED' for r in media),'rightsVerifiedMedia':0,
 'externalReferences':len(refs),'externalHttp200':sum(r['status']==200 for r in refs),'externalAccessExceptions':sum(r['status']!=200 for r in refs),'boundedSourceSectionsRead':len(reviewed_sources),
 'limitations':['Known block layers overlap and are not a count of unique authored paragraphs.','Hidden, interactive and user-generated block totals remain unknown.','Public profile identities intentionally pseudonymized.','Initial browser snapshots included transient asset loading; settled follow-up supersedes these for assets.','No authenticated production acceptance or Google account evidence.']}
(OUT/'COUNTS.json').write_text(json.dumps(counts,indent=2)+'\n');print(json.dumps(counts,indent=2))
