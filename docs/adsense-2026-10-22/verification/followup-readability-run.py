from pathlib import Path
import subprocess,time,socket
s=Path('/workspace/scratch/tradehq-audit');chrome=str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell');profile=str(s/'followup-readability-profile-20261029');port='9230'
def start():
 log=open(s/'followup-readability-browser.log','a');p=subprocess.Popen([chrome,'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
 for i in range(80):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):return p
  except OSError:time.sleep(.1)
 raise RuntimeError('browser startup')
def stop(p):
 p.terminate();p.wait(timeout=10)
for theme in ['light','dark']:
 p=start();subprocess.run(['node',str(s/'followup-readability-theme.mjs'),'http://127.0.0.1:4187',port,theme],check=True);p.wait(timeout=10);p=start()
 try:
  for origin,sha,stage in [('http://127.0.0.1:4186','de9c05d5d0ccb3951561c48df5a7a6e25c9e1bd7','before'),('http://127.0.0.1:4187',subprocess.check_output(['git','rev-parse','HEAD'],cwd='/workspace/trading101-niche-fix',text=True).strip(),'after')]:
   # Each origin has its own legitimate theme preference.
   subprocess.run(['node',str(s/'followup-readability-theme.mjs'),origin,port,theme],check=True);p.wait(timeout=10);p=start()
   subprocess.run(['node',str(s/'followup-readability-local.mjs'),origin,sha,stage,port,theme],check=True)
 finally:stop(p)
