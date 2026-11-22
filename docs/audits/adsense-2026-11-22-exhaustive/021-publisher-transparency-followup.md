# Bounded publisher transparency follow-up — 22 November 2026

Baseline main: 5ebd32f826f75f6c9612841c031bfc8024a72f84. Follows #430 and #511. Prior documented count: 87/163 first detailed source reviews. The following source and fresh public-extraction examinations are additional evidence, NOT new strict page closures. No private rows, test signups, messages, financial transactions, ad requests, or database writes performed.

## Source and public text inspected

- /newsletter: NewsletterPage.tsx, NewsletterSignup.tsx, scripts/staticCopy.ts newsletter sections, route metadata, newsletter-public relevant confirm/subscribe/unsubscribe handler branches and RLS policies. All extracted publisher-note headings, paragraphs, lists and disclaimer read; core promises, confirmation, weekly availability and opt-out compared. Public extraction canonical self and index/follow. Hydrated UI/source differs from text extraction; actual delivery, authenticated/interactive acceptance and originality checks outstanding.
- /reviews: Reviews.tsx full source and public staticCopy/staticCopyExtra sections, submit-review relevant validation/pending behavior, route metadata, RLS policies. All extracted publisher-note headings, prose, bullets and disclaimer read. Public extraction canonical self and index/follow. Public moderation outcome, actual individual public review content, accessibility and interactive acceptance not fully exercised.
- /markets: public extracted notes and relevant source excerpts inspected. Generated values vs other routes' potentially provider-backed data distinguished by source, but metadata uses broader wording. Further full source/claim validation needed; no completed source-review credit.
- /privacy: fresh public extraction contains the complete Foundations certificate disclosure added in #506, dated 22 November; corroborates earlier exact release witness. Contact summary mismatch remains in source; fix below. This is not a new unique page.
 
## Corrections in this branch (pending verification)

1. Newsletter public notes previously described link-only confirmation, while client and backend support a six-digit code or link. Align the note with both methods and qualify eligible addresses. Page weekly cadence should be framed as intended and conditional on editorial approval/delivery. Malformed non-empty confirmation/unsubscribe tokens previously disabled the action without explanatory text; now all malformed or missing tokens show an alert.
2. Reviews metadata previously asserted honest reviews even though identity and usage were explicitly not verified. Change to neutral, attributed wording. Rating count explicitly describes displayed reviews (query limit 100). Add a pre-submission reminder that approved reviews are public and private/identifying information should not be submitted. Remove absolute assertion that only time is at stake because optional data processing is documented. Actual review moderation behavior must still be checked without exposing private user data.
3. Privacy contact summary: replace unsupported absolute retention wording with email-provider-dependent wording consistent with privacyCopy.ts. Follow-up to #511.
4. Add source/build regression assertions to existing publisher-content gate. Exact-text preconditions passed during patch preparation; compile/full browser/CI tests have NOT been run in this session.

## Historical/DB checks

- #428 MASTER-LEDGER records exact Cloudflare production verification of global ad-loader fix on 14 Nov (run 43578225186); current main index.html contains verification metadata rather than executable AdSense loader. Historical evidence does not certify all current routes or the current account status.
- #506 privacy and telemetry fixes recorded exact-release evidence in 004-batch02-review.md. Source/privacy extraction examined anew.
- Read-only SQL: 33 public ordinary/partitioned tables, all 33 RLS-enabled. Reviews public visible-row select policy; review likes own-row policies; no direct newsletter contact/issue/delivery policies returned by scoped pg_policies query. No private row access. RLS enabled alone is not authorization proof. Security advisor reports privileged-function and leaked-password-protection warnings; not automatically violations.
- Google policies: https://support.google.com/publisherpolicies/answer/11185754 (misrepresentation), https://support.google.com/publisherpolicies/answer/10437794 (privacy), https://support.google.com/publisherpolicies/answer/11190248 (replicated content), https://support.google.com/publisherpolicies/answer/48182 (program), https://support.google.com/adsense/answer/81904 (content/navigation readiness). New findings are confirmed wording/UX defects or risks, not Google adjudications.

## Closure
No increment to 87/163 strict completed-review checkpoint. New pages partially reviewed, production browser, full external references/originality and dynamic content still open. Keep advertising disabled, preserve #509/#510 changes and protected checks. Require exact-head CI, preview, normal protected merge, authenticated Cloudflare production SHA and fresh post-release route/interaction checks. No account changes or AdSense submission.
