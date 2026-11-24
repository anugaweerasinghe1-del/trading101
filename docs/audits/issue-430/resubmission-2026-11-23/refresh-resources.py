"""Run only after matching protected release: all current public non-HTML build files."""
import pathlib,json,subprocess,hashlib,tempfile,concurrent.futures,datetime,re
P=pathlib.Path(__file__).resolve().parent;files=[p for p in pathlib.Path('dist').rglob('*') if p.is_file() and p.suffix!='.html' and p.name not in ['_headers','_redirects','_routes.json']]
def get(p):
 url='https://www.thetradehq.com/'+str(p.relative_to('dist'))
 with tempfile.TemporaryDirectory() as td:
  h=pathlib.Path(td)/'headers';b=pathlib.Path(td)/'body';r=subprocess.run(['curl','-sS','--max-time','30','-D',str(h),'-o',str(b),'-w','%{http_code}',url],capture_output=True,text=True);data=b.read_bytes() if b.exists() else b'';actual=hashlib.sha256(data).hexdigest();expected=hashlib.sha256(p.read_bytes()).hexdigest()
  return {'url':url,'status':int(r.stdout) if r.stdout.isdigit() else None,'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'responseSha256':actual,'expectedSha256':expected,'bytes':len(data),'exactBytesMatch':actual==expected,'scope':'Public build resource only; not publisher-body or hydrated UX review','contentType':next((s.split(':',1)[1].strip() for s in h.read_text().splitlines() if s.lower().startswith('content-type:')),''),'robots':next((s.split(':',1)[1].strip() for s in h.read_text().splitlines() if s.lower().startswith('x-robots-tag:')),'')}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(get,files))
(P/'evidence/current-resources.json').write_text(json.dumps(rows,indent=2)+'\n');bad=[r for r in rows if r['status']!=200 or not r['exactBytesMatch']];print('Public build resources',len(rows),'nonmatching',len(bad));print([(r['url'],r['status']) for r in bad]);assert not bad
