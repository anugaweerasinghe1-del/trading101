from pathlib import Path
import subprocess,json,sys,time,socket
origin,stage,port,profile,sha=sys.argv[1:];scratch=Path('/workspace/scratch/tradehq-audit');root=Path('/workspace/trading101/docs/adsense-2026-10-22/evidence');receipt=root/('REVIEWED-LIGHT-SURFACES-'+stage.upper()+'-BROWSER.json')
for i in range(120):
 if receipt.exists():
  d=json.loads(receipt.read_text())
  if len(d['rows'])==25 and d.get('failure')is None and d.get('outcome')=='INCOMPLETE':break
 time.sleep(5)
else:raise RuntimeError('Light phase not complete; no browser restart')
assert d['sha']==sha and d['origin']==origin and not d['runtimeErrors'];print(stage,'25 light states collected',flush=True)
subprocess.run(['node',str(scratch/'light-surface-fresh-theme-controls.mjs'),origin,sha,stage+'-light',port,'light'],check=True)
subprocess.run(['node',str(scratch/'pr261-prepare-theme-profile.mjs'),origin,port,'dark'],check=True)
for i in range(40):
 try:
  with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):time.sleep(.25)
 except OSError:break
log=open(scratch/(stage+'-dark-browser.log'),'w');subprocess.Popen([str(scratch/'chrome156/chrome-headless-shell-linux64/chrome-headless-shell'),'--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port='+port,'--proxy-server=http://proxy:8080','--user-data-dir='+profile,'about:blank'],stdout=log,stderr=log)
for i in range(40):
 try:
  with socket.create_connection(('127.0.0.1',int(port)),timeout=.2):break
 except OSError:time.sleep(.25)
print(stage,'fresh dark process started',flush=True)
subprocess.run(['node',str(scratch/'light-surface-fresh-theme-browser.mjs'),origin,sha,stage,port,'dark'],check=True)
subprocess.run(['node',str(scratch/'light-surface-fresh-theme-controls.mjs'),origin,sha,stage+'-dark',port,'dark'],check=True)
print(stage,'50 states and38 controls collected; personal review required',flush=True)
