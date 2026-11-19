from pathlib import Path
import json,hashlib,datetime,shutil
s=Path('/tmp/tradehq-audit-1118');p=Path('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-010')
read=lambda f:json.loads(f.read_text());stamp=lambda x:datetime.datetime.fromisoformat(x.replace('Z','+00:00'))
merge=read(s/'merge482.json');native=read(s/'native482.json');checks=read(s/'pr482-checks.json')
assert native['activeProduction']['sha']==merge['mergeSHA'] and native['activeProduction']['status']=='success' and native['activeProduction']['environment']=='production' and native['activeProduction']['branch']=='main'
assert len(checks)==5 and all(x['head_sha']==merge['headSHA'] and x['conclusion']=='success' for x in checks)
files=['production482-final-scenario-targets.json','production482-final-final-copy-journal.json','production482-final-price-zero.json'];evidence=[]
for name in files:
 f=s/'portfolio'/name;v=read(f);assert len(v['rows']) in [2,4];times=[x['atUTC'] for x in v['rows']];assert all(stamp(t)>stamp(native['observedAt']) for t in times);shutil.copyfile(f,p/name);evidence.append(dict(file=name,sha256=hashlib.sha256(f.read_bytes()).hexdigest(),observedAtUTC=times))
for name in ['exact-preview482-scenario-targets.json','exact-preview482-final-final-copy-journal.json','exact-preview482-price-zero.json']:shutil.copyfile(s/'portfolio'/name,p/name)
receipt=dict(**merge,native=native,requiredChecks=checks,headAndMergeTreeSHA='0a3ac27768a1de4352a080dfa525ac64a53bdd52',liveEvidence=evidence,liveRereadAtUTC=max(t for x in evidence for t in x['observedAtUTC']),nativeReceiptSourceURL=f"https://github.com/anugaweerasinghe1-del/trading101/actions/runs/{native['sourceGitHubRun']}/job/{native['sourceGitHubJob']}",status='RELEASE-AND-RUNTIME-VERIFIED; substantive after-change judgments recorded separately',findings=[f'STRICT-PORTFOLIO-{i:03}' for i in range(8,12)],qualityRisks=['STRICT-PORTFOLIO-RISK-001','STRICT-PORTFOLIO-RISK-002'],scope='Actual custom-domain guest UI after native API observation. All orders/files are disposable local practice; quotes and notification APIs are isolated as stated. Private account copy labels retain unchanged tested source and loopback fixtures, not private production execution.')
(p/'RELEASE-482.json').write_text(json.dumps(receipt,indent=2)+'\n');print('Release receipt written; editorial closure is separate')
