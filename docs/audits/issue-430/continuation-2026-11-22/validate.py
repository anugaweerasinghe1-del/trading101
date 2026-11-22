"""Check audit record integrity and honest status accounting, not editorial correctness."""
import csv,json,collections,hashlib
from pathlib import Path
p=Path(__file__).resolve().parent
required=['CURRENT-URL-INVENTORY.csv','EDITORIAL-PAGE-COVERAGE.csv','EDITORIAL-BLOCK-EVIDENCE.jsonl','POLICY-REQUIREMENTS-MATRIX.md','SOURCE-AND-MEDIA-LEDGER.csv','DEFECT-LEDGER.csv','RELEASE-VERIFICATION.md','FINAL-ADSENSE-READINESS-REPORT.md','CHECKPOINT.md']
for f in required:assert (p/f).is_file(),f
rows=[json.loads(s) for s in (p/'EDITORIAL-BLOCK-EVIDENCE.jsonl').read_text().splitlines()]
assert len({(r['layer'],r['blockId']) for r in rows})==len(rows)
assert len(rows)==14933
assert sum(r['reviewStatus']=='ASSESSED_SOURCE_ONLY' for r in rows)==6098
assert not any(r['finalVerifiedStatus']=='FULLY_VERIFIED' for r in rows)
for r in map(json.loads,(p/'evidence/candidate-source-inventory/editorial-block-evidence.jsonl').read_text().splitlines()):assert hashlib.sha256(r['text'].encode()).hexdigest()==r['sha256']
with (p/'EDITORIAL-PAGE-COVERAGE.csv').open() as f:pages=list(csv.DictReader(f))
assert len(pages)==163 and sum(int(r['sourceBlocksRead']) for r in pages)==6098
with (p/'CURRENT-URL-INVENTORY.csv').open() as f:assert len(list(csv.DictReader(f)))==481
with (p/'DEFECT-LEDGER.csv').open() as f:ledger=list(csv.DictReader(f))
latest={r['id']:r for r in ledger}
assert len(latest)==14
assert sum(r['classification']=='CONFIRMED POLICY-RELEVANT DEFECT' for r in latest.values())==0
assert len([r for r in latest.values() if r['classification']=='EXTERNAL GATE'])==6
policy=(p/'POLICY-REQUIREMENTS-MATRIX.md').read_text()
assert len([l for l in policy.splitlines() if l.startswith('| P')])==25
if (p/'evidence/production-verification.json').exists():
 release=json.loads((p/'evidence/production-verification.json').read_text());assert release['sha']=='810d1a975b138331d1a55f1760fb7474ea1295a4'
 browser=json.loads((p/'evidence/production-browser.json').read_text());assert len(browser)==6
 assert all(r['expectedPass'] and not r['attemptedAdRequests'] and not r['runtimeErrors'] for r in browser)
print(json.dumps({'integrity':'PASS','substantiveComplianceAttestation':False,'records':len(rows),'sourceAssessed':6098,'knownUnreviewed':8835,'fullyVerified':0,'findings':len(latest),'note':'Integrity checks cannot confer editorial, rights, policy or accessibility clearance.'}))
