# THQ-026 — Chart check cadence caption

P3 minor data-provenance wording finding. PR [226](https://github.com/anugaweerasinghe1-del/trading101/pull/226).

The visible chart footer said “Candles 60s”, while `useLiveCandleData` enforces a five-minute minimum interval (`Math.max(refreshInterval, 300000)`). The component passes 60000, which is clamped. The quote hook enforces 30000. Fresh browser evidence delegates the original native `setInterval` unchanged and records 300000 alongside the old caption: `evidence/CHART-CHECK-CADENCE-BEFORE.json`.

The correction says “Candle spacing varies by provider • Checks: quotes 30s, candles 5m”. “Checks” does not guarantee a fresh network result: existing caching and provider delays still apply. Only one static caption changes. Timers, caching, feeds, prices, calculations, trading, accounts, auth/DB/progress, consent/policies/ads and infrastructure are untouched. A reviewed wording revert through the normal release cycle is the rollback.

Candidate `71b84461ab0f531da44da54d8670ad1bef0628ea` passed build/SEO, app TypeScript and exact-head required CI. Native preview signals and actual candidate browser receipts must precede merge. Release state and final native/live proof are authoritative in FINDINGS.json and RELEASE-LEDGER.json.

The first caption assertion selected `p` elements, while the caption is a `span`. Preserved failure receipt includes the correct new text already rendered. The audit selector was corrected to the actual span without relaxing the exact-text assertion; this is not a product defect. No Google policy violation is asserted.

Public verification: ordinary squash merge `8781a5ed3b797e720a75e7aa55cf024bd45bba97` passed all six exact-main checks. Native Cloudflare production `53636fb1-11f6-4919-9799-04bc12205be5` is SUCCESS, and Vercel `dpl_58rh4UguFaX75qRfnyzgnd5U3E6v` is production READY with the active public alias at the same SHA. Actual live40route/width states and30guest states/four controls pass with no captured runtime exceptions; selected360/1280component images were personally viewed. Receipts: PR226-PRODUCTION-PROVIDERS, MAIN-CI, PRODUCTION-BROWSER and POST-PR226-GUEST-SMOKE JSON files in evidence/.
