from pathlib import Path
import subprocess,time,socket,sys
s=Path('/workspace/scratch/tradehq-audit');sha,origin,stage=sys.argv[1:4];profile=str(s/('worksheet-'+stage+'-profile-20261030'));port='9243';log=open(s/'learning-scope-browser.log','a')
def start():
 p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
 for i in range(80):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):return p
  except OSError:time.sleep(.1)
 raise RuntimeError('browser start')
for theme in ['light','dark']:
 p=start();subprocess.run(['node',str(s/'followup-readability-theme.mjs'),origin,port,theme],check=True);p.wait(timeout=10);p=start()
 try:subprocess.run(['node',str(s/'worksheet-scope-browser-20261030.mjs'),sha,port,theme,origin,stage],check=True)
 finally:p.terminate();p.wait(timeout=10)
