from pathlib import Path
import subprocess,time,socket,json
s=Path('/workspace/scratch/tradehq-audit');r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');sha='1dacd0ac9a986546b9480476a084b9049b56e036';origin='https://www.thetradehq.com';stage='production-fresh-theme';port='9232';profile=str(s/'pr261-production-fresh-profile-20261029');receipt=r/'PR261-PRODUCTION-PROVIDERS.json'
for i in range(120):
 if receipt.exists():
  d=json.loads(receipt.read_text())
  if d['mergeSHA']==sha and d['outcome']=='PASS':break
 time.sleep(10)
else:raise RuntimeError('Native exact-main production receipt unavailable; no browser acceptance')
log=open(s/'pr261-production-fresh-browser.log','a')
def start():
 p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
 for i in range(80):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):return p
  except OSError:time.sleep(.1)
 raise RuntimeError('Production browser startup')
p=start();subprocess.run(['node',str(s/'pr261-prepare-theme-profile.mjs'),origin,port,'light'],check=True);p.wait(timeout=10);p=start();subprocess.run(['node',str(s/'light-surface-fresh-theme-browser.mjs'),origin,sha,stage,port,'light'],check=True);subprocess.run(['python',str(s/'finish-fresh-theme-verification.py'),origin,stage,port,profile,sha],check=True);subprocess.run(['python',str(s/'surface-review-contacts.py'),stage],check=True);print('Production affected collection complete; personal review required',flush=True)
