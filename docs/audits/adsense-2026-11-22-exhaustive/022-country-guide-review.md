# Country-guide first detailed audit — 22 November 2026

Baseline source: 5ebd32f826f75f6c9612841c031bfc8024a72f84. Prior detailed count 87/163 (#510); six newly reviewed publisher routes bring first detailed source/text review to 93/163, 70 remaining. This does not close #430. Legacy /learn/:id pages are not in this 163-URL indexable inventory.

## Evidence and decisions by route

| Route | Live extracted characters | Review |
| --- | ---: | --- |
| /learn/country | 3409 | Complete extracted notes and index UI source reviewed, including all five country navigation cards, local-rule verification, no broker recommendations, no assumed eligibility, source-check exercise and limitations. All five destination links present. |
| /learn/country/sri-lanka | 5236 | Read all source text and visible extracted sections, regulator/exchange/currency details, tax caveat, distinct exchange-rate worksheet, student framing and three FAQs. SEC licensing/regulated activities specific reference verified; index names not independently rechecked in this pass. |
| /learn/country/india | 4945 | Read all sections and three FAQs. Historical 93% FY22–FY24 equity-derivatives statistic corroborated by SEBI 23 Sep 2024 press release (not universal investor loss rate); remove unsupported popularity assertion. Local access and offline limits explicitly described. |
| /learn/country/philippines | 4765 | Read all sections and two FAQs; official eRAMP registry and PSE main-index documentation corroborated. Hypothetical remittance worksheet distinct; optional adult-only analytics distinction consistent with policy source, not a legal account-age decision. |
| /learn/country/pakistan | 4235 | Read all sections and two FAQs. SECP capital-market licensing and PSX index definitions corroborated. Remove unsupported absolute product wording and oil-import magnitude claim; worksheet remains hypothetical. |
| /learn/country/nigeria | 3999 | Read all sections and two FAQs; registered-operator registry and May 2026 regulator warning corroborated. Remove unconditional geographic-access claim and unsupported revenue magnitude implication; worksheet distinct. |

Fresh public extraction on all six routes returned matching canonical and index/follow, no errors and no image links in extracted notes. Read countryGuides.ts, CountryGuide.tsx (including index), relevant scripts/content.ts and routes.ts blocks, shared disclaimer and Quick Answer component. Extracted notes and source match substantive country-specific text. Extractor does not establish hydrated image/interaction behavior or exact HTTP status. Shared CTA and FAQ overbroad geographic and account wording revised; country headings and CTA now frame education rather than an expected real-money account. No new regulated financial capability. No private data, user records, ad activation or account changes.

## Official references checked
- Google Publisher Policies https://support.google.com/publisherpolicies/answer/10502938
- Misleading representation https://support.google.com/publisherpolicies/answer/11185754
- Replicated content https://support.google.com/publisherpolicies/answer/11190248
- Site readiness https://support.google.com/adsense/answer/7299563
- Sri Lanka SEC https://www.sec.gov.lk/who-we-regulate/
- SEBI press release https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html
- Philippines SEC https://eramp.sec.gov.ph/capital-market-participants ; PSE https://www.pse.com.ph/indices/
- Pakistan SECP https://www.secp.gov.pk/licensing/capital-markets/ ; PSX https://www.psx.com.pk/psx/product-and-services/indices
- Nigeria SEC https://sec.gov.ng/for-investors/find-a-registered-operator/ ; https://www.sec.gov.ng/for-investors/keep-track-of-circulars/public-notice-unregistered-online-investment-schemes/

No verified new Google enforcement violation. Distinct authored worksheet value present; full external originality, all source destinations and legal/tax/age/access claims not certified. No geo-specific browser test performed. Existing dated limited source-check scope retained rather than pretending a fresh comprehensive legal check. Regression assertions added, exact replacements checked; full CI and Cloudflare production gate pending. Further work includes second-pass and per-block evidence, source verification, browser accessibility/navigation, and unique content provenance. Keep #509, #510 and #512 pending fixes intact.
