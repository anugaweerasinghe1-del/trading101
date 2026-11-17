"""Validate evidence completeness, not the truth or independence of editorial judgment."""
import hashlib,json,sys,re
from pathlib import Path
DOMAINS={'content-safety','financial-accuracy','publisher-identity','original-value','copyright-sources','privacy-audience','navigation-behavior','ad-placement','ad-traffic','personalized-consent','video-inventory','account-eligibility'}
def validate(record,base):
    errors=[]
    def require(ok,msg):
        if not ok: errors.append(msg)
    require(record.get('status') in ('PASS','FIXED-RECHECKED'),'page is not closed')
    require(record.get('reviewerIdentity')=='Codex assistant; prior contributor','reviewer identity must not imply independent human or Google review')
    capture=record.get('capture',{});blocks=capture.get('blocks',[])
    require(bool(blocks),'no captured blocks')
    identifiers=[b.get('id') for b in blocks]
    require(all(identifiers) and len(set(identifiers))==len(identifiers),'duplicate or missing block IDs')
    for b in blocks:
        require(bool(b.get('location')) and bool(b.get('text')),'missing block location/text')
        require(hashlib.sha256(b.get('text','').encode()).hexdigest()==b.get('sha256'),'block hash mismatch: '+str(b.get('id')))
    files=capture.get('files',[])
    require({'native-html','rendered-text','authored-interactive-text'} <= {f.get('kind') for f in files},'missing raw capture category')
    for f in files:
        p=(base/f.get('path','')).resolve()
        require(p.is_relative_to(base.resolve()),'capture path escapes evidence directory')
        if p.is_relative_to(base.resolve()) and p.is_file():require(hashlib.sha256(p.read_bytes()).hexdigest()==f.get('sha256'),'raw capture hash mismatch')
        else:require(False,'missing raw capture file')
    index_ref=capture.get('blockIndexPath')
    require(bool(index_ref),'missing independent captured block index')
    if index_ref:
        index_path=(base/index_ref).resolve()
        require(index_path.is_relative_to(base.resolve()) and index_path.is_file(),'missing or unsafe captured block index')
        if index_path.is_relative_to(base.resolve()) and index_path.is_file():
            indexed=json.loads(index_path.read_text())
            require({b.get('id') for b in indexed}==set(identifiers),'record omits or invents captured blocks')
            index_by_id={b.get('id'):b for b in indexed}
            for b in blocks:
                original=index_by_id.get(b.get('id'),{})
                require(all(b.get(k)==original.get(k) for k in ('location','text','sha256')),'record differs from captured index: '+str(b.get('id')))
            require(any(f.get('path')==index_ref for f in files),'captured index is not hash-bound in manifest')
    findings={f.get('id'):f for f in record.get('findings',[])}
    require(len(findings)==len(record.get('findings',[])),'duplicate finding IDs')
    for pass_name in ('pass1','pass2'):
        reviews=record.get(pass_name,[]);ids=[r.get('blockId') for r in reviews]
        require(len(ids)==len(set(ids)) and set(ids)==set(identifiers),pass_name+' block coverage incomplete')
        by_id={b.get('id'):b for b in blocks}
        for r in reviews:
            require(r.get('blockSHA256')==by_id.get(r.get('blockId'),{}).get('sha256'),pass_name+' reviewed hash mismatch')
            require(r.get('disposition') in ('CHECKED-NO-ISSUE','FINDING-RESOLVED'),pass_name+' unresolved judgment')
            require(bool(r.get('reasoning')) and bool(r.get('contextChecked')),pass_name+' missing assessment/context')
            for identifier in r.get('findingIds',[]):require(identifier in findings,'unlogged finding '+identifier)
    matrix=record.get('policyMatrix',{})
    require(set(matrix)==DOMAINS,'policy-domain coverage incomplete')
    for domain,value in matrix.items():
        require(value.get('status') in ('CHECKED','N/A') and bool(value.get('reason')),'policy applicability missing: '+domain)
        if value.get('status')=='CHECKED':require(bool(value.get('sources')),'missing rule/primary source: '+domain)
    production=record.get('production',{});active=production.get('nativeCloudflare',{})
    require(bool(re.fullmatch(r'[0-9a-f]{40}',production.get('mergeSHA',''))),'invalid full merge SHA')
    require(bool(re.fullmatch(r'[0-9a-f-]{36}',active.get('id',''))),'missing native deployment ID')
    require(bool(production.get('nativeObservedAtUTC')),'missing native observation time')
    require(active.get('environment')=='production' and active.get('branch')=='main' and active.get('status')=='success','native production not verified')
    require(bool(production.get('mergeSHA')) and active.get('sha')==production.get('mergeSHA'),'native merged SHA mismatch')
    require(bool(production.get('liveRereadAtUTC')) and bool(production.get('receiptSourceURL')),'missing live re-read or native receipt source')
    for identifier,f in findings.items():
        require(f.get('status')=='FIXED-RECHECKED','finding unresolved: '+str(identifier))
        require(bool(f.get('beforeText')) and bool(f.get('reasoning')) and bool(f.get('loggedBeforeFixUTC')),'missing original finding evidence')
        require(f.get('mergeSHA')==production.get('mergeSHA') and bool(f.get('pullRequest')) and bool(f.get('verification')),'missing fix/release evidence')
    require(record.get('observedStateLimits') is not None,'dynamic/access state limits must be explicit')
    return errors
if __name__=='__main__':
    p=Path(sys.argv[1]);errors=validate(json.loads(p.read_text()),p.parent)
    print(json.dumps({'record':str(p),'complete':not errors,'errors':errors,'limitation':'Record completeness cannot prove that a reviewer read or judged correctly.'},indent=2))
    sys.exit(bool(errors))
