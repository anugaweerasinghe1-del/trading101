import pathlib,json,datetime,hashlib,shutil
r=pathlib.Path('/workspace/trading101/docs/adsense-2026-10-22'); folder='fullpage-light-crypto-courses-20261030';e=r/'evidence'/folder; now=datetime.datetime.now(datetime.timezone.utc).isoformat();sha='55087f82f4df93a1e8f84e1e59295c62308247fd'
queue=json.loads((e/'review-queue.json').read_text());assert len(queue)==23
assessments={
'/courses/cryptocurrency-price-feeds-and-valuation':'Full overview, four outcomes, three lesson links, prerequisite/scope, progress/badge condition and footer personally viewed at all five widths. Narrow provider-filtering scope is visible. Long heading wraps without observed clipping.',
'/courses/cryptocurrency-price-feeds-and-valuation/exchange-tickers-and-price-aggregation':'Entire lesson and footer personally viewed: bid/ask/last and rolling-window distinction, comparable units, timestamps, provider filtering scope, invented weighted-price10.09 and VWAP5.02 examples, four questions/options, disabled submit, sources and next lesson. No quiz submitted.',
'/courses/cryptocurrency-price-feeds-and-valuation/api-delays-and-portfolio-valuation':'Entire lesson and footer personally viewed: observation/fetch/cache distinctions, no universal delay, delayed marks not loss protection, hypothetical versus actual execution, stated0.1% fee,1150/1200/$50 illustration and400/500 comparison, questions/options, sources and navigation. No quiz submitted.',
'/courses/cryptocurrency-price-feeds-and-valuation/portfolio-rebalancing-and-cash-drag':'Entire lesson and footer personally viewed: hypothetical40/40/20 scope, fees and order limits, cash comparisons108k/110k and92k/90k, approximate versus fee-aware50/50 rebalance,49990/99990 and49994.9975 figures, question/options, sources and navigation. No quiz submitted.'}
limit='Inspection coverage only. No route-specific clipping observed in these captures. Shared inactive audio light-footer contrast fails at this captured release and is separately tracked THQ078; no pass credit for that control. Full formal contrast, keyboard/focus, zoom, screenreader, quiz feedback, primary-source and originality stages remain.'
ledger=json.loads((r/'FULL-LIGHT-VISUAL-REVIEW-20261028.json').read_text());assert len(ledger['routes']) in (43,47)
for path,assessment in assessments.items():
 sheets=[x for x in queue if x['path']==path];ident=sheets[0]['name'].split('-')[1];assert len(sheets) in (5,6)
 entry={'path':path,'sha':sha,'reviewedAt':now,'assessment':assessment,'visualAssessment':assessment+' '+limit,'publishedEvidence':['evidence/'+folder+'/'+ident+'.json']+['evidence/'+folder+'/'+x['name']for x in sheets],'wholePageReviewComplete':False,'limitations':limit,'widthsActuallyViewed':[360,390,768,1280,1920],'allContactSheetsPersonallyViewed':len(sheets)}
 ledger['routes']=[x for x in ledger['routes']if x['path']!=path]+[entry]
ledger['updatedAt']=now;assert len(ledger['routes'])==47
(r/'FULL-LIGHT-VISUAL-REVIEW-20261028.json').write_text(json.dumps(ledger,indent=2)+'\n')
receipt={'checkedAt':now,'sha':sha,'outcome':'PERSONALLY_VIEWED_BOUNDED','count':23,'paths':list(assessments),'widths':[360,390,768,1280,1920],'themes':['light'],'personallyViewedSheets':[x|{'folder':folder,'sha256':hashlib.sha256((e/x['name']).read_bytes()).hexdigest()} for x in queue],'assessments':assessments,'limitations':limit,'releaseScope':'Collected with main55087f82 before and after collection; PR266 merged later. No production verification credit for PR266.'}
(r/'evidence/CRYPTO-COURSES-LIGHT-PERSONAL-20261030.json').write_text(json.dumps(receipt,indent=2)+'\n')
for name in ['full-light-crypto-run-20261030.py','record-crypto-light-20261030.py']:shutil.copy('/workspace/scratch/tradehq-audit/'+name,r/'verification'/name)
p=pathlib.Path('/workspace/scratch/tradehq-audit/curate-current-evidence.py');s=p.read_text();anchor="light=r/'FULL-LIGHT-VISUAL-REVIEW-20261028.json'";addition="for pat in ['evidence/CRYPTO-COURSES-LIGHT-PERSONAL-20261030.json','evidence/fullpage-light-crypto-courses-20261030/SUMMARY.json','evidence/fullpage-light-crypto-courses-20261030/review-queue.json']:\n for p in r.glob(pat):\n  if p.is_file():paths.add(str(p.relative_to(r)))\n"
if addition not in s:p.write_text(s.replace(anchor,addition+anchor))
print({'lightReviewed':len(ledger['routes']),'remaining':454-len(ledger['routes'])})
