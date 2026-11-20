from pathlib import Path
import json,urllib.request,datetime,hashlib,concurrent.futures,re,html
p=Path('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-011');b=json.loads((p/'published-bank.json').read_text());urls=sorted({s['url']for e in b['exercises']for s in e['sources']});out=p/'references';out.mkdir(exist_ok=True)
def get(pair):
 i,url=pair;at=datetime.datetime.now(datetime.timezone.utc).isoformat()
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=30) as r:raw=r.read();status=r.status;final=r.url
  f=f'primary-{i+1}.html';(out/f).write_bytes(raw);title=re.search(r'<title[^>]*>(.*?)</title>',raw.decode(errors='replace'),re.S|re.I)
  return dict(url=url,finalURL=final,http=status,retrievedAtUTC=at,file=f,sha256=hashlib.sha256(raw).hexdigest(),title=html.unescape(title.group(1).strip())if title else None)
 except Exception as e:return dict(url=url,retrievedAtUTC=at,accessLimitation=type(e).__name__+': '+str(e)[:130],classification='UNRESOLVED ACCESS; not a confirmed broken link or policy issue')
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(get,enumerate(urls)))
(out/'REGISTRY.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows,indent=2))
