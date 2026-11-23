import json,pathlib,subprocess,hashlib,concurrent.futures,datetime,re
from lxml import html
P=pathlib.Path(__file__).resolve().parent;O=P.parent/'final-2026-11-22/evidence/policies';C=P/'.cache/policies';C.mkdir(exist_ok=True)
def get(r):
 q=subprocess.run(['curl','-LsS','--max-time','30',r['url']],capture_output=True);data=q.stdout;t=html.fromstring(data.decode("utf-8","replace"))
 for e in t.xpath('//script|//style|//nav|//header|//footer|//aside'):e.drop_tree()
 nodes=t.xpath('//article') or t.xpath('//main') or [t];text='\n'.join(n.text_content() for n in nodes);old=(O/r['file']).read_text();a=''.join(old.split());b=''.join(text.split());(C/r['file']).write_text(text)
 return {'url':r['url'],'checkedAt':datetime.datetime.now(datetime.UTC).isoformat(),'title':' '.join(t.xpath('//title/text()')),'headings':[' '.join(x.text_content().split()) for x in t.xpath('//h1|//h2|//h3')],'sha256':hashlib.sha256(data).hexdigest(),'previousReviewedTextContained':a in b,'oldWords':len(old.split()),'currentWords':len(text.split()),'cache':'.cache/policies/'+r['file']}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:r=list(pool.map(get,json.loads((O/'index.json').read_text())))
(P/'evidence/policy-refresh.json').write_text(json.dumps(r,indent=2));print([(x['url'].split('/')[-1],x['previousReviewedTextContained'],x['currentWords']) for x in r])
