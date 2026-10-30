from pathlib import Path
import subprocess,time,socket,json
s=Path('/workspace/scratch/tradehq-audit');profile=str(s/'full-light-risk-courses-profile-20261030');port='9234';sha='4fad776ec28409929eb08f47e4734c229e79adb8'
# Require native exact-current production and unchanged main; no new release during collection.
r=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');d=json.loads((r/'PR266-PRODUCTION-PROVIDERS.json').read_text());assert d['mergeSHA']==sha and d['outcome']=='PASS';assert subprocess.check_output(['gh','api','repos/anugaweerasinghe1-del/trading101/branches/main','--jq','.commit.sha'],text=True).strip()==sha
log=open(s/'full-light-next-browser.log','a')
def start():
 p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
 for i in range(80):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):return p
  except OSError:time.sleep(.1)
 raise RuntimeError('browser start')
p=start();subprocess.run(['node',str(s/'pr261-prepare-theme-profile.mjs'),'https://www.thetradehq.com',port,'light'],check=True);p.wait(timeout=10);p=start()
try:subprocess.run(['node',str(s/'fullpage-light-current-9234.mjs'),str(s/'full-light-risk-courses-paths-20261030.json'),sha,'light-risk-courses-20261030'],check=True)
finally:p.terminate();p.wait(timeout=10)
assert subprocess.check_output(['gh','api','repos/anugaweerasinghe1-del/trading101/branches/main','--jq','.commit.sha'],text=True).strip()==sha
