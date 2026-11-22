"""Read-only current-release refresh of known cohort; discard all profile bodies."""
import csv,json,re,subprocess,tempfile,hashlib,datetime,concurrent.futures
from pathlib import Path
from lxml import html
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
urls=list(csv.DictReader((P/'CURRENT-URL-INVENTORY.csv').open()))
historical=list(csv.DictReader((ROOT/'docs/audits/issue-430/sequential-2026-11-16/page-queue.csv').open()))
mapping={'https://www.thetradehq.com/trader/[public-profile-'+hashlib.sha256(r['url'].encode()).hexdigest()[:16]+']':r['url'] for r in historical if '/trader/' in r['url'] and not r['url'].endswith('/trader/me')}
def get(row):
 report=row['url'];profile='[public-profile-' in report;url=mapping[report] if profile else report
 with tempfile.TemporaryDirectory(prefix='tradehq-bounded-http-') as tmp:
  headers=Path(tmp)/'h';body=Path(tmp)/'b'
  q=subprocess.run(['curl','-sS','-L','--max-time','25','-D',str(headers),'-o','/dev/null' if profile else str(body),'-w','%{http_code}\n%{url_effective}',url],capture_output=True,text=True,errors='replace');parts=q.stdout.splitlines();status=int(parts[0]) if parts and parts[0].isdigit() else None;chain=[]
  for chunk in headers.read_text(errors='replace').split('\n\n'):
   codes=re.findall(r'^HTTP/[\d.]+ (\d+)',chunk,re.M)
   if not codes or 'Connection established' in chunk:continue
   location=re.search(r'^location:\s*(.+)',chunk,re.I|re.M);chain.append({'status':int(codes[-1]),'location':'PROFILE_IDENTITY_OMITTED' if profile and location else location.group(1).strip() if location else ''})
  r={'url':report,'status':status,'redirectChain':chain,'finalUrl':report if profile else parts[-1] if parts else '', 'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha':'810d1a975b138331d1a55f1760fb7474ea1295a4','scope':'GET status only; profile body discarded' if profile else 'Initial HTML metadata; not UX or substantive editorial clearance','profile':profile}
  if not profile and body.exists():
   data=body.read_bytes();r['htmlSha256']=hashlib.sha256(data).hexdigest()
   try:
    t=html.fromstring(data)
    for field,xpath in [('title','//title/text()'),('canonical','//link[@rel="canonical"]/@href'),('robots','//meta[@name="robots"]/@content'),('description','//meta[@name="description"]/@content'),('h1','//h1//text()')]:r[field]=' '.join(t.xpath(xpath))
    r['indexable']=status==200 and 'noindex' not in r['robots'].lower()
   except Exception:r['parse']='NOT_HTML'
  return r
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(get,urls))
(P/'evidence/current-release-http.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps({'knownCohort':len(rows),'statuses':{str(s):sum(r['status']==s for r in rows) for s in set(r['status'] for r in rows)},'statusOnlyProfiles':sum(r['profile'] for r in rows),'scope':'Known cohort only; no profile bodies and no scripts, ads or orders executed'}))
