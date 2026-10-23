> Release update, 23 October 2026: [PR #212](https://github.com/anugaweerasinghe1-del/trading101/pull/212) merged at `aa216a24c68c30c9251f96a050da098b33364686`. Native production and scoped public verification passed. Any held/unmerged wording in the original preparation note below is historical. See the [release ledger](../RELEASE-LEDGER.json) for exact receipts.

# THQ-20261022-001 — About introduction overlaps fixed navigation

Severity: P3 (minor visual defect). Category: interface spacing. AdSense relevance: general usability only; no Publisher Policy violation established.

## Reproduction and evidence

On https://www.thetradehq.com/about at production cd64fdef9f9d33670514d5be391f545fb30c330b, scroll to the top after hydration and fonts settle. The intro icon starts at y=48. The fixed navigation ends at y=65 for 360/390/768/1920px widths and y=101 at 1280px. It overlaps the icon by 17px or 53px respectively. The heading itself remains readable; this is not reported as a major functional failure.

Measurements: ../evidence/ABOUT-OVERLAP-BEFORE.json. Screenshots: ../evidence/about-overlap-before-360.png and ../evidence/about-overlap-before-1280.png. Captured 22 October 2026 in actual production Chromium, with the existing certificate trust and loaded fonts.

## Root cause and smallest fix

About uses 48px vertical padding while the site header is fixed and can be taller than that padding. Reserve 112px above the About content, matching other account/utility page spacing, while retaining its existing responsive bottom padding. Add a real Chromium geometry assertion at 360×800, 390×844, 768×1024, 1280×800 and 1920×1080. The assertion checks that the introduction clears the navigation rather than matching a CSS class.

Files: src/pages/About.tsx; scripts/verify-publisher-browser.mjs. Interface-only; no change to page copy, metadata, homepage positioning, authentication, balances, order/fee calculations, database, consent/ad implementation or provider settings. Risk is low and limited to About's vertical layout.

## Validation and release state

Fix prepared. New regression must fail against the old compiled page and pass against the candidate. Full required exact-head CI, Cloudflare/Vercel previews, protected merge, exact-SHA native production deployment and live five-viewport recheck remain mandatory. No merge or release is claimed in this committed finding; write final verified results into the PR and RELEASE-LEDGER only after observing them.

Rollback: a reviewed revert restores the single About padding change and its associated regression. The known-good source baseline is cd64fdef9f9d33670514d5be391f545fb30c330b and Cloudflare production 755fdba1-e1ee-4d6f-b148-941afb1ae006. No data/schema/settings change needs reversal. This identifies a recovery baseline, not independently tested provider rollback eligibility or authorization to perform a production rollback.
