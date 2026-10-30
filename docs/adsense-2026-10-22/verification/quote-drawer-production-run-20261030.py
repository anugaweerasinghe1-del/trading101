from pathlib import Path
import subprocess,time,socket
s=Path('/workspace/scratch/tradehq-audit');profile=str(s/'quote-drawer-production-profile-20261030');port='9255';sha='ad86b30c6877cafe9ffcc47aa3dd8c117e38bef9'
def start():
 log=open(s/'learning-scope-browser.log','a');p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
 for i in range(80):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):return p
  except OSError:time.sleep(.1)
 raise RuntimeError('browser start')
for theme in ['light','dark']:
 p=start();subprocess.run(['node',str(s/'followup-readability-theme.mjs'),'https://www.thetradehq.com',port,theme],check=True);p.wait(timeout=10);p=start()
 try:subprocess.run(['node',str(s/'quote-drawer-pointer-20261030.mjs'),'https://www.thetradehq.com',sha,'production',port,theme],check=True)
 finally:p.terminate();p.wait(timeout=10)
