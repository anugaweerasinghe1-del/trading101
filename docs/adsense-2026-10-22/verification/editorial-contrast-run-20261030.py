from pathlib import Path
import subprocess,time,socket,sys,os
port=sys.argv[4]if len(sys.argv)>4 else'9258'
s=Path('/workspace/scratch/tradehq-audit');sha,origin,stage=sys.argv[1:4];log=open(s/'restored-guest-browser-20261030.log','a');p=subprocess.Popen([str(s/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+str(s/('editorial-contrast-'+stage+'-profile-20261030')),'about:blank'],stdout=log,stderr=log)
try:
 for i in range(100):
  try:
   with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):break
  except OSError:time.sleep(.1)
 subprocess.run(['node',str(s/'editorial-contrast-20261030.mjs'),sha,origin,stage],check=True,env={**os.environ,'AUDIT_CDP_PORT':port})
finally:p.terminate();p.wait(timeout=10)
