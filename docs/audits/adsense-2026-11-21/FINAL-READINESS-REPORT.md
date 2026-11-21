# TradeHQ — final second-pass AdSense readiness closeout
**21 November 2026 | strict, evidence-first review | read-only production**

> **ADDITIONAL POLICY RULEBREACH RECHECK (2026-11-21):** A new Google-policy/live-page/source check found **0 confirmed active AdSense policy violations**, **1 unconfirmed editorial quality-risk cluster**, and **1 high-risk historical ad-script issue already fixed**. The 12 original findings are **categories of investigation, not 12 rule breaks**. The 16-row [POLICY-BREACH-MATRIX.csv](POLICY-BREACH-MATRIX.csv) explicitly identifies whether each item actually violates an AdSense rule; the human-readable counts and new probe evidence are in [POLICY-BREACH-COUNT.md](POLICY-BREACH-COUNT.md). Actual hydrated browser/network testing remains unknown because the browser provider has insufficient credits. No production code changed.


**Conclusion: CONDITIONAL GO for a fifth AdSense site-review request on the basis of site content and publicly testable evidence.** No currently substantiated critical or high-severity Google Publisher Policy violation was found. This is a **risk assessment, not a promise of approval**, and Google's four prior generic rejection messages remain non-diagnostic. Do not invent any Google reason. Do not change production merely to satisfy speculative findings. If the adult-account/owner and live account gates are truly in order as the owner reports, there is no site-content defect proven here that justifies indefinitely delaying the request. The unresolved checks below are limitations, not alleged violations.

## Exact scope and independently preserved evidence

| Evidence item | Count/status | Interpretation |
| --- | --- | --- |
| Live `/sitemap.xml` | 151 URLs | Current indexable route list |
| Live `/course-sitemap.xml` | 12 URLs | 3 published course overviews + 9 lessons |
| Union | **163/163 live URLs extracted** | Fresh live page text, titles, meta robots and canonicals fetched; **not** 163 manual expert fact-checks |
| Text blocks | **1,807** | 815 from first 70-page pass + 992 from remaining 93; preserved in two CSVs |
| Manual individual full-text examinations | **25** | First pass 15 + second pass 10 (selected financial, glossary and YMYL topics) |
| Remaining text-extracted/machine-screened pages | **138** | Metadata, repeated passages, content-structure and narrow harmful-promise screen; manual certification **not** claimed |
| Latest GitHub source cross-check of 93 new pages | **85 static matches** | Exact live text excerpts found in matching source families at `main` commit `5dbd364b4b0aff28c44c3d4a1e8805675fbd5cd2` |
| Live backend articles among 93 | **8** | Database-published course pages require direct publication checks rather than code-only text comparison |
| Link extraction | **163/163 sitemap pages** | 3,055 observed outgoing links in the extraction, including repeats; 147 distinct same-domain destinations and 119 different off-domain destinations; this does **not** prove every link's end-to-end interactive behavior |
| Extra linked same-domain route | **1** | `/achievements`: appropriately `noindex,follow` and a private user workspace |
| Additional out-of-sitemap samples | **8 readable + 1 expected 404** | `/achievements`, four unindexed alternate asset simulator pages, `/auth`, `/admin`, unknown member profile; all those sampled pages `noindex`; an invented path returned 404 |
| Primary reference URL spot-check | **20/21 accessible** | SEC/FINRA/Fidelity/CME/OCC/SEBI etc.; CFTC resource bot-blocked for one extractor, **not a proven broken link** |
| Contradictory or unsupported certain-return claims in representative manual sample | **0 confirmed** | No blanket claim that every factual sentence is externally verified |

**Archived artifacts:** `FULL-URL-LEDGER.csv` is the final authoritative row-by-row sitemap census. `PARAGRAPH-SCREEN.csv` + `PARAGRAPH-SCREEN-REMAINDER.csv` contain the 1,807 live content blocks. `REMAINING-LIVE-01.json`, `02.json`, `03.json` preserve the entire text + canonicals for the 93 new pages. `SOURCE-COPY-CHECK.json`, `LINKS-01/02/03.json`, `PRIMARY-REFERENCE-SPOTCHECK.json`, `DEEP-PAGE-REVIEW.md`, `POLICY-INVENTORY.md` and `FINDINGS.md` preserve other evidence and previous false-positive adjudications.

### High-priority new test: verify published AI-assisted lessons against actual database

Read-only queries identified the actual **TradeHQ Supabase project** and `public.published_courses` / `public.course_drafts` records. The three live approved/published courses each have three lessons and a recorded `reviewed_at`, publication timestamp, approved `revision` and published editorial attribution.

- **Bitcoin simulator practice:** published revision 9, current draft revision 9, current draft equals published content when the published editorial metadata is excluded. Review/publication recorded **2026-11-15 11:28:21 UTC**.
- **Cryptocurrency price feeds and valuation:** published revision 5, current draft revision 5, similarly content-matched after excluding the editorial metadata. Review/publication recorded **2026-11-15 11:35:40 UTC**.
- **Diversification and position sizing:** current publication revision 3 has valid review/publication timestamp **2026-10-09 15:45:01 UTC**. Its working draft is revision 6 while `published_revision=3`. Different latest working drafts are expected under revision-controlled publishing and **not** proof of an unreviewed public release.

This independently supports the existence of an owner-bound publication/review *record* rather than merely trusting a page's claim. It **cannot certify that a qualified human actually read every word**, or that every finance fact is true. No private user accounts, subscriber lists, or personal trade data were read; all SQL was SELECT-only.

### Important corrected assumptions

1. **147 checked-in versus 151 live main URLs is not a bug.** `scripts/generate-sitemap.ts` re-renders at build from `scripts/routes.ts` and includes `/start`, `/practice`, `/newsletter`, `/whats-new`. The separate published-course sitemap adds 12.
2. **Short glossary pages aren't automatically AdSense violations.** Sampled glossary entries commonly have 300–500 extracted words, and genuinely subject-specific explanations, formulas, cautions and reference-backed exercises. Google's own content-quality requirements favor useful original material but impose no numerical minimum. They may still invite discretionary reviewer comparison.
3. **Shared disclaimers are expected.** Across the complete corpus, the same publisher attribution and virtual-trading disclaimer each occur on 151/163 pages; an aggregate exact-paragraph screen found **16** types of reused substantial blocks, mostly safety/author/review/lesson boilerplate. This is not plagiarized content and does not prove that other topic-specific prose is semantically original or fully copyright-cleared.
4. **The earlier high-risk AdSense loader remains historical.** `index.html` retains `google-adsense-account` meta, and live `/ads.txt` matches the publisher ID, without executable ads bootstrap in current source. Prior #428 fixed the original globally loaded script. Official Google AdSense accepts a meta tag or ads.txt as site-ownership verification methods; executable ads code isn't the only method.
5. **Mismatched draft/published objects need precise explanation.** For two courses, the only JSON difference is published `editorial` metadata; for the third, a later unpublished draft is deliberately different. Not a new violation.
6. **The latest `main` CI is partially red but not because of AdSense.** Cloudflare compatibility/build-and-SEO, Phase 3 tests, Required validation, and disposable DB repair-control validation jobs passed. The read-only Release Signals job failed because **Vercel's commit deployment signal was unsuccessful/rate limited**, and a downstream recovery job was skipped. Vercel previews are not TradeHQ's primary Cloudflare production deployment. Log: `https://github.com/anugaweerasinghe1-del/trading101/actions/runs/44883947635`. Do not misreport this as a proven Cloudflare production outage or Google policy fault.
7. **Noindex is not an ad-policy bypass.** Off-sitemap account, profile and generic asset screens need ad placement exclusion if advertising ever resumes. Current source excludes tools/auth/admin from manual eligible inventory and disables executable bootstrap; this is currently a gate for future ads, not a verified violation on live screens.
8. **Publisher policies and advertiser trading-product restrictions are not interchangeable.** Teaching options/crypto with virtual money is not categorically banned from AdSense by Google Ads advertiser certification requirements.

## Policy mapping & remaining unknowns

The current official sources used in this audit are [AdSense program policies](https://support.google.com/adsense/answer/48182?hl=en), [Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938?hl=en), [Publisher Restrictions](https://support.google.com/publisherpolicies/answer/10437795?hl=en), [AdSense content/site readiness](https://support.google.com/adsense/answer/81904?hl=en), [original content and navigation](https://support.google.com/adsense/answer/7299563?hl=en), [adless site verification methods](https://support.google.com/adsense/answer/12169212?hl=en), [consent requirements for EEA/UK/Switzerland](https://support.google.com/adsense/answer/13554116?hl=en), and [Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies). The linked `POLICY-INVENTORY.md` provides a compact clause inventory, not an unauthorized wholesale copy of policy texts.

**Review gate that must be eligible:** Google's [account eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en) require an applicant/account holder age 18+; a parent/guardian can register with their own Google account for a younger site creator. The owner says the account side is fine; this audit **does not assert it is not**. We did not see the actual account owner/status or the four messages, and should not ask for nonexistent detailed rejection reasons.

**Still outside this audit:** a fresh real Chromium screen-and-network run on Nov 21 (separate browser provider had insufficient balance), real ad/CMP account settings, authenticated private workflows, full document originality/copyright outside TradeHQ, every economic claim and live external regulatory rule, 119/119 third-party destination uptime, and Google Search Console indexing/traffic. The archival **Nov 14** auditor did record 480 individual route observations and 960 browser viewport measurements with no observed ad loader/uncaught exception/overflow after its fix, but that is historical, not a fresh Nov 21 re-run.

## Strict verdict

**Confirmed current critical Publisher Policy violations: zero evidenced.**
**Confirmed current high Publisher Policy violations: zero evidenced.**
**Plausible site-wide discretionary issue: one low-to-moderate editorial-value cluster** — concise, similarly templated glossary summaries; useful examples and references materially weaken the hypothesis that they are valueless.
**One present separate engineering/preview signal failure** — Vercel rate limit, not evidence of an AdSense problem or a Cloudflare production outage.

**Resubmission decision: CONDITIONAL GO** on website-content evidence, provided (as the owner previously indicated) the real AdSense account is compliant and eligible and the site remains publicly usable on mobile/desktop. There is **no justified site-content fix to invent first**. If the goal is maximal caution, perform a quick owner-side real-browser smoke of mobile first trade, Learn, a course lesson, About, Contact, Privacy and consent, then request review. This manual gate exists solely because a fresh independent browser was technically unavailable, not because it failed a test.

**Approval chance:** qualitatively moderately favorable but substantially uncertain. If the owner insists on a number, a **low-confidence subjective range of about 55–70%** under the stated account/UX assumptions is defensible as a reviewer impression, **not** as an empirical/statistical prediction or something Google disclosed. A fifth rejection remains possible because Google's decision factors and prior reasons are unknown. Prior initial-pass 40–60% was a provisional impression before 93 missing pages were actually examined; this replaces it rather than pretending exact odds can be calculated.

**Operational instruction:** make no code/site/ad changes as part of this research. Preserve the ledger on this dedicated audit branch; never merge it into production or misrepresent old bug fixes as new problems.
