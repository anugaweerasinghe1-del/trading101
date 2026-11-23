"""Public citations only. Cache full third-party text locally; publish only bounded evidence."""
from pathlib import Path
import json,subprocess,tempfile,hashlib,re,concurrent.futures,datetime
from lxml import html
P=Path(__file__).resolve().parent;C=P/'.cache/references';C.mkdir(parents=True,exist_ok=True)
refs=json.loads((P.parent/'final-2026-11-22/evidence/reference-discovery.json').read_text())
def get(pair):
 index,ref=pair;url=ref['url'];key=f'{index:03d}'
 with tempfile.TemporaryDirectory() as tmp:
  path=Path(tmp)/'body';q=subprocess.run(['curl','-LsS','--max-time','35','--max-filesize','16000000','-o',str(path),'-w','%{http_code}\n%{url_effective}',url],capture_output=True,text=True);parts=q.stdout.splitlines();data=path.read_bytes() if path.exists() else b'';status=int(parts[0]) if parts and parts[0].isdigit() else None;title='';headings=[];text=''
  if data.startswith(b'%PDF'):
   text=subprocess.run(['pdftotext','-layout',str(path),'-'],capture_output=True,text=True).stdout;title='PDF: '+ref['uses'][0]['label']
  else:
   try:
    t=html.fromstring(data);title=' '.join(t.xpath('//title/text()'))
    for node in t.xpath('//script|//style|//nav|//header|//footer|//aside|//svg'):node.drop_tree()
    main=(t.xpath('//main') or t.xpath('//article') or t.xpath('//*[@id="content"]') or [t])[0]
    if len(main.text_content().split()) < 80: main=t
    headings=[' '.join(n.text_content().split()) for n in main.xpath('.//h1|.//h2|.//h3|.//h4')]
    text=' '.join(main.text_content().split())
   except Exception:pass
  (C/(key+'.txt')).write_text(text)
  return {'id':key,'url':url,'finalUrl':parts[-1] if len(parts)>1 else url,'status':status,'title':title,'headings':headings,'sha256':hashlib.sha256(data).hexdigest(),'words':len(text.split()),'cache':'.cache/references/'+key+'.txt','uses':ref['uses'],'fetchedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewStatus':'FETCHED_NOT_ASSESSED'}
if __name__ == '__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(get,enumerate(refs,1)))
 (P/'evidence/reference-fetch-index.json').write_text(json.dumps(rows,indent=2)+'\n');print('Fetched',len(rows),'citations; full text cache remains local and uncommitted.')
