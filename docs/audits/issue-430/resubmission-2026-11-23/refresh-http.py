"""Finite known route reconciliation; anonymous GET only, profile bodies discarded."""
import csv,json,re,subprocess,tempfile,hashlib,datetime,concurrent.futures
from pathlib import Path
from urllib.parse import quote,urljoin,urlsplit,urlunsplit
from lxml import html
P=Path(__file__).resolve().parent;ROOT=P.parents[3];E=P/'evidence';OLD=P.parent/'completion-2026-11-22';DOMAIN='https://www.thetradehq.com'
def mask(u):return DOMAIN+'/trader/[public-profile-'+hashlib.sha256(u.encode()).hexdigest()[:16]+']'
# Existing public handles are only transient lookup inputs; never publish identities/bodies.
prior=json.loads((OLD/'.cache/public-profile-lookups.json').read_text());mapping={mask(DOMAIN+'/trader/'+quote(x['username'])):DOMAIN+'/trader/'+quote(x['username']) for x in prior}
raw=subprocess.check_output(['curl','-fsS','--max-time','30','https://cbdktpjgczhthflspqjb.supabase.co/rest/v1/profiles?select=username&is_public=eq.true&limit=1000','-H','apikey: sb_publishable_lmCNfCn4tsB1tD604M49Xw_n4zum_Nr']);current=json.loads(raw);assert len(current)<1000
currentmap={mask(DOMAIN+'/trader/'+quote(x['username'])):DOMAIN+'/trader/'+quote(x['username']) for x in current if x.get('username')};mapping.update(currentmap)
(P/'.cache/public-profile-lookups.json').write_bytes(raw)
old=list(csv.DictReader((OLD/'CURRENT-URL-INVENTORY.csv').open()));urls=set(r['url'] for r in old)|set(json.loads((E/'publisher-urls.json').read_text()))|set(currentmap)|{DOMAIN+'/robots.txt',DOMAIN+'/sitemap.xml',DOMAIN+'/course-sitemap.xml',DOMAIN+'/ads.txt',DOMAIN+'/media-credits.json',DOMAIN+'/api/contact',DOMAIN+'/api/fx-reference'}
(E/'profile-reconciliation.json').write_text(json.dumps({'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'currentPublicProfiles':len(currentmap),'historicalPublicProfiles':len(mapping),'privateProfilesRead':False,'profileBodiesStored':False},indent=2)+'\n')
def get(report):
 profile='[public-profile-' in report;url=mapping[report] if profile else report
 with tempfile.TemporaryDirectory() as tmp:
  h=Path(tmp)/'headers';b=Path(tmp)/'body';q=subprocess.run(['curl','-sS','-L','--max-time','25','--max-filesize','10000000','-D',str(h),'-o','/dev/null' if profile else str(b),'-w','%{http_code}\n%{url_effective}',url],capture_output=True,text=True,errors='replace');v=q.stdout.splitlines();status=int(v[0]) if v and v[0].isdigit() else None;chain=[]
  for chunk in h.read_text(errors='replace').split('\n\n'):
   codes=re.findall(r'^HTTP/[\d.]+ (\d+)',chunk,re.M)
   if not codes or 'Connection established' in chunk:continue
   loc=re.search(r'^location:\s*(.+)',chunk,re.I|re.M);chain.append({'status':int(codes[-1]),'location':'PROFILE_IDENTITY_OMITTED' if profile and loc else loc.group(1).strip() if loc else ''})
  r={'url':report,'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'status':status,'redirectChain':chain,'finalUrl':report if profile else v[-1] if v else '', 'scope':'GET status only; body discarded; not UGC review' if profile else 'Current initial response; not hydrated UX','profile':profile};links=[]
  if not profile and b.exists():
   data=b.read_bytes();r['responseSha256']=hashlib.sha256(data).hexdigest()
   if b'<html' in data[:2000].lower() or b'<!doctype html' in data[:2000].lower():
    try:
     t=html.fromstring(data)
     for field,xpath in [('title','//title/text()'),('canonical','//link[@rel="canonical"]/@href'),('robots','//meta[@name="robots"]/@content'),('description','//meta[@name="description"]/@content'),('h1','//h1//text()')]:r[field]=' '.join(t.xpath(xpath))
     for x in t.xpath('//a/@href'):
      u=urlsplit(urljoin(url,x))
      if u.netloc=='www.thetradehq.com' and u.scheme=='https' and not u.path.startswith('/trader/') and not u.query:links.append(urlunsplit((u.scheme,u.netloc,u.path or '/','','')))
    except Exception:r['parse']='HTML_PARSE_FAILED'
   else:r['parse']='NON_HTML'
  return r,links
rows=[];seen=set()
for iteration in range(5):
 pending=sorted(urls-seen)
 if not pending:break
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for r,links in pool.map(get,pending):rows.append(r);urls.update(links);seen.add(r['url'])
 print('Round',iteration+1,'responses',len(rows),'new',len(urls-seen),flush=True)
assert not urls-seen,'Unfinished navigation frontier'
(E/'current-http.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS finite navigation frontier closed:',len(rows),'responses',flush=True)
