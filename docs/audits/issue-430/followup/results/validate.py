from pathlib import Path
import json,hashlib,zipfile
r=Path(__file__).resolve().parent
for line in (r/'SHA256SUMS').read_text().splitlines():
 h,n=line.split('  ',1);assert hashlib.sha256((r/n).read_bytes()).hexdigest()==h,n
for suffix,count in [('content',68),('native',34),('interactive',11),('metadata',177),('mobile-intros-metadata',5)]:
 d=json.loads((r/f'live-{suffix}.json').read_text());assert len(d['rows'])==count and not d['errors'],suffix
release=json.loads((r/'release-evidence.json').read_text());pr=json.loads((r/'pr438-before-merge.json').read_text());native=json.loads((r/'native-production-receipt.json').read_text())
assert pr['headRefOid']==release['headSHA']
for name in release['exactHeadRequiredChecks']:assert any(c.get('name')==name and c.get('conclusion')=='SUCCESS' for c in pr['statusCheckRollup'])
a=native['activeProduction'];assert a['sha']==release['mergeSHA'] and a['status']=='success' and a['environment']=='production' and a['branch']=='main'
p=json.loads((r/'proposal-dispositions.json').read_text());assert len(p)==19;assert sum(e['followup_status']=='PUBLIC-FIXED-RECHECKED' for e in p)==18
assert release['databaseWritesApplied'] is False
assert len(release['loops'])==2
for loop in release['loops']:
 check=json.loads((r/loop['checksFile']).read_text());assert check['headRefOid']==loop['headSHA']
 for name in release['exactHeadRequiredChecks']:assert any(c.get('name')==name and c.get('conclusion')=='SUCCESS' for c in check['statusCheckRollup'])
 assert loop['nativeProduction']['sha']==loop['mergeSHA'] and loop['nativeProduction']['status']=='success' and loop['nativeProduction']['branch']=='main' and loop['nativeProduction']['environment']=='production'
with zipfile.ZipFile(r/'captures.zip') as z:
 for e in json.loads(z.read('MANIFEST.json')):assert hashlib.sha256(z.read(e['file'])).hexdigest()==e['sha256']
print('PASS exact-head checks, protected/native release identity, 68 runtime +34 native +11 interactive +177 metadata +5 mobile intro checks, 18 implemented proposals/one prepared source gate, and all package/capture hashes')
