> Release update: PR #224 merged as `b5cf45941341673e58f39368e18076c66739e60f`; all six main/release checks, both native production providers, forty affected live states and thirty guest states/four safe controls PASS. Initial CI transport and hidden-target canonical-test failures are preserved and diagnosed separately; original product assertions remain intact. THQ-024 is PUBLICLY_VERIFIED.

# THQ-024 — missing market-cap metadata appears to load forever

P2 visible reliability/unfinished state; not a claimed Google Publisher Policy violation. Anonymous public MSFT observations at04:21:04 and04:21:39UTC24October show Asset Intelligence “Simulated” and one spinning “Market Cap Loading...” field after quote fetching finished. Source uses a runtime-market-cap sentinel and a legacy optional prop, then unconditionally shows the loader when the value is absent. The active wrapper supplies liveData/isLiveLoading, not that prop.

Evidence: `evidence/MARKET-CAP-LOADING-REPRODUCTION.json`, `evidence/market-cap-loading-before-360.png` and `evidence/MARKET-CAP-AFFECTED-ROUTES.json`. Thirty-four paths have the conditional source state; this does not assert that every actual provider response omits market cap. No account, order or contact message was submitted.

Minimal fix: retain the loader while isLiveLoading is true; when it is false and no value exists, show Unavailable. All supplied-value formatting, market requests, execution/fees/positions/balances/history, auth/DB/progress, privacy/ad and infrastructure behavior remain unchanged. No financial number is invented. Regression fixtures require missing-value Unavailable/no spinner at five widths and preserve a supplied $1.23B value. The full exact-head CI/preview and serial native-production/live gate is required. Do not merge before #223 completes its own cycle.

Implementation risk is low and reversible. Rollback is a protected reviewed rendering revert with the same release verification; no data rollback.
