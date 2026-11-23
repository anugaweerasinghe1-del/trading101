"""GET only; public profile identifiers are transient lookup inputs, never persisted."""
import csv,json,re,subprocess,tempfile,hashlib,datetime,concurrent.futures
from pathlib import Path
from urllib.parse import quote
from lxml import html
P=Path(__file__).resolve().parent;ROOT=P.parents[3];E=P/'evidence'
old=list(csv.DictReader((P.parent/'continuation-2026-11-22/CURRENT-URL-INVENTORY.csv').open()));crawl=json.loads((E/'live-crawl.json').read_text())
historical=list(csv.DictReader((ROOT/'docs/audits/issue-430/sequential-2026-11-16/page-queue.csv').open()))
def mask(u):return 'https://www.thetradehq.com/trader/[public-profile-'+hashlib.sha256(u.encode()).hexdigest()[:16]+']'
mapping={mask(r['url']):r['url'] for r in historical if '/trader/' in r['url'] and not r['url'].endswith('/trader/me')}
current=json.loads((P/'.cache/public-profile-lookups.json').read_text());currentmap={mask('https://www.thetradehq.com/trader/'+quote(r['username'])):'https://www.thetradehq.com/trader/'+quote(r['username']) for r in current};mapping.update(currentmap)
urls=list(dict.fromkeys([r['url'] for r in old]+[r['url'] for r in crawl['pages']]+list(currentmap)))
(E/'profile-reconciliation.json').write_text(json.dumps({'publicProfiles':len(currentmap),'historicalProfiles':len([r for r in old if '[public-profile-' in r['url']]),'currentNotHistorical':len(set(currentmap)-{r['url'] for r in old}),'anonymousPublicSelectOnly':True,'identitiesAndBodiesPersisted':False,'checkedAt':datetime.datetime.now(datetime.UTC).isoformat()},indent=2))
def get(report_url):
 profile='[public-profile-' in report_url;url=mapping[report_url] if profile else report_url
 with tempfile.TemporaryDirectory() as tmp:
  headers=Path(tmp)/'headers';body=Path(tmp)/'body'
  q=subprocess.run(['curl','-sS','-L','--max-time','25','-D',str(headers),'-o','/dev/null' if profile else str(body),'-w','%{http_code}\n%{url_effective}',url],capture_output=True,text=True,errors='replace');parts=q.stdout.splitlines();status=int(parts[0]) if parts and parts[0].isdigit() else None;chain=[]
  for chunk in headers.read_text(errors='replace').split('\n\n'):
   codes=re.findall(r'^HTTP/[\d.]+ (\d+)',chunk,re.M)
   if not codes or 'Connection established' in chunk:continue
   location=re.search(r'^location:\s*(.+)',chunk,re.I|re.M);chain.append({'status':int(codes[-1]),'location':'PROFILE_IDENTITY_OMITTED' if profile and location else location.group(1).strip() if location else ''})
  r={'url':report_url,'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'status':status,'redirectChain':chain,'finalUrl':report_url if profile else parts[-1] if parts else '', 'scope':'GET status only; no profile body persisted' if profile else 'current initial HTML metadata', 'profile':profile}
  if not profile and body.exists():
   data=body.read_bytes();r['htmlSha256']=hashlib.sha256(data).hexdigest()
   try:
    tree=html.fromstring(data)
    for field,xpath in [('title','//title/text()'),('canonical','//link[@rel="canonical"]/@href'),('robots','//meta[@name="robots"]/@content'),('description','//meta[@name="description"]/@content'),('h1','//h1//text()')]:r[field]=' '.join(tree.xpath(xpath))
    r['indexable']=status==200 and 'noindex' not in r['robots'].lower()
   except Exception:r['parse']='NOT_HTML'
  return r
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(get,urls))
 (E/'current-http.json').write_text(json.dumps(rows,indent=2)+'\n');print('Completed',len(rows),'HTTP records;',sum(r['profile'] for r in rows),'profile status-only; statuses', {s:sum(r['status']==s for r in rows) for s in set(r['status'] for r in rows)})
