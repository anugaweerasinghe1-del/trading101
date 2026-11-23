from pathlib import Path
import json,subprocess,concurrent.futures,re,hashlib,datetime
from lxml import html
P=Path(__file__).resolve().parent;C=P/'.cache/issuers';rows=json.loads((P/'evidence/issuer-filing-discovery.json').read_text())
terms={'aapl':['iPhone','Services','Mac'], 'msft':['Microsoft 365','Azure'], 'googl':['Google Services','Google Cloud','Other Bets'], 'amzn':['online stores','AWS','advertising'], 'nvda':['GPU','Data Center','Gaming'], 'tsla':['energy generation and storage','automotive'], 'meta':['Family of Apps','Reality Labs']}
def get(r):
 q=subprocess.run(['curl','-LsS','--max-time','30','--max-filesize','20000000','-w','\n%{http_code}',r['url']],capture_output=True);parts=q.stdout.rsplit(b'\n',1);data=parts[0];status=int(parts[-1]) if parts[-1].isdigit() else None
 try:
  t=html.fromstring(re.sub(r'^<\?xml[^>]*\?>', '', data.decode('utf8','replace')))
  for n in t.xpath('//script|//style|//*[local-name()="hidden"]'):n.drop_tree()
  text=' '.join(t.text_content().split())
 except Exception:text=''
 (C/(r['symbol']+'-10k.html')).write_bytes(data); (C/(r['symbol']+'-10k.txt')).write_text(text);sections=[]
 for term in terms[r['symbol']]:
  hits=list(re.finditer(re.escape(term),text,re.I));match=next((m for m in hits if m.start()>2500),hits[0] if hits else None);i=match.start() if match else -1
  sections.append({'term':term,'found':bool(match),'position':i,'excerptForReview':text[max(0,i-120):i+800] if match else ''})
 return {**r,'status':status,'sha256':hashlib.sha256(data).hexdigest(),'words':len(text.split()),'sections':sections,'checkedAt':datetime.datetime.now(datetime.UTC).isoformat()}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:r=list(pool.map(get,rows))
(P/'.cache/issuer-filing-sections-for-review.json').write_text(json.dumps(r,indent=2));print([(x['symbol'],x['status'],x['words']) for x in r])
