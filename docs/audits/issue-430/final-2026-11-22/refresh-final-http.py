"""Refresh known cohort on corrected release, recording HTTP redirect chains.
Public profile identities are transient lookup inputs; their bodies are discarded.
"""
import csv,json,re,subprocess,tempfile,hashlib,datetime
from pathlib import Path
from lxml import html
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3];E=OUT/'evidence'
urls=[r['url'] for r in csv.DictReader((OUT/'CURRENT-URL-INVENTORY.csv').open())]
historical=list(csv.DictReader((ROOT/'docs/audits/issue-430/sequential-2026-11-16/page-queue.csv').open()))
mapping={'https://www.thetradehq.com/trader/[public-profile-'+hashlib.sha256(r['url'].encode()).hexdigest()[:16]+']':r['url'] for r in historical if '/trader/' in r['url'] and not r['url'].endswith('/trader/me')}
rows=[]
with tempfile.TemporaryDirectory(prefix='tradehq-final-http-') as tmp:
 for index,report_url in enumerate(urls,1):
  profile='[public-profile-' in report_url;url=mapping[report_url] if profile else report_url
  headers=Path(tmp)/'headers';body=Path(tmp)/'body'
  p=subprocess.run(['curl','-sS','-L','--max-time','25','-D',str(headers),'-o','/dev/null' if profile else str(body),'-w','%{http_code}\n%{url_effective}',url],capture_output=True,text=True,errors='replace')
  parts=p.stdout.splitlines();status=int(parts[0]) if parts and parts[0].isdigit() else None
  chain=[]
  for chunk in headers.read_text(errors='replace').split('\n\n'):
   codes=re.findall(r'^HTTP/[\d.]+ (\d+)',chunk,re.M)
   if not codes or 'Connection established' in chunk:continue
   location=re.search(r'^location:\s*(.+)',chunk,re.I|re.M)
   chain.append({'status':int(codes[-1]),'location':'PROFILE_IDENTITY_OMITTED' if profile and location else location.group(1).strip() if location else ''})
  r={'url':report_url,'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'sha':'d932fd9a7e9af3ef17372eb20a6087ca50789b36','status':status,'redirectChain':chain,'finalUrl':report_url if profile else parts[-1] if parts else '', 'scope':'GET status only; no profile body persisted' if profile else 'current initial HTML metadata', 'profile':profile}
  if not profile and body.exists():
   data=body.read_bytes();r['htmlSha256']=hashlib.sha256(data).hexdigest()
   try:
    tree=html.fromstring(data)
    for field,xpath in [('title','//title/text()'),('canonical','//link[@rel="canonical"]/@href'),('robots','//meta[@name="robots"]/@content'),('description','//meta[@name="description"]/@content'),('h1','//h1//text()')]:r[field]=' '.join(tree.xpath(xpath))
    r['indexable']=status==200 and 'noindex' not in r['robots'].lower()
   except Exception:r['parse']='NOT_HTML'
   body.unlink()
  rows.append(r)
  (E/'final-release-http.json').write_text(json.dumps(rows,indent=2)+'\n')
  if index%100==0:print('Refreshed',index,flush=True)
print('Completed',len(rows),'HTTP records; profiles remain status-only',flush=True)
