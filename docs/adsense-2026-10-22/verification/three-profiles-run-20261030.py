from pathlib import Path
import subprocess,time,socket,json
s=Path('/workspace/scratch/tradehq-audit');profile=str(s/'three-profiles-profile-20261030');port='9258';sha='ad86b30c6877cafe9ffcc47aa3dd8c117e38bef9';log=open(s/'three-profiles-browser-20261030.log','a')
def start():
 p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
 for i in range(80):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):return p
  except OSError:time.sleep(.1)
 raise RuntimeError('browser start')
for theme in ['dark','light']:
 assert subprocess.check_output(['gh','api','repos/anugaweerasinghe1-del/trading101/branches/main','--jq','.commit.sha'],text=True).strip()==sha
 p=start();subprocess.run(['node',str(s/'pr261-prepare-theme-profile.mjs'),'https://www.thetradehq.com',port,theme],check=True);p.wait(timeout=10);p=start()
 try:subprocess.run(['node',str(s/('three-profiles-'+('default' if theme=='dark' else 'light')+'-20261030.mjs')),str(s/'three-profiles-20261030.json'),sha,'three-profiles-'+theme+'-20261030'],check=True)
 finally:p.terminate();p.wait(timeout=10)
 assert subprocess.check_output(['gh','api','repos/anugaweerasinghe1-del/trading101/branches/main','--jq','.commit.sha'],text=True).strip()==sha
