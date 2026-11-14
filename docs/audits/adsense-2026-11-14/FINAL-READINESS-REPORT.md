# TradeHQ public-scope AdSense readiness report

14 November 2026. **One confirmed site-control defect is repaired and verified in production. Full readiness remains conditional on the external account and authenticated owner acceptance gates below. Do not interpret this report as AdSense approval, a specific Google rejection diagnosis or a resubmission.**

## Verified scope and results

- **480 individual URL records:** 479 final HTTP 200 responses (including seven article aliases) and one deliberate unknown-path 404 test. The two current sitemaps contain **163 canonical publisher URLs: 151 main + 12 dynamic course/lesson URLs**. The other 310 initial documents are noindex states, including utilities, application screens, public-profile shells and the controlled error test. Initial noindex and hydrated public-profile metadata are recorded separately.
- **960 actual production viewport observations:** every URL navigated and measured at 1280px and 360px. No ad loader, uncaught application exception or measured horizontal overflow was observed. Six real Tab steps were recorded per URL; this is basic focus evidence, not exhaustive keyboard or accessibility certification. Selective screenshots are collection; only the baseline Start/Contact full-page captures were visually inspected in this session.
- **Editorial review:** 127 of the 163 indexable main texts exactly match the historical evidence and reuse its limited review. The remaining 36 changed/new indexable texts were read, with checks for scope, usefulness, hypothetical examples, unsupported performance implications and source attribution. Selected SEC/FINRA/Fidelity/CME definitions and eight fee/return/risk arithmetic checks were verified. This is not line-by-line professional financial review or forensic originality/copyright certification. No arbitrary minimum word count was applied.
- **Expanded discovery:** all 170 asset IDs, 78 public member paths, guest self-profile, administration/utility routes, seven concrete legacy aliases, four bundled courses and three currently published dynamic courses were included. No nondefault public profile bios were observed. Private challenge invite codes, real password-reset tokens, certificate fragments and authenticated user records were not enumerated.

## Repair and release

**THQ-ADS-001 (High):** the shared HTML executed AdSense code on screens denied by the unused inventory helper. The initial browser captures observed the loader on 472 of 473 URLs. This is a confirmed engineering defect and potential policy risk; loading the library does not establish that an ad was displayed or explain Google's generic rejection.

[#428](https://github.com/anugaweerasinghe1-del/trading101/pull/428) removed the serving bootstrap, retained the publisher verification meta and ads.txt, updated shared privacy disclosures and added regressions. Discovery was published before correction in `863af5ea`. Tested PR head: `64a3b3bf110041e5e48c20acc83ecc86da232d67`. Merge: **`2707aa2dc63eface2122e5e9a766453b48dd4350`**.

Native hosted CI at **2026-11-14 09:09:18.726 UTC** confirmed active successful Cloudflare Pages production deployment **`0ef04ca4-9713-4301-9f6c-3479e30156ba`** for that exact merge. Vercel's active production alias was independently confirmed READY at the same SHA. [Release job](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/43578225186/job/132399981648). The full live sweep ran 08:58–09:04 UTC, independently testing the changed behavior on every discovered URL. All 480 HTTP documents retained publisher verification and lacked the ad-serving script.

No other independent confirmed defect was substantiated in this scope. Confirmed defect counts: Critical 0, High 1, Medium 0, Low 0. THQ-ADS-002/003 are verification gates, not invented production defects.

## Tests actually run

The focused bootstrap assertion failed on the original executable tag. After correction, the full Cloudflare build/postbuild gates, 358 compiled HTML checks, TypeScript, course fixtures and disposable owner/review/publication workflow passed. Local Chromium passed **636 compiled visits (159 fixture URLs × desktop/mobile × JS on/off)** and existing interaction assertions. Exact-head protected CI, disposable PostgreSQL controls and exact Pages preview passed before the normal merge. Main release validation and native provider checks passed afterward.

A separate live guest smoke passed keyboard activation of the mobile menu and its primary Learn link, desktop Learn navigation, guest utility/editorial/error routes and zero observed ad-network requests. Initial attempts incorrectly targeted secondary links without opening More; they are not product defect evidence. An initial More follow-up encountered a transition/transport failure; after access recovered, keyboard expansion of More and real About navigation passed. Those earlier failures remain documented as test timing/access limits rather than product defects. One initial arithmetic probe encountered binary floating-point representation; exact integer-cent recalculation passed and is retained in the collector.

## Dynamic publication

All three public published documents validate and their nine lessons and three overview URLs appear in the live dynamic sitemap. Catalogue, journey/recommendation and What's New integration were inspected against current source and safe fixtures. Publication remains owner-bound and revision/review gated in the tested source; no draft or fabricated course was published. Live backend revision and owner publication acceptance were not certified by a frontend build.

A new approved publication inherits **disabled ad serving**. Publication is not advertising suitability approval. Before a future advertising release, each proposed inventory item needs an explicit suitability decision plus verified site approval, applicable CMP/consent and placement controls; Search indexability is not that decision. The crawler automatically discovers the current published-course sitemap; the CSV is a dated evidence snapshot, not an automatically renewed editorial attestation.

## Additional public-data verification after workspace recovery

The collector’s original denied public POST reads were corrected after inspecting their source. Once stable access returned, **81 affected URLs were rechecked at both widths (162 additional viewport observations)**. All **322 observed Supabase responses returned HTTP 200**, including the Daily bank, review engagement, public member/history reads and public trophy endpoints. There were no prevented Supabase reads, pending requests, uncaught exceptions, ad loaders or measured overflows. Trophies were paced below their public rate limit. The successful recheck discovered no additional URLs. Earlier 503/fallback captures are preserved separately; they are not silently relabelled passed. This closes the transient public-data coverage gap, without certifying every scenario’s semantics or an authenticated owner workflow.

## Remaining gates and recommendation

1. **THQ-ADS-002 — BLOCKED:** verify the actual AdSense account holder's eligibility, ownership, current site state, exact latest message and traffic/invalid-activity evidence. No authenticated account access was available; no account settings or application changed. Applicable certified CMP and placement behavior must be checked before future ads are enabled. A regional CMP is not asserted as a universal prerequisite to asking Google for review.
2. **THQ-ADS-003 — Authenticated owner acceptance BLOCKED/UNVERIFIED:** the public-data follow-up is now verified as described above. Signed-in owner/admin/learning/publication acceptance remains separate from passing isolated fixtures, and actual backend deployment identity was not certified by a frontend build. See existing issues #406/#335/#321. No owner-only course publication, user-data mutation or real-message send was attempted.
3. **Human judgment:** assess whether the original educational value and credibility meet Google's site-level expectations. No audit can certify all financial claims, rights ownership, legal compliance or the approval result.

**Recommendation:** keep ad serving disabled. Use this evidence for an owner-led manual resubmission-readiness review, and resolve the two recorded verification gates before calling the full mission complete. The verified public URL/ad-control work is complete; broader functional/account acceptance is not. No AdSense application was submitted.

[Master ledger](MASTER-LEDGER.md) · [All 480 pages](all-pages.csv) · [Policy mapping](POLICY-MAPPING.md) · [Release evidence](RELEASE-EVIDENCE.md) · [Evidence archive](evidence/production-audit-evidence.zip).
