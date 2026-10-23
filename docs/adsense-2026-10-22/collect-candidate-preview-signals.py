"""Selected native/provider preview fields only. Never emits tokens or signed logs."""
import datetime,json,os,pathlib,re,subprocess,sys,urllib.request
sha,stem=sys.argv[1:3]
assert re.fullmatch(r'[a-f0-9]{40}',sha) and re.fullmatch(r'PR\d+(?:-[A-Z0-9-]+)?',stem)
root=pathlib.Path(__file__).parent

def gh(path):
    return json.loads(subprocess.check_output(['gh','api',path],text=True))

checks=gh('repos/anugaweerasinghe1-del/trading101/commits/'+sha+'/check-runs')['check_runs']
cf=next(x for x in checks if x['app']['id']==85455 and x['name']=='Cloudflare Pages' and x['conclusion']=='success' and x['head_sha']==sha)
deployment=cf['details_url'].rstrip('/').split('/')[-1]
assert re.fullmatch('[0-9a-f-]{36}',deployment)
statuses=gh('repos/anugaweerasinghe1-del/trading101/commits/'+sha+'/status')['statuses']
vs=next(x for x in statuses if x['context']=='Vercel' and x['state']=='success')
vercel_id='dpl_'+vs['target_url'].rstrip('/').split('/')[-1].removeprefix('dpl_')
request=urllib.request.Request('https://api.vercel.com/v13/deployments/'+vercel_id+'?teamId=team_fjZ5ggg0P43MsYFSIHbeHAAO',headers={'Authorization':'Bearer '+os.environ['TRADEHQ_VERCEL_VERIFY_TOKEN']})
with urllib.request.urlopen(request,timeout=25) as response:
    result=json.load(response)
assert result.get('readyState')=='READY' and result['meta']['githubCommitSha']==sha
assert result['projectId']=='prj_PjOhFr0eppPg8hZQhdeBwTniZWOy'
receipt={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'candidateSHA':sha,'cloudflareGitHubNativeSignal':{'headSHA':cf['head_sha'],'appId':cf['app']['id'],'checkId':cf['id'],'conclusion':cf['conclusion'],'deploymentId':deployment,'url':'https://'+deployment.split('-')[0]+'.tradehq-preview.pages.dev'},'cloudflareAuthenticatedAPI':'NOT VERIFIED:23Oct binding401; no production claim','vercel':{'id':result['id'],'state':result['readyState'],'sha':result['meta']['githubCommitSha'],'url':result['url'],'projectId':result['projectId'],'target':result.get('target')}}
(root/('evidence/'+stem+'-PREVIEW-SIGNALS.json')).write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'candidateSHA':sha,'cloudflarePreview':receipt['cloudflareGitHubNativeSignal']['url'],'vercelState':result['readyState'],'productionRelease':'NOT CLAIMED'}))
