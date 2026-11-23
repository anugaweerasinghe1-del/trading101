"""Validate receipt accounting, not website/policy compliance."""
import csv,json,collections
from pathlib import Path
P=Path(__file__).resolve().parent;E=P/'evidence'
def read(name):return json.loads((E/name).read_text())
def rows(name):return list(csv.DictReader((P/name).open()))
required=['CURRENT-URL-INVENTORY.csv','EDITORIAL-PAGE-COVERAGE.csv','EDITORIAL-BLOCK-EVIDENCE.jsonl','POLICY-REQUIREMENTS-MATRIX.md','SOURCE-AND-MEDIA-LEDGER.csv','DEFECT-LEDGER.csv','RELEASE-VERIFICATION.md','FINAL-ADSENSE-READINESS-REPORT.md']
assert all((P/f).is_file() for f in required)
c=json.loads((P/'COUNTS.json').read_text());blocks=[json.loads(l) for l in (P/required[2]).read_text().splitlines()]
assert len({(b['layer'],b['blockId']) for b in blocks})==len(blocks),'Duplicate layer IDs'
assert len(blocks)==c['currentAssessedLayerRecords']+c['historicalHtmlRecords']
assert c['currentAssessedLayerRecords']==16533 and c['historicalHtmlRecords']==5107
assert all(b['reviewStatus']=='ASSESSED_WITH_EXPLICIT_LIMITATIONS' and b['assessment'] and b['verificationMethod'] and b['reviewDate'] for b in blocks)
assert all(b['finalVerifiedStatus']=='NOT_FULLY_FACTUALLY_OR_RIGHTS_CLEARED' for b in blocks)
source=read('current-source/SUMMARY.json')
assert len(rows(required[1]))==163 and sum(int(r['sourceBlocksRead']) for r in rows(required[1]))==6098
assert c['fullyFactsAndRightsClearedPages']==c['fullyFactsAndRightsClearedBlocks']==0
urls=rows(required[0]);assert len(urls)==len({r['url'] for r in urls})==481
http=read('current-http.json');assert collections.Counter(r['status'] for r in http)=={200:480,404:1}
assert sum(r['profile'] for r in http)==78
views=read('production-route-browser.json');assert len(views)==806
assert len({(r['path'],r['width']) for r in views})==806
assert all(not r['errors'] and not r['adAttempts'] and not r.get('overflow') and not r.get('brokenImages') and not r.get('missingAlt') and not r.get('adsInDom') for r in views)
assert [(r['path'],r['width']) for r in views if r.get('error')]==[('/admin/reviews',1280),('/admin/reviews',360)]
assert len(read('production-control-regressions.json'))==14
axe=read('production-accessibility-after.json');assert len(axe)==72 and all(not r['violations'] for r in axe)
daily=read('production-daily-browser.json');assert len(daily)==50 and sum(r['questions'] for r in daily)==500 and all(r['grading']=='10/10' and not r['errors'] and not r['ads'] for r in daily)
assert len(read('production-editorial-display.json'))==2
assert len(read('production-performance.json'))==12
quizzes=read('production-numeric-quizzes.json');assert len(quizzes)==12 and sum(r['questions'] for r in quizzes)==40
assetViews=read('production-asset-route-browser.json');assert len(assetViews)==340 and all(not r.get('error') and not r['errors'] and not r['adAttempts'] and not r.get('overflow') and not r.get('brokenImages') and not r.get('missingAlt') for r in assetViews)
sources=rows(required[4]);assert collections.Counter(r['type'] for r in sources)=={'REFERENCE':168,'MEDIA':54}
refs=[r for r in sources if r['type']=='REFERENCE'];assert sum(r['result']=='BOUNDED_REFERENCE_CHECKED' for r in refs)==160
assert len({r['urlOrPath'] for r in refs})==168
ledger=rows(required[5]);assert len(ledger)==len({r['id'] for r in ledger})==29
classes=collections.Counter(r['classification'] for r in ledger)
assert classes=={'CONFIRMED TECHNICAL BUG':8,'PLAUSIBLE QUALITY RISK':11,'CONFIRMED EDITORIAL ERROR':1,'FALSE POSITIVE / CLOSED':3,'EXTERNAL GATE':6}
auth=rows('AUTHENTICATED-TEST-CASES.csv');assert len(auth)==14 and all(r['productionStatus']=='BLOCKED_NOT_EXECUTED' for r in auth)
policy=(P/required[3]).read_text();policyRows=[x for x in policy.splitlines() if x.startswith('| P')];assert len(policyRows)==25
assert collections.Counter(x.split('|')[6].strip() for x in policyRows)=={'PASS':6,'RISK':9,'BLOCKED':7,'NOT APPLICABLE':3}
# Final code correction must independently reach native production and pass original regression.
if (E/'layout-production-verification.json').exists():
 receipt=read('layout-production-verification.json');assert receipt['status']=='CLOUDFLARE_PRODUCTION_VERIFIED' and receipt['verifiedMain'] and receipt['customDomainBound']
 startup=read('production-startup-regression.json');assert len(startup)==6 and all(r['cls']<.15 and abs(r['chartYAfter']-r['chartYBefore'])<=64 and not r['errors'] for r in startup)
 assert sum('FIXED' in r['status'] for r in ledger)==19
else:assert ledger[-1]['status']=='CANDIDATE_AWAITING_REQUIRED_CI_AND_RELEASE_VERIFICATION'
print('PASS: receipt structure/counts, explicit reading provenance and bounded test accounting; not policy certification')
