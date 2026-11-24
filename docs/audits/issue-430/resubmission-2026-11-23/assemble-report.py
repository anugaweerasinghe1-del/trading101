"""Render evidence-derived counts and a bounded verdict; never promote pending checks."""
import pathlib,json,csv,collections,datetime
P=pathlib.Path(__file__).resolve().parent;E=P/'evidence'
def cr(name):return list(csv.DictReader((P/name).open()))
urls=cr('CURRENT-URL-INVENTORY.csv');pages=cr('EDITORIAL-PAGE-COVERAGE.csv');blocks=[json.loads(x) for x in (P/'EDITORIAL-BLOCK-EVIDENCE.jsonl').read_text().splitlines()];sm=cr('SOURCE-AND-MEDIA-LEDGER.csv');defects=cr('DEFECT-LEDGER.csv');auth=cr('AUTHENTICATED-TEST-CASES.csv');pc=json.loads((E/'policy-control-counts.json').read_text());refs=[r for r in sm if r['type']=='REFERENCE'];media=[r for r in sm if r['type']!='REFERENCE'];exceptions=sum('EXCEPTION' in r['result'] for r in refs);fetched=sum(r['httpStatus']!='NOT_YET_CHECKED' for r in urls)
releaseFile=E/'recovery547-receipt.json';release=releaseFile.exists() and json.loads(releaseFile.read_text())['receipt'].get('currentSha')=='aec36c13f45dae7ec49372b9dd0cc83769a5abe2'
erasureFile=E/'controlled-erasure-auth-denial.json';erasure=erasureFile.exists() and (E/'controlled-erasure-after.json').exists()
fixed=sum(r['status'].startswith('FIXED') or r['status']=='IMPLEMENTED_AND_PRODUCTION_VERIFIED_545' for r in defects);false=sum(r['classification']=='FALSE POSITIVE / CLOSED' for r in defects);unresolved=len(defects)-fixed-false;external=sum(r['classification']=='EXTERNAL GATE' and not r['status'].startswith('FIXED') for r in defects)
counts={'generatedAt':datetime.datetime.now(datetime.UTC).isoformat(),'finiteKnownUrls':len(urls),'urlTypeCounts':dict(collections.Counter(r['routeType'] for r in urls)),'httpCaptured':fetched,'httpRemaining':len(urls)-fetched,'canonicalPublisherPages':len(pages),'sourceBodyRecords':sum(r['layer']=='SOURCE' for r in blocks),'individualAssessmentRecords':len(blocks),'layerCounts':dict(collections.Counter(r['layer'] for r in blocks)),'unreviewedEnumeratedRecords':sum(r.get('reviewStatus')!='ASSESSED_WITH_EXPLICIT_LIMITATIONS' for r in blocks),'allPropositionOrLegalCertification':False,'referenceDestinations':len(refs),'boundedReferenceSupportWithoutException':len(refs)-exceptions,'explicitReferenceExceptions':exceptions,'materialMediaItems':len(media),'emittedMediaFontFiles':55,'sourceOnlyBrandCopy':1,'proceduralCertificateVariants':3,'applicableOrConditionalPolicyControls':22,'policyControlResults':pc,'authenticatedTestCases':len(auth),'boundedProductionAuthPass':sum(r['productionStatus']=='BOUNDED_PRODUCTION_PASS' for r in auth),'authPartialCases':sum(r['productionStatus']!='BOUNDED_PRODUCTION_PASS' for r in auth),'manualErasureVerified':erasure,'releaseControls':6,'releaseControlsPassed':6 if release else 5,'releaseControlsRemaining':0 if release else 1,'finalApplicationSha':'aec36c13f45dae7ec49372b9dd0cc83769a5abe2','distinctFindings':len(defects),'findingClasses':dict(collections.Counter(r['classification'] for r in defects)),'confirmedPolicyRelevantDefectsEstablished':0,'fixedVerifiedFindings':fixed,'falsePositives':false,'unresolvedFindingsIncludingConditionalAndOptional':unresolved,'unresolvedExternalGates':external,'scope':'Finite known URL union; evidence layers overlap and retain actual reading/observation dates. Dated market quotes are examples of variable templates, not latest live values. No universal legal, factual, accessibility or approval certification.'}
(P/'COUNTS.json').write_text(json.dumps(counts,indent=2)+'\n')
verdict='BLOCKED — INSUFFICIENT VERIFICATION' if not erasure or not release else 'READY FOR OWNER RESUBMISSION REVIEW'
reason=('The controlled manual account-erasure workflow remains unverified. ' if not erasure else '')+('Final native release/recovery evidence is still pending. ' if not release else '')
if not reason:reason='Current site-side evidence supports owner resubmission review, subject to the stated account-holder and future advertising obligations.'
report=f'''# TradeHQ AdSense readiness report

Audit work: 22–24 November 2026. Current reconciliation: 24 November. This report identifies the verified application release; the documentation PR’s terminal release appendix records its subsequent documentation-only main SHA. No AdSense submission or approval is implied.

## 1. Executive verdict

**{verdict}.** {reason}

No confirmed Google policy violation has been established by the bounded review. That does not override the generic rejection notice or predict Google’s decision. There is no defensible approval percentage. The known source corrections, actual observations, exceptions and owner-only requirements are separated below.

## 2. Exact audit counts

| Metric | Verified / assessed within stated scope | Total | Remaining |
|---|---:|---:|---:|
| Technical URLs — initial response captured | {fetched} | {len(urls)} | {len(urls)-fetched} |
| Canonical publisher pages — actual reading history reconciled | {len(pages)} | {len(pages)} | 0 enumerated |
| Individual content evidence records — bounded, overlapping assessments | {len(blocks)} | {len(blocks)} | {counts['unreviewedEnumeratedRecords']} enumerated |
| Material media items — source, licence or retained-brand record | {len(media)} | {len(media)} | 0 unenumerated; rights limits below |
| External references — bounded support without an explicit exception | {len(refs)-exceptions} | {len(refs)} | {exceptions} exceptions |
| Applicable / conditional policy controls — evaluated | 22 | 22 | 0 unevaluated |
| Authenticated cases — bounded production pass | {counts['boundedProductionAuthPass']} | {len(auth)} | {counts['authPartialCases']} partial |
| Final application release controls | {counts['releaseControlsPassed']} | 6 | {counts['releaseControlsRemaining']} |

**Denominators and limits.** The finite URL inventory is {len(urls)}: 163 canonical publishers, 233 application/utility routes, seven legacy aliases, 78 pseudonymised public profile routes, 333 public build files, three public service responses and four explicitly tested retired resources. This expands the historical 481 page/alias/profile routes with identified resources; it does not claim discovery of every arbitrary query, token, wildcard or past deployment hash. Profiles received status-only checks; all 78 public bios were empty at the recorded check. No private profile or moderation bodies were collected.

Both live sitemaps and the approved catalog independently reconcile 151 static and 12 dynamic publisher URLs. The three approved dynamic courses each have three lessons. Canonicals and indexability match on the 163 publishers. All 333 emitted public files matched the released build bytes. An HTTP 200 or byte match is not a successful UX or editorial review.

The current source body inventory has 6,107 records. Actual prior individual reading is retained for unchanged content; ten changed/new source blocks, twenty changed image descriptions, 42 dated rendered text differences, two copy corrections and 48 Foundations records (including forty questions) were individually assessed. The {len(blocks)} records span overlapping source, interactive, rendered and template layers; identifiers and labels are included. They are not distinct prose paragraphs, fresh rereadings of every page on 24 November, or independent certification of every factual proposition. The 5,107 historical initial-HTML records are excluded. Dated quote observations do not represent the latest live prices. Every enumerated record has a reading/history method or an explicit limitation; hashing alone is not reading evidence.

The real-browser evidence includes 326 publisher and 480 utility/alias viewport observations. No uncaught JavaScript errors, horizontal overflow, broken loaded images, missing alt attributes or unlabelled visible inputs were captured. The review-admin main-landmark failures were independently diagnosed and fixed. Twelve focused axe theme/viewport scopes passed after the Markets contrast correction; 24 released route/theme/viewport observations confirmed the fixes. All 163 publisher regions were observed: 151 integrated/appended regions and twelve dynamic-course main variants. These tests are not an accessibility certification or exhaustive account/state/referrer acceptance.

The 22 applicable/conditional policy rows have {pc['PASS']} bounded PASS, {pc['RISK']} RISK and {pc['BLOCKED']} BLOCKED results; three additional rows are not applicable. RISK is not an adjudicated violation. The future regional advertising gate is conditional while ads remain disabled. The 24 November policy refresh reviewed the new Search Back-button FAQ and certified-CMP list changes. Actual desktop/mobile Back navigation passed; no promotional history trap was established in the source review or bounded browser test.

## 3. Defects and policy risks

| Classification | Exact count |
|---|---:|
| Confirmed policy-relevant defects established | 0 |
| Confirmed technical bugs, including historical and staged regressions | {counts['findingClasses']['CONFIRMED TECHNICAL BUG']} |
| Confirmed editorial errors | {counts['findingClasses']['CONFIRMED EDITORIAL ERROR']} |
| Plausible quality risks | {counts['findingClasses']['PLAUSIBLE QUALITY RISK']} |
| False positives | {false} |
| Historical external gates | {counts['findingClasses']['EXTERNAL GATE']} |
| Fixed and verified findings | {fixed} |
| Unresolved findings, including conditional/optional/external items | {unresolved} |
| Unresolved external gates | {external} |

The deduplicated ledger has {len(defects)} findings. Event aliases are explicit in `evidence/finding-deduplication.json`; repeated manifestations are not counted as new findings. One trophy-size regression was caught by CI before release. All remaining status limits must be read per row rather than inferred from a green build.

The remaining external/conditional items concern owner/account evidence, future ad-serving consent, manual privacy fulfilment and five reference exceptions. Optional leaked-password protection is deferred to owner configuration and is not presented as an AdSense requirement. Source/brand documentation is bounded evidence, not a guarantee against every third-party claim.

## 4. Implemented changes and production evidence

- **PR543**, main `c8d6f1ad4d5f5275ca2780e9b7c8a49a13d8d624`: new cover compositions/exports, original source diagrams and tokens, synthesised music and accurate credits. The actual TradeHQ name and mark were retained. The options cover mismatch and staged trophy-size regression were corrected and verified.
- **PR544**, main `cfc6db89b6c96e2ad1ef522743e95a0deca9f8c8`: authoritative Cloudflare current/prior/domain/bundle evidence restored the active-provider recovery gate. No DNS or hosting-provider changes.
- **PR545**, main `d93a0ca72393734d204187a5987b351b5602589d`: source-rendered certificate backgrounds and extractable Unicode fields, bundled font-licence records and accessible primary-source PDF citations. All three actual private certificate variants were downloaded twice with identical repeat bytes and correct extractable fields.
- **PR546**, main `4b2926ef7225fa97faebce701b5f1fd147ad5ddc`: exact retirement of three old PNG URLs, review-admin main landmarks, Markets badge contrast and the remaining Markets/Portfolio wording corrections. All three required main checks, native production, 333 public resource byte matches and actual changed-route checks passed. Old PNG GET/HEAD now returns 410/noindex/no-store; the actual retired audio URL returns 404. The older 537/539 patches are incorporated here; those PRs are not falsely reported as merged.
- **PR547**, main `aec36c13f45dae7ec49372b9dd0cc83769a5abe2`: distinguish a mutable same-commit prior preview badge from the independently established native production parent. The current production binding remains exact. The historic 546 release-signals failure is preserved; final status comes from the 547 native/recovery receipts, never from relabelling an old failure. Publisher content and app behaviour are unchanged by this infrastructure correction.

See `RELEASE-VERIFICATION.md`, the native production/recovery JSON receipts, exact public resource observations, actual certificate downloads and safe controlled-account results. Source provenance records cover 54 media copies, two licensed fonts and three procedural certificate variants: 55 emitted files, one unused source copy and three runtime PDF variants. The retained vector brand has repository source/history evidence and explicit owner direction; no independent trademark or universal copyright certification is claimed. AI generation alone does not mean copyright-free.

## 5. Remaining actions and responsibility

1. **Owner/provider privacy acceptance:** delete only the newly created disposable TradeHQ account A through the supported Supabase Auth user-delete control, following the exact steps already supplied. Its auth/profile/learning/portfolio rows were still present at the latest 24 November check. The auditor can then verify scoped row removal and denied new login/refresh. Do not delete Gmail/Google, an existing account or test B. The local Contact draft, privacy controls, cascade metadata and disposable fixtures do not manufacture successful manual fulfilment.
2. **Account holder:** retain accurate adult account/payee responsibility and review any actual account or acquisition notices. Adult ownership is owner-attested, the publisher binding independently matches, and official guidance permits a parent/guardian account where applicable. No public age/family disclosure or identity-document certification is invented. Only the generic disapproval is available; no further detailed-notice or inaccessible-panel screenshot is requested.
3. **Before future applicable ad serving:** verify regional certified-CMP/consent/age treatment and actual placements. The current analytics choice is separate. Ad serving remains disabled, and missing onboarding panels do not establish a present violation or a universal pre-application CMP requirement. Non-personalised delivery is not claimed to be universally exempt from consent obligations.
4. **Reference exceptions:** My Ad Center preferences/cookies wall; Philippine SEC registry and main-site access constraints; inaccessible exact NY Fed HTML body and DOI while bounded support from primary PDF copies is recorded. These five are explicit exceptions, not invented dead links or full-source passes. The earlier Google Fonts and Morningstar exceptions were resolved through direct JS-body reading.
5. **Scope and legal responsibility:** preserve original-author/brand rights and normal UGC moderation. No genuine private moderation queue, all-user identity history, internet-wide plagiarism search, universal legal certification or live positive owner moderation is claimed. Controlled tests are separated from isolated fixtures and owner acceptance.

## 6. Final recommendation

{'Obtain the missing manual privacy acceptance before resubmission. ' if not erasure else 'Proceed to eligible-owner resubmission review subject to the recorded external account duties. '}{'Finish the pending native release/recovery observation first. ' if not release else ''}Keep master issue430 open while unresolved acceptance evidence remains. The policy attestation and Resubmit button have not been used. Only Google can decide approval; no probability or approval guarantee is offered.
'''
(P/'FINAL-ADSENSE-READINESS-REPORT.md').write_text('\n'.join(line.rstrip() for line in report.splitlines())+'\n')
print(json.dumps({'verdict':verdict,'urls':len(urls),'contentEvidence':len(blocks),'findings':len(defects),'fixed':fixed,'unresolved':unresolved,'finalReleaseVerified':release,'erasureVerified':erasure}))
