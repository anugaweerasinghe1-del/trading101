from pathlib import Path
import tempfile,shutil,subprocess,json
p=Path('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-010');script='/tmp/tradehq-audit-1118/p10-validate-ledger.py';out=[]
with tempfile.TemporaryDirectory() as td:
 t=Path(td)/'page';shutil.copytree(p,t)
 ledger=json.loads((t/'block-ledger.json').read_text());release=json.loads((t/'RELEASE-482.json').read_text());cross=json.loads((t/'SOURCE-STATE-CROSSWALK.json').read_text())
 for name in ['complete baseline','missing reviewed group','changed reviewed text','pending second pass','missing source mapping','wrong native SHA']:
  r=json.loads(json.dumps(ledger));rel=json.loads(json.dumps(release));cw=json.loads(json.dumps(cross))
  if name=='missing reviewed group':r.pop(0)
  if name=='changed reviewed text':r[0]['text']='tampered control text'
  if name=='pending second pass':r[0]['pass2']['status']='PENDING'
  if name=='missing source mapping':cw['components'][0]['sourceExpressions'].pop()
  if name=='wrong native SHA':rel['native']['activeProduction']['sha']='0'*40
  for f,v in [('block-ledger.json',r),('RELEASE-482.json',rel),('SOURCE-STATE-CROSSWALK.json',cw)]: (t/f).write_text(json.dumps(v))
  proc=subprocess.run(['python',script,str(t),'--require-closed'],capture_output=True,text=True)
  expected=0 if name=='complete baseline' else 1
  assert proc.returncode==expected,(name,proc.stdout,proc.stderr)
  out.append(dict(case=name,accepted=proc.returncode==0,expected=expected==0))
(p/'COVERAGE-NEGATIVE-CONTROLS.json').write_text(json.dumps(dict(scope='Record-integrity and release-gate negative controls; no editorial judgment is automated.',results=out),indent=2)+'\n');print(json.dumps(out))
