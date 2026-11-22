"""Evidence integrity validation, deliberately separate from readiness approval."""
import csv,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parent
def csvrows(name):return list(csv.DictReader((P/name).open()))
counts=json.loads((P/'COUNTS.json').read_text())
urls=csvrows('CURRENT-URL-INVENTORY.csv');pages=csvrows('EDITORIAL-PAGE-COVERAGE.csv')
blocks=[json.loads(s) for s in (P/'EDITORIAL-BLOCK-EVIDENCE.jsonl').read_text().splitlines()]
assert len(urls)==len({x['url'] for x in urls})==counts['technicalUrls']
assert len(pages)==len({x['url'] for x in pages})==counts['canonicalPublisherPages']
assert len(blocks)==len({x['blockId'] for x in blocks})==counts['totalInventoriedBlockRecords']
original={}
for file in ['source-block-text.jsonl','initial-html-blocks.jsonl']:
 for s in (P/'evidence'/file).read_text().splitlines():
  row=json.loads(s);original[row['id']]=row['text']
for b in blocks:
 assert hashlib.sha256(original[b['blockId']].encode()).hexdigest()==b['contentHash']
 assert b['reviewStatus'] in ['UNREVIEWED','ASSESSED_SOURCE_ONLY']
 if b['reviewStatus']=='UNREVIEWED':assert b['reviewDate'] is None and b['reviewer'] is None
for p in pages:
 mine=[b for b in blocks if b['pageUrl']==p['url']]
 assert sum(b['layer']=='SOURCE' for b in mine)==int(p['sourceBlocks'])
 assert sum(b['layer']=='INITIAL_HTML' for b in mine)==int(p['initialHtmlBlocks'])
 assert sum(b['reviewStatus']=='ASSESSED_SOURCE_ONLY' for b in mine)==int(p['individuallyAssessedSourceBlocks'])
assert sum(b['reviewStatus']=='ASSESSED_SOURCE_ONLY' for b in blocks)==counts['sourceBlocksAssessed']
def full_gate(items):
 return len(items)==counts['totalInventoriedBlockRecords'] and all(b['finalVerifiedStatus']=='FULLY_VERIFIED' for b in items)
assert not full_gate(blocks),'Incomplete evidence must never certify readiness'
assert not full_gate(blocks[:-1]),'Missing-block negative control must fail'
result={'integrity':'PASS','hashMismatches':0,'perPageCountMismatches':0,'fullEditorialCompletionGate':'FAIL_EXPECTED_INCOMPLETE','missingBlockNegativeControl':'FAIL_EXPECTED','notPolicyApproval':True}
(P/'VALIDATION.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
