# TradeHQ owner follow-up — 23 November 2026

Base protected main: `ed35a1bf5d7de9d9a06ececabf250905ab7cb3da`. Branch `audit/430-owner-gates-and-media-2026-11-23`. Keep issue #430 open. Ads remain disabled; no resubmission performed.

## This correction batch

The owner cannot establish the provenance of prior images/music and authorized documented replacements. Ten new OpenAI-generated cover compositions (14 exports), 13 source-authored lesson diagrams, 20 source-authored completion tokens plus their sprite, a new placeholder and an original synthesized ambient track replace uncertain assets. The actual live TradeHQ logo and name are retained; the two PNG brand exports derive from the live navigation SVG. `BrandMark.tsx` and `public/logo.svg` are unchanged. A new screenshot of the actual course interface replaces the prior social-preview bitmap. Public About/credits identify methods and avoid claiming that AI work is automatically copyright-free or exclusive.

Creation receipts: `GENERATED-ART-RECORDS.json`, `NEW-MEDIA-PROVENANCE.json`, `media-source/`, `brand-extracted/SOURCE.json`, and `scripts/media/generate-project-media.py`. Original new-art PNGs are private working-cache inputs; hashes are recorded. The old track is removed. The lesson gap diagram separates observed segments and labels its dashed connector as missing observations. Lesson prose, mathematical examples and answer keys are unchanged; image descriptions now match replacements.

## Verification and its limits

Full Cloudflare build/regression suite and 357 served-route fixtures passed locally. `MEDIA-BROWSER-EVIDENCE.json` records real rendered template checks at 390 and 1440 pixels, original logo geometry, image availability, overflow and JavaScript errors, plus deliberate audio playback/mute with no initial audio request. One initial test used an invented course slug and reached a 404 template; that was rejected as course evidence, corrected to the actual options course and rerun with an explicit error-template guard. Contact-sheet inspection covered all 13 diagrams and 20 tokens. The MP3 is mono 22050Hz, 48.065306 seconds, 577269 bytes; mean -21.3dB, peak -9.2dB. This does not establish subjective musical quality or universal accessibility/legal clearance.

Controlled production authentication: 14 observations across seven case IDs using only two newly created disposable TradeHQ identities in the designated inbox. See `CONTROLLED-AUTH-EVIDENCE.json`; no email addresses, tokens, passwords, personal identity or real-customer rows are published. Both synthetic profiles were restored private. Passing bounded observations are not full closure of every authentication case.

## Remaining work / resumable checkpoint

1. Finish protected PR CI, native Cloudflare production commit/environment/domain verification, then recheck changed public assets and pages. Local build evidence is not production deployment evidence.
2. Reconcile the stale dual-provider recovery check with the owner-reported Cloudflare-only production intention; preserve real native active/prior production, protected-main/SHA/domain and recovery safeguards. No workflow/provider/DNS change is included in this media batch.
3. Finish achievable remaining controlled workflows: session expiry/refresh, certificates, reviews/moderation, community challenge, newsletter and privacy-request handling. Positive administrative moderation or manual privacy fulfilment may require owner acceptance; do not inspect genuine private moderation data or send unsolicited messages.
4. Inspect account-owner Privacy & messaging evidence (screenshot or secure owner session). If onboarding does not expose it, record that limitation; do not infer missing UI violates policy. No password or assistant invitation identity is required.
5. Reconcile the prior audit policy/source exceptions and counts against the final release. The prior eight external-reference exceptions are not automatically cleared by removing two music links.
6. The optional leaked-password protection improvement remains deferred; it is not described as a Google AdSense requirement.

Do not certify readiness or close #430 while these checks remain incomplete. The finite full audit inventory and body-review history remain in `../completion-2026-11-22/`; this bounded correction batch does not replace them or claim a fresh whole-site audit on its future release SHA.

## PR and regression follow-up

PR #543 initially failed isolated trophy loading because new exports were256px while the UI and assertion require232px. Exports were corrected to232px without weakening tests. The full isolated compiled-auth/browser suite then passed locally, including trophy loading/sharing, and offline staging/live SEO headers passed. Protected CI and production verification remain required for the corrected head.
