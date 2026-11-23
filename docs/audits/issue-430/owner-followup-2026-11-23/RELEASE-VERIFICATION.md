# PR #543 production verification — 23 November 2026

Protected main: `c8d6f1ad4d5f5275ca2780e9b7c8a49a13d8d624`. PR: https://github.com/anugaweerasinghe1-del/trading101/pull/543 . Reviewed PR head: `12d1a37b0655024e3ec1572f65be75224ef978d1`.

All three required PR checks passed in run45169644918; disposable PostgreSQL controls passed in run45169644934. The first head's trophy-size failure and correction remain recorded in the committed append-only ledger. Neither protection nor assertions were bypassed.

Authenticated native Cloudflare workflow45171232668/job137681000849 succeeded at12:08UTC: project `tradehq-preview`, production deployment `385dc2dc-9fde-44cb-93ff-da1b69f6ca3a`, branchmain/expectedSHA verified, `www.thetradehq.com` custom-domain binding confirmed, five public routes checked. See `PRODUCTION-NATIVE-RECEIPT.json`.

Independent public verification: all53 emitted media responses match their expected SHA256, with one additional unused source-only logo export documented separately. The retired track returns404. `media-credits.json` returns200 withnoindex, and static About HTML contains the new credit. See `PRODUCTION-MEDIA-HASHES.json`. The actual production browser passed10 bounded observations: four routes at390/1440px, expected publisher headings, original brand geometry, no broken loaded images/overflow/uncaught JS errors, optional audio absent from initial requests then actual play/mute. See `PRODUCTION-MEDIA-BROWSER.json`.

All three trusted required checks on this exact protected-main SHA passed in main workflow45171232722. See `PROTECTED-MAIN-REQUIRED-CI.json`; the final observation also confirmed protected main remained unchanged. The main workflow's separate historical Vercel-dependent release/recovery gate is not waived or calledpassed. The owner reports Vercel paused and Cloudflare intended production; safe gate reconciliation remains work on our side. No DNS, provider, advertising, CMP or account settings changed.

Additional real production authentication evidence: the original expired issuerJWT of controlled accountB was rejected with403, then the actual site refreshed the same account automatically at11:57:33UTC. Fifteen bounded observations now cover eight caseIDs, rather than full completion of14 end-to-end workflows. See `SESSION-EXPIRY-EVIDENCE.json`. No existing/Google account deletion, real trades or private-customer record access occurred.

Issue430 staysOPEN. Remaining checks include certificates/sharing, reviews/moderation acceptance, community challenge, newsletter and privacy-request fulfilment; positive administrative/manual fulfilment may require owner acceptance. Regional ad-consent/account-setting evidence is conditional on applicable future serving, with ads disabled; inability to access an onboarding-restricted panel is not fabricated as a policy violation. The seven other pre-existing citation/support exceptions are not all cleared by removing the obsolete music citation; current totals still require final reconciliation. Optional leaked-password protection is deferred and is not a Google AdSense requirement.

These terminal receipts will be mirrored in PR543's description, avoiding an endless new-release/new-receipt-only commit loop. This is a verified media correction batch, not a certification that the entire AdSense audit is closed.
