import json,pathlib,datetime,urllib.request,hashlib
from html.parser import HTMLParser
class MainText(HTMLParser):
 def __init__(self):super().__init__();self.in_main=False;self.in_title=False;self.skip=0;self.parts=[];self.title=[]
 def handle_starttag(self,tag,attrs):
  if tag=='body':self.in_main=True
  if tag=='title':self.in_title=True
  if tag in ['script','style']:self.skip+=1
 def handle_endtag(self,tag):
  if tag=='body':self.in_main=False
  if tag=='title':self.in_title=False
  if tag in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,data):
  if self.in_main and not self.skip and data.strip():self.parts.append(data.strip())
  if self.in_title and data.strip():self.title.append(data.strip())
r=pathlib.Path('/workspace/trading101/docs/adsense-2026-10-22');out=r/'evidence/foundation-primary-20261030';out.mkdir(exist_ok=True)
urls={'https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks':'SEC: stocks','https://www.investor.gov/introduction-investing/investing-basics/glossary/single-stock-etfs':'SEC: single-stock ETFs'}
rows=[]
for i,(url,title)in enumerate(urls.items()):
 row={'url':url,'label':title,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'TradeHQ-Audit/1.0 (+https://github.com/anugaweerasinghe1-del/trading101)'})
  with urllib.request.urlopen(req,timeout=40)as response:raw=response.read();row.update(status=response.status,finalURL=response.url)
  parser=MainText();parser.feed(raw.decode('utf-8','replace'));text='\n'.join(parser.parts);row.update(title=' '.join(parser.title),text=text,textSHA256=hashlib.sha256(text.encode()).hexdigest(),outcome='RETRIEVED_REQUIRES_ACTUAL_READING');(out/f'source-{i}.json').write_text(json.dumps(row,indent=2)+'\n');rows.append({k:v for k,v in row.items()if k!='text'}|{'evidence':f'evidence/foundation-primary-20261030/source-{i}.json'})
  print(json.dumps({'index':i,'url':url,'status':row['status'],'title':row['title'],'text':text}),flush=True)
 except Exception as e:row.update(outcome='RETRIEVAL_FAILED',error=str(e));rows.append(row);print(json.dumps(row),flush=True)
(out/'SUMMARY.json').write_text(json.dumps(rows,indent=2)+'\n')
