"""Read-only dated evidence collection; deliberately does not attest editorial review."""
import csv, hashlib, json, subprocess, time
from pathlib import Path
from urllib.parse import urlsplit, urljoin
from lxml import html
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
def fetch(url, body=True):
    if not body:
        # GET with headers only persisted: curl closes output through /dev/null;
        # profile payloads never enter Python, logs or evidence files.
        p=subprocess.run(['curl','-sS','-L','--max-time','25','-o','/dev/null','-w','%{http_code}',url],capture_output=True,text=True)
        return {'status':int(p.stdout) if p.stdout.isdigit() else None,'method':'GET status only','bodyPersisted':False}
    p=subprocess.run(['curl','-sS','-L','--max-time','25','-w','\n%{http_code}\n%{url_effective}',url],capture_output=True,text=True,errors='replace')
    try: raw,status,final=p.stdout.rsplit('\n',2);return {'status':int(status),'finalUrl':final,'body':raw}
    except ValueError:return {'status':None,'error':p.stderr[:150]}
def write(name,data): (OUT/'evidence'/name).write_text(json.dumps(data,indent=2)+'\n')
crawl=json.loads((OUT/'evidence/live-crawl.json').read_text())
seen={p['url'] for p in crawl['pages']}
extra=json.loads((OUT/'evidence/historical-reconciliation.json').read_text()) if (OUT/'evidence/historical-reconciliation.json').exists() else []
prior={r['url'] for r in extra}
for row in csv.DictReader((ROOT/'docs/audits/issue-430/sequential-2026-11-16/page-queue.csv').open()):
    url=row['url']
    if url in seen:continue
    profile=urlsplit(url).path.startswith('/trader/') and urlsplit(url).path!='/trader/me'
    report_url='https://www.thetradehq.com/trader/[public-profile-'+hashlib.sha256(url.encode()).hexdigest()[:16]+']' if profile else url
    if report_url in prior:continue
    r=fetch(url,not profile)
    if profile:
        r['url']='https://www.thetradehq.com/trader/[public-profile-'+hashlib.sha256(url.encode()).hexdigest()[:16]+']'
        r['scope']='HTTP only; profile identity/body omitted'
    else:
        r['url']=url
        raw=r.pop('body','')
        if raw:
            tree=html.fromstring(raw)
            for field,path in [('title','//title/text()'),('canonical','//link[@rel="canonical"]/@href'),('robots','//meta[@name="robots"]/@content'),('description','//meta[@name="description"]/@content'),('h1','//h1//text()')]:r[field]=' '.join(tree.xpath(path))
        r['expected404Probe']=url.endswith('/missing-adsense-audit-probe')
        r['indexable']=r.get('status')==200 and 'noindex' not in r.get('robots','').lower()
        r['scope']='initial HTML metadata only'
    r['checkedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime());extra.append(r)
    write('historical-reconciliation.json',extra)
print('Historical additional routes:',len(extra),flush=True)
# Collect every publisher HTML independently, excluding community member bodies.
captures=[];media={};refs={};blocks=[]
for page in ([] if (OUT/'evidence/publisher-initial-html.json').exists() else crawl['pages']):
    if not page.get('inSitemap'):continue
    url=page['url']
    if urlsplit(url).path in ['/reviews','leaderboard','/leaderboard','/challenge']:
        captures.append({'url':url,'scope':'UGC excluded; no member body captured'});continue
    r=fetch(url);raw=r.pop('body','');r['url']=url
    if raw:
        tree=html.fromstring(raw)
        for bad in tree.xpath('//script|//style|//svg'):bad.drop_tree()
        mains=tree.xpath('//main');main=mains[0] if mains else tree
        r['mainText']=' '.join(main.text_content().split())
        r['sha256']=hashlib.sha256(r['mainText'].encode()).hexdigest()
        # Descendant units retain independent IDs; no hash is a review verdict.
        for i,node in enumerate(main.xpath('.//h1|.//h2|.//h3|.//h4|.//p|.//li|.//table|.//button|.//figcaption'),1):
            text=' '.join(node.text_content().split())
            if text:blocks.append({'url':url,'id':urlsplit(url).path+'#html-'+str(i).zfill(4),'type':node.tag,'text':text,'sha256':hashlib.sha256(text.encode()).hexdigest(),'reviewStatus':'UNREVIEWED'})
        for node in tree.xpath('//img|//video|//audio|//iframe|//source'):
            for key in ['src','poster']:
                if node.get(key):
                    src=urljoin(url,node.get(key));a=media.setdefault(src,{'url':src,'type':node.tag,'uses':[],'provenance':'OWNER EVIDENCE REQUIRED'})
                    a['uses'].append({'page':url,'alt':node.get('alt'),'width':node.get('width'),'height':node.get('height')})
        for node in tree.xpath('//a[@href]'):
            target=urljoin(url,node.get('href'))
            if target.startswith('http') and urlsplit(target).hostname not in ['www.thetradehq.com','thetradehq.com']:
                refs.setdefault(target,{'url':target,'uses':[]})['uses'].append({'page':url,'label':' '.join(node.text_content().split())})
    captures.append(r)
if captures:
    write('publisher-initial-html.json',captures)
    (OUT/'evidence/initial-html-blocks.jsonl').write_text(''.join(json.dumps(x)+'\n' for x in blocks))
    write('media-discovery.json',list(media.values()));write('reference-discovery.json',list(refs.values()))
else: refs={x['url']:x for x in json.loads((OUT/'evidence/reference-discovery.json').read_text())}
print('Publisher captures',len(captures),'HTML blocks',len(blocks),'media',len(media),'references',len(refs),flush=True)
# HTTP/link availability never establishes support for an associated claim.
checks=json.loads((OUT/'evidence/reference-http-checks.json').read_text()) if (OUT/'evidence/reference-http-checks.json').exists() else []
prior_refs={x['url'] for x in checks}
for url in sorted(set(crawl['externalReferences'])|set(refs)):
    if url in prior_refs:continue
    r=fetch(url);raw=r.pop('body','');r['url']=url;r['claimSupport']='UNREVIEWED';r['checkedAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())
    if raw:
        try:
            tree=html.fromstring(raw);r['title']=' '.join(tree.xpath('//title/text()'))
            text=' '.join(tree.text_content().split());r['bodySha256']=hashlib.sha256(raw.encode()).hexdigest()
            r['possibleAccessWall']=bool(any(s in text[:4000].lower() for s in ['access denied','just a moment','verify you are human','403 forbidden','enable javascript']))
        except Exception:r['parse']='non-HTML or invalid'
    checks.append(r);write('reference-http-checks.json',checks)
print('Reference HTTP checks',len(checks),flush=True)
