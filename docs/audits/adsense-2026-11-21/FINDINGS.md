# AdSense adversarial findings ledger — 21 November 2026

**Scope/epistemics:** Google has **not supplied an actionable reason** for the owner's four historical rejections. The purpose is to look for actual grounds for a fifth rejection, not manufacture them. No claim here represents Google's decision. **15** full live-text manual inspections; **55** additional live-text/metadata/paragraph screens; **93** sitemap URL records not paragraph-inspected in this pass. **815** recorded substantial live text blocks from the 70 fetched pages; 70 self-canonicals / indexability strings matched the respective URL. Broad screenshot/mobile/browser-interaction and authenticated-owner state not re-certified here. See `URL-LEDGER.csv`, `PARAGRAPH-SCREEN.csv`, `DEEP-PAGE-REVIEW.md`.

## Decision matrix

| ID | Classification | Severity for fifth-application readiness | Status / confidence |
|---|---|---|---|
| ADS26-01 | Cumulative site-content quality concern | **Moderate** (subjective, not confirmed) | Open discretionary review; medium confidence in *existence of short entries*, low confidence they affect Google approval |
| ADS26-02 | Repeated template & boilerplate | **Low** (context), not a demonstrated policy breach | Mostly disproved as copied low-value content; high confidence in measured repetition |
| ADS26-03 | Historical global ad serving on unsuitable screens | Previously high; currently **cleared** by repo and historical production evidence | Closed previously in PR #428, not reclassified as current violation |
| ADS26-04 | 147 checked-in vs 151 live main sitemap URLs | **None** | Explained by build-time regeneration; no issue |
| ADS26-05 | Glossary citations seemingly absent from primary file | **None** | False positive disproved by separate authored worksheet citations |
| ADS26-06 | Finance/trading restrictions | **None confirmed** | Education-only scope; contextual copy checked; distinct advertiser rules inapplicable as blanket publisher prohibition |
| ADS26-07 | Public authorship, value and disclosures | **No issue confirmed** | Positive but not proof Google will approve |
| ADS26-08 | Dynamic published-course text provenance | **Verification limitation** | GitHub renderer does not expose every live backend document; owner-review claim not externally authenticated |
| ADS26-09 | Cookie/CMP and future ad placements | **Future serving gate**, not present violation | Source states ad serving disabled; actual regional CMP/account unobserved |
| ADS26-10 | Off-sitemap app/auth/admin/profile screens | **None confirmed** | Proper noindex + 404 observed; browser action-level state not certified |
| ADS26-11 | Traffic, AdSense account decision, eligibility, copyright ownership | **Unknown**, outside site-text scope | No invented violation or account feedback; no definitive approval probability |
| ADS26-12 | Minor noindex reset-password repetitive error copy | **Low UX only** | Duplicated extracted sentence; may be prerender/hydration extraction rather than actual visible duplication |

## ADS26-01 — Brief glossary articles and cumulative perceived added value

- **Evidence:** 70-page extraction contains approx 324 total words on `/wiki/satoshi-nakamoto`, 328 on `/wiki/scalping`, 341 on `/wiki/whale-manipulation`; this total includes repeated creator/disclaimer language. Each exposes a concise `In depth` section plus a short educational exercise. Across 70 sampled pages average exact novel-paragraph word share ~86%; lowest sampled 71–72% on these entries. Note these metrics measure **exact shared paragraphs only**, not Google uniqueness or an originality check against the external web.
- **Official authority:** [site approval: insufficient content / content quality](https://support.google.com/adsense/answer/81904?hl=en), [original helpful content](https://support.google.com/adsense/answer/7299563?hl=en), [Publisher Policies inventory value](https://support.google.com/publisherpolicies/answer/10502938?hl=en), [Search spam scaled content abuse](https://developers.google.com/search/docs/essentials/spam-policies).
- **Proposed rejection hypothesis:** A reviewer might see too many similar short glossary shells rather than a proportionate amount of original teaching. Multiple moderate pages could matter cumulatively.
- **Challenge/counterevidence:** Google's sources do not impose a universal 500/1,000-word minimum; short reference answers have a legitimate narrower search intent. `src/lib/glossaryWorksheets.ts` has references on each of 49 term-specific worksheets, and sampled entries offer distinctive explanations, scope limits and numerical exercises. There is **no evidence** these pages are spam or automatically generated with no human curation.
- **Judgment:** A **plausible subjective approval-quality risk**; not a confirmed hard policy violation. Do not bulk-delete or noindex evidence-based entries; compare with useful competitor pages and user tasks before expanding, merge only true overlap, test original teaching value.
- **Retest:** Not fixed/changed by this audit; sample the other 43 glossary pages, identify repeated *core explanations*, validate worksheet/source usefulness, investigate if any have no actual pedagogical value. No invented policy-breaking page count.

## ADS26-02 — Repeated notices and template structure

- **Evidence:** The exact attribution sentence and education-risk disclaimer each recur on 66 of the 70 samples. Of 70 documents the mean share of paragraph words in non-repeated exact paragraphs is approximately **86%**. A full review of all 163, cross-site plagiarism detection, and semantics-based near-duplicate analysis were **not** performed.
- **Authority:** [Publisher Policies replicated content](https://support.google.com/publisherpolicies/answer/11190248?hl=en), [AdSense readiness](https://support.google.com/adsense/answer/7299563?hl=en).
- **Adversarial hypothesis:** Boilerplate and identical structure inflate apparently substantive length.
- **Challenge:** The repeated passages are disclaimers and truthful author disclosures; 70 sampled pages include different mechanisms, exercises, instrument-specific drivers, risks, and country regulatory context. Boilerplate is not a policy breach. Using the same template can aid usability.
- **Judgment:** No confirmed replicated-content violation. **Optional refinement:** reduce purely decorative repeated introductory prose where it obscures actual lessons; prioritize unique insights, examples and learning feedback over arbitrary prose volume.

## ADS26-03 — Historical ad loader *fixed*; verify future gate before restoring ads

- **Prior issue/evidence:** 14 November audit `docs/audits/adsense-2026-11-14/MASTER-LEDGER.md` THQ-ADS-001 found executable AdSense bootstrap on screens denied by inventory controls; PR [#428](https://github.com/anugaweerasinghe1-del/trading101/pull/428) removed it; older production evidence verified no loader across 480 URL observations.
- **Current source verification:** `index.html` at baseline `bca65c8...` retains `google-adsense-account` meta but **no executable Google ad library**; `src/lib/adInventory.ts` implements default-deny manual eligibility; live `/ads.txt` contains the expected publisher line.
- **Authority:** [Google Publisher inventory value](https://support.google.com/publisherpolicies/answer/11112688?hl=en), [Program ad placement](https://support.google.com/adsense/answer/48182?hl=en).
- **Counterargument:** A script being present would not prove an ad impression; conversely source absence in this snapshot does not prove every possible remote runtime has no ad-related injection. Interactive network validation was not repeated here.
- **Judgment:** Do **not** report as a current high violation. **Gate:** before future serving, confirm site status, page inventory, applicable consent and actual runtime ad requests. 

## ADS26-04 — Sitemap discrepancy explained by build

- **Evidence:** `public/sitemap.xml` tracked content lists 147 URLs; **live** `/sitemap.xml` lists 151, including `/start`, `/practice`, `/newsletter`, `/whats-new`. `scripts/routes.ts` declares these; `scripts/generate-sitemap.ts` rewrites the output in the build. `robots.txt` declares both main and dynamic course sitemaps; dynamic adds 12 live published course/lesson URLs, 163 in union.
- **Challenge:** A source checked-in artifact need not represent the compiled/served sitemap; the build script explains the difference. Dynamic course publication is intentionally data-sourced.
- **Judgment:** **Not a defect**. No unjustified `sitemap drift` ticket.

## ADS26-05 — Glossary references apparent false positive

- **Evidence initially suspicious:** Only three explicit `sources:` lists in `src/lib/tradingGlossary.ts` despite 49 `slug` terms.
- **Counterevidence:** `src/lib/glossaryWorksheets.ts` includes **49 separate `references:` lists**, including FINRA, SEC, Bitcoin whitepaper and other relevant sources; `src/pages/WikiTerm.tsx` renders `worksheet.references` under `References and scope` as well as optional `term.sources`.
- **Judgment:** **Not a demonstrated missing-source problem**. Each linked reference can still be individually stale/irrelevant, but absence from one file was not proof. Never report this false positive as a high risk.

## ADS26-06 — Finance suitability and factual claims

- **Evidence:** Sampled pages consistently state paper money, no actual investment execution, synthetic/delayed labels, no guaranteed returns, market orders only, and no personalized advice. Source-vs-live phrase checks verified corresponding content across `tradingGlossary.ts`, `assetContent.ts`, `seoData.ts`, `learnArticles.ts`, `countryGuides.ts`, `coursesData.ts`, `scripts/routes.ts`. Most attention-worthy samples include `/strategy/rsi-strategy`'s hypothetical BTC $92K stop/target example and `/learn/country/india`'s 93% SEBI loss research. The former is labelled as a hypothetical worksheet and not an executable automatic stop. SEBI official 2024 statement supports the latter **within FY22–FY24 individual equity-derivatives scope**, not all retail investing.
- **Official sources:** [Google Publisher misleading claims](https://support.google.com/publisherpolicies/answer/10502938?hl=en); [SEBI study](https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html); [OCC equity options](https://www.theocc.com/clearance-and-settlement/clearing/equity-options-product-specifications); [FINRA short interest](https://syndication.finra.org/content/short-interest-what-it-what-it-not).
- **Counterarguments:** Not every numerical, local-tax, current-market or real-world access statement has been independently source checked. A correct selected statistic does not establish all content accuracy. Google Ads advertiser policies covering speculative financial-product promotions are **not** a categorical ban on AdSense publishers who explain them educationally.
- **Judgment:** **No confirmed misleading financial claim in 15 full-text manual pages**, but do not certify all 163. Optional: make RSI entry/stop example more visibly illustrative to novice readers.

## ADS26-07 — Identity, origin, funding & privacy disclosures

- **Evidence:** Public `/about`, `/contact`, `/terms`, `/privacy` contain creator/editorial identity, contact/rights requests, no-real-money terms, disclosed AI assistance, future ads and privacy disclosures. No independent professional financial review is claimed. `/reviews` says user reviews aren't verified and are moderated.
- **Authority:** [misrepresentation and privacy policy](https://support.google.com/publisherpolicies/answer/10502938?hl=en).
- **Challenge:** A written statement does not prove that every workflow and personal-data flow behaves accordingly; user reviews remain UGC requiring moderation. Read-only extraction cannot certify account/privacy implementation.
- **Judgment:** Positive trust indicators, no text-confirmed deception. `about/contact/privacy` presence is not a substitute for content value.

## ADS26-08 — Published course bodies live in an external backend

- **Evidence:** Dynamic `/course-sitemap.xml` contains three course overviews + nine lessons, generated in `functions/course-sitemap.xml.ts` using Supabase published-course catalog RPC. Live lesson content was extracted. The GitHub `src/lib/courseHtml.ts` renders pages; `src/lib/courseEditorialCorrections.ts` records textual corrections, but an individual backend publication is not necessarily stored verbatim in git.
- **Challenge:** AI-assisted publication and owner-review metadata is a claim on the page, not independently authenticated review logs. Lack of GitHub prose is **not** evidence text is unoriginal or unreviewed.
- **Judgment:** Coverage limitation, no policy violation established. Further review requires read-only authorized backend publication snapshot and actual editor/revision evidence, **without modifying/publishing courses**.

## ADS26-09 — CMP future approval gating

- **Evidence:** `index.html` explicitly disables ad serving pending review; `/privacy` documents planned regional consent; `ads.txt` and account meta exist. Interactive CMP/account session not available in this pass.
- **Authority:** [Google's certified CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en), [publisher privacy disclosures](https://support.google.com/publisherpolicies/answer/10502938?hl=en).
- **Challenge:** A Google-certified CMP can be required when serving personalized ads in specified regions; it should **not** be stated as a universal prerequisite to merely asking for a site review, and a privacy policy alone does not certify consent behavior.
- **Judgment:** **Future-serving verification gate**, no currently demonstrated AdSense policy violation.

## ADS26-10 — Off-sitemap account, profile and error screens

- **New live observations:** `/auth`: noindex,follow; `/admin`: noindex,follow; `/reset-password`: noindex,nofollow; `/trader/test-unknown`: noindex,follow with unavailable/private notice. Invented unknown route `/this-page-does-not-exist-adsense-review-20261121` returned **404**. These routes are not part of the 163-sitemap publisher-content denominator.
- **Challenge:** `noindex` does not itself guarantee ad unsuitability exclusion, but no executable ad-serving script was seen in the current baseline source and the prior production fix was independently verified. Text-extractor duplication may be server+client presentation and needs visual proof before creating a defect.
- **Judgment:** No newly proven wrong indexable private/empty screen. Real login, profile permission flow and runtime placement tests remain unobserved.

## ADS26-11 — Unknown account/traffic/rights scope

- Four historical generic rejection notices do **not** reveal why Google withheld approval. Neither GitHub nor a public crawl can reconstruct actual AdSense reviewer decisions, payout/account eligibility, actual traffic-quality data, external copyright ownership, or full real-time age/consent status. No suggestion to resubmit blindly or invent a reason.
- **Judgment:** **UNKNOWN**, no blame or confirmed violation. Users' account assertions need not be challenged absent contrary evidence; no repeated request for emails.

## ADS26-12 — Possible duplicated noindex reset-password error string

- **Evidence:** text extraction shows the invalid/expired reset link notice twice at `/reset-password`, alongside expected `noindex,nofollow` and an invalid-token state.
- **Counterargument:** May reflect duplicate static+dynamic text within extraction rather than two visually displayed messages. This is **not** an indexable publisher document and doesn't establish AdSense rejection.
- **Judgment:** Low-priority UI copy observation only, requiring visual reproduction before any code edit.

## Final strict adjudication so far

- **Confirmed present critical Publisher Policy violations:** **0 evidenced** (not a certification of none anywhere).
- **Confirmed present high Publisher Policy violations:** **0 evidenced**.
- **Moderate plausible discretionary AdSense content-quality concerns:** **1 cluster** — shorter, similarly structured glossary entries at scale; not verified as a Google rejection reason.
- **Optional editorial readability refinements:** small number, not hardened as violations.
- **Confirmed historical high-risk defect:** **1, already fixed** and not counted again.
- **Current app/account functional, consent, link, security and rights coverage:** incomplete; no passing or failing verdict without independent testing.
- **Policy review:** broad current Google Program/Publisher/Restrictions, AdSense eligibility/readiness, consent, and search guidance inventory linked in `POLICY-INVENTORY.md`. This is not a full transcript or a contractual/legal opinion.

**Next priority:** sample the remaining **93** indexable URLs for actual content, especially the other glossary entries, all unreviewed asset pages, and remaining published lessons. Review user-visible live pages in mobile/desktop interactive Chromium when an independent browser is available; verify backend review records/consent/account separately if authorized. Keep the website and AdSense serving unchanged until evidence justifies a specific repair.
