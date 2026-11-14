#!/usr/bin/env python3
"""Checks the evidence records, not the truth of editorial judgments."""
import csv,gzip,json,hashlib,collections,pathlib,sys
root=pathlib.Path(__file__).resolve().parent
canon=list(csv.DictReader(open(root/'editorial-page-coverage.csv')));pages=list(csv.DictReader(open(root/'all-accessible-page-coverage.csv')))
assert len(canon)==163 and len({r['url'] for r in canon})==163
assert len(pages)==480 and len({r['url'] for r in pages})==480
assert {r['url'] for r in canon}<={r['url'] for r in pages}
counts=collections.Counter();seen=set();reviewed1=collections.Counter();reviewed2=collections.Counter()
with gzip.open(root/'editorial-block-records.jsonl.gz','rt') as f:
 for line in f:
  b=json.loads(line);assert b['block_id'] not in seen,b['block_id'];seen.add(b['block_id'])
  assert hashlib.sha256(b['text'].encode()).hexdigest()==b['text_sha256']
  assert b['pass1']=='REVIEWED' and b['pass2']=='REVIEWED',b['block_id']
  assert b['risk_flag'] and b['review_evidence'] and b['assessment_reference']
  if b['review_mode'] in ['fresh-identical-text-reference','fresh-parameterized-template']:assert b['fresh_reference_block']
  counts[b['url']]+=1;reviewed1[b['url']]+=1;reviewed2[b['url']]+=1
for r in pages:
 expected=int(r['extracted_blocks']);assert expected>0
 assert expected==counts[r['url']]==int(r['pass1_reviewed_blocks'])==int(r['pass2_reviewed_blocks']),r['url']
 assert r['final_status'] in ['PASS','FIXED-RECHECKED','HUMAN-REVIEW','BLOCKED'],r
 assert r['content_sha256'] and r['evidence'] and r['page_review_notes']
# The release gate must verify each scoped fix; a pending or failed run cannot satisfy it.
release=json.load(open(root/'release-evidence.json'));assert release['all_confirmed_fixes_rechecked'] is True
assert len(release['fixed_issue_ids'])==16
for loop in release['loops']:
 assert loop['exact_head_checks_passed'] and loop['protected_merge'] and loop['live_recheck_passed']
 assert loop['native_production']['sha']==loop['merge_sha']
 assert loop['native_production']['environment']=='production' and loop['native_production']['status']=='success'
# Negative control: removing a reviewed row must break the extracted/reviewed equality.
if '--self-test' in sys.argv:
 victim=next(iter(counts));changed=counts.copy();changed[victim]-=1
 assert any(int(r['extracted_blocks'])!=changed[r['url']] for r in pages)
 print('PASS negative control: missing block makes the coverage equality fail')
print('PASS',len(canon),'canonical URLs;',len(pages),'all URLs;',len(seen),'block records; both passes reconciled;16 release-verified fixes')
print('Owner-review and inaccessible checks remain explicit; this is not Google approval.')
