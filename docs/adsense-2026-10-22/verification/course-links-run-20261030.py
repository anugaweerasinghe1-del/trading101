from pathlib import Path
import subprocess,time,socket,sys
s=Path('/workspace/scratch/tradehq-audit');sha,origin,stage=sys.argv[1:4];log=open(s/'restored-guest-browser-20261030.log','a');p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=9258','--proxy-server=http://proxy:8080','--user-data-dir='+str(s/('course-link-'+stage+'-profile-20261030')),'about:blank'],stdout=log,stderr=log)
try:
 for i in range(100):
  try:
   with socket.create_connection(('127.0.0.1',9258),timeout=.2):break
  except OSError:time.sleep(.1)
 subprocess.run(['node',str(s/'course-links-contrast-20261030.mjs'),sha,origin,stage],check=True)
finally:p.terminate();p.wait(timeout=10)
