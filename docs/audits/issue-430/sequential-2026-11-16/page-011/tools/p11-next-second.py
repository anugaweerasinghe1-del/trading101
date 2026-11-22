import json,datetime
from pathlib import Path
p=Path('/workspace/trading101/docs/audits/issue-430/sequential-2026-11-16/page-011');ledger=json.loads((p/'block-ledger.json').read_text())
notes={
'practice-02':[
'Reread confirms the second interval starts at28,500/8,000, not original holdings; cash and no-fee premises make the bridge well specified.',
'The visual is a starting exposure breakdown, not end values or a fabricated price chart; its100k sum matches the briefing.',
'The1,500 choice is uniquely consistent with5% of30k; neither150 nor5k fits the stated exposure.',
'The two losses sum3,500; the12,500 distractor incorrectly applies an unweighted asset mean to the whole account.',
'With unequal exposures and substantial cash, an unweighted average answers a different question. The explanation does not imply losses cannot be summed.',
'The2,000 crypto loss uses the initial10k base, not the later8k rebound base.',
'The equity option96,500 includes unchanged cash; it is not just36,500 invested value.',
'The denominator is explicitly starting-account100k;−1.5percentage points is stock contribution while total is−3.5%.',
'The stock rebound restores only1,425 of the original1,500 loss, leaving29,925.',
'The crypto rebound restores1,600 of2,000;9,600 is correct rather than a symmetric10k recovery.',
'The final475 shortfall equals75 remaining stock loss plus400 crypto loss; the bridge reconciles independently.',
'Both stock and crypto declines matter, but the20% crypto fall outweighs its smaller exposure; the selected comparison does not claim crypto always dominates.',
'The takeaway matches both actual dollar losses and keeps the lesson dependent on the selected inputs.',
'The general primary-source link has retained live200/title evidence; no assertion is made that its page contains or endorses these numbers.',
'The reflection field is unrendered source material; it cannot be counted as an observed user input or saved text feature.'],
'practice-12':[
'The entry amount is expressly before its buy fee; the2,200 and1,800 exits are mutually exclusive branches, resolving potential double counting.',
'The gross-gain bar200 is separately labelled; it is not shown as another holding or cash receipt.',
'The0.1% multiplier is0.001, producing2.20 on exit notional; a gain-only fee0.20 would violate the stated rule.',
'Net proceeds2,197.80 include original capital;197.80 is gain before subtracting the entry fee and not a cash receipt.',
'Entry debit2,002 versus exit credit2,197.80 gives195.80, not197.80, so both fees are represented once.',
'The entry debit is2,002 regardless of which later branch is considered; no extra purchase is implied.',
'Price-only gain200 deliberately precedes expenses, with no ambiguous claim of net performance.',
'Total costs4.20 combine the unequal2/2.20 fee bases rather than applying a blanket4.',
'Independent division gives9.78021978%, correctly rounded9.78%;10% is price-only return on a different denominator.',
'The losing exit still incurs1.80 on its actual1,800 notional; the rule is not contingent on profitability.',
'The alternative net loss203.80 comprises200 price loss plus2 entry and1.80 exit charges; subtracting proceeds independently agrees.',
'Only one complete sale can occur without a new purchase; two worksheet branches are not two actual credited receipts.',
'The guide keeps gross gain, charges and sale proceeds distinct; it does not call proceeds profit or omit the entry charge.',
'The reference provides general educational context, not a verified broker-specific fee schedule. The0.1% is explicitly a worksheet rule.',
'The bank reflection question is source-only. Its existence does not contradict the newly corrected honest takeaway-only UI description.'],
'practice-22':[
'Equal weights and75/25 are explicitly conceptual examples, so the worksheet does not invent CoinGecko weights from a single101 output.',
'The three bars distinguish two venue observations from a calculated reference, with a fictional-input caption.',
'A101 aggregate need not be a101 last trade. The answer properly requires venue/transaction/time evidence for that stronger claim.',
'Methodology is underdetermined by these numbers; an apparent midpoint does not establish complete input coverage or filtering.',
'A paper mark establishes valuation under simulation rules only; the text does not promise an actual executable price.',
'Equal weights give50+51=101. This supports a possible computation rather than proof of the actual one.',
'The alternative weights give75+25.50=100.50; the option101.50 reverses the stated weighting.',
'A matching number can arise from other observations/filters/weights; this is a valid identifiability caution.',
'The2dollar difference divided byA100 is2%; usingB as denominator would answer a different comparison.',
'A weighted mean can fall between inputs even if neither venue traded at that exact value.',
'Actual executable bids/asks and constraints are needed. Even these additional data are not framed as a guarantee of an unlimited fill.',
'Keeping the weights conceptual avoids false attribution; the correct answer does not imply the higher reference is a sell quote.',
'The guide adds source/time/currency comparison and admits omitted weights and execution, consistent with the briefing.',
'The actual methodology link was retrieved separately; it supports consultation of a primary source, not provider endorsement of hypothetical calculations.',
'The source-only prompt is separated from rendered completion text and any hypothetical response.'],
'practice-32':[
'The learner is the one calling prior observations uncorrelated. The first three supplied pairs are exactly inverse, but the article does not assert a measured low coefficient for them or a permanent relationship.',
'The visual explicitly gives fourth-interval loss magnitudes3/4, not gains or old inconsistent labels; historical correction#238 is reused.',
'The substantive answer is correct, but reread caught plural-subject Does three grammar. Reproduced on the actual custom domain; confirmed rootSTRICT-DAILY-005, pre-edit evidence retained.',
'Low correlation in general permits simultaneous negative intervals; this explanation does not claim the selected three inverse pairs have coefficientzero.',
'The appropriately limited historical description avoids a guaranteed hedge and does not discard diversification entirely.',
'Checking all four sign pairs yields three opposite and one same-negative; it does not calculate a coefficient from signs alone.',
'The fourth-interval3% of1k is30; no compounding of previous observations is requested for this fresh equal-dollar comparison.',
'The fourth-interval4% of1k is40; the decliningB position cannot offset the simultaneously decliningA here.',
'The70 sum includes both selected losses.35 would be a per-position mean rather than combined dollars.',
'70/2,000=−3.5%; the7% distractor incorrectly sums equally weighted returns without division.',
'Magnitudes/sample/method matter to a reliable long-run estimate; a coefficient could be computed for a tiny sample without making it reliable or permanent.',
'The fourth observation refutes the always-offset claim only; it does not establish that diversification never helps.',
'The guide preserves the possibility of concentration reduction and acknowledges joint losses, without predicting future correlation.',
'Investor.gov remains generic further reading; the four fabricated observations are not attributed to it as historical returns.',
'The unrendered reflection field remains source-only; no account or written-note state is represented as inspected.'],
'practice-42':[
'The later report is explicitly new information and no real report data are supplied. The scenario warns against causal storytelling while retaining a valid price calculation.',
'The40/44 bars are entry/later quote inputs, not400/440 position values; their unit and caption distinguish these.',
'The4/40 increase is10%; this first question teaches separation of observed return and retrospective reason.',
'A dated addendum preserves the original test; replacing the note would erase what evidence actually motivated the trade.',
'A note should retain uncertainty/review condition, not a certainty claim or merely desired profit.',
'Ten units at40 give400 notional; unspecified total account value cannot be inferred.',
'Ten unchanged units at44 give440, independently of the market-causation narrative.',
'The40 position gain is ten times the4 per-unit increase; both quantities are consistently distinguished.',
'The10% computation repeatsQ1, but the later explanation expressly contrasts asset return with fees/whole-account performance. This limited instructional repetition is not evidence of a Google violation or a confirmed functional defect.',
'Adding a dated report note, rather than editing the earlier reason, retains knowledge chronology.',
'Profit does not establish the report caused the move; the case supplies no controlled causal test.',
'The original-versus-later explanation comparison reveals changed reasons, whereas final badge/rank cannot.',
'The guide explicitly tells learners not to invent a report catalyst; it is consistent with the absence of supplied report evidence.',
'The primary reference is general investing context, not documentation of this fictional issuer/event or proof that journaling causes profits.',
'The reflection prompt is source-only; an actual typed user note is neither generated nor claimed to have been reviewed.']}
for row in ledger:
 for case,reasons in notes.items():
  prefix='STRICT-0011-DEEP-'+case+'-'
  if row['id'].startswith(prefix):
   k=row['id'][len(prefix):];ix=0 if k=='brief' else 1 if k=='visual' else 12 if k=='takeaway' else 13 if k=='sources' else 14 if k=='unused-reflection' else int(k[1:])+1
   assert row['pass2']['status']=='PENDING';row['pass2']=dict(status='REVIEWED',reason=reasons[ix],reviewer='Codex assistant; separate substantive skeptical full-case reread',reviewedAtUTC=datetime.datetime.now(datetime.timezone.utc).isoformat())
   if case=='practice-32' and k=='q01':row['findingRefs']=['STRICT-DAILY-005']
(p/'block-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
print(len(ledger),'groups; second pass recorded75; one newly confirmed grammar root; page remains partial')
