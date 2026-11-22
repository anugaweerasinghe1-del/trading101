# Independent correction release verification

PR [#536](https://github.com/anugaweerasinghe1-del/trading101/pull/536), validated candidate `a7f2a39ea843883563d4f5c02220448a68f22597`, merged normally into protected main as **`810d1a975b138331d1a55f1760fb7474ea1295a4`**. Before merge, GitHub reported protected main, a clean mergeable PR and success for all three mandatory exact-head checks: Phase 3 tests, Cloudflare build/SEO and Required validation. Disposable PostgreSQL controls and native Cloudflare preview also succeeded. Required validation run: [45018938221](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45018938221). Production/recovery jobs skipped on the candidate are not production evidence.

Native Cloudflare workflow [45019906068](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/45019906068), job `137200284188`, independently succeeded. The authenticated Pages API receipt at **2026-11-22T12:00:47.1176743Z** identifies project `tradehq-preview`, active production deployment **`bff3c431-6f1a-4725-98b1-16b0ae1d90e2`**, exact protected-main SHA **`810d1a975b138331d1a55f1760fb7474ea1295a4`**, public-domain binding, five checked routes and no limitations. The native verifier enforces successful production/main identity; neither a stale alias nor preview success substitutes for that evidence. Full receipt log and parsed JSON are retained.

After that receipt, independent native HTML checks reread all three changed URLs, confirming the replacements. Both course bootstraps preserve all 24 quiz answer keys/options versus the captured prechange live baseline. Six hydrated guest views (three URLs at 1280/360 widths) confirm the full replacement passages, canonical URLs, no overflow, no broken images, no uncaught errors and no attempted ad requests. No order, account, email, ad impression or account-setting operation was used. These are changed-route observations, not authenticated acceptance or complete accessibility certification.

## Six release controls

| Control | Result | Evidence |
|---|---|---|
| Exact protected-main identity | PASS | Protected GitHub main and merge result |
| Mandatory candidate checks and normal protected merge | PASS | Exact candidate, required success and clean PR |
| Native serving-provider production/environment/branch/commit | PASS | Authenticated Cloudflare verifier receipt |
| Public domain bound and available | PASS | Native binding plus independent public reads |
| Changed native/hydrated text reread | PASS | Three native routes, six browser views, 24 unchanged quiz key/option sets |
| Strict combined Vercel/recovery readiness | BLOCKED | No passing current receipt; earlier exact-main failures preserved |

The strict gate is not inferred to pass from Cloudflare success, and an absent Vercel status is not proof that visitors receive stale content. No DNS, provider, CMP or protection rule changed. Five bounded release controls pass; one remains blocked. Dated broad HTTP/browser checks in the preceding directory retain their actual SHAs.

A subsequent documentation-only PR packages this continuation. Its merge/release metadata belongs in a final release appendix or its PR description; code parity must be checked so documentation publication cannot silently replace the verified application. Do not create an infinite documentation-commit/receipt cycle.

The known 481-URL cohort was refreshed after native verification: 480 HTTP200 and one intentional404. All 78 profile bodies were discarded, retaining pseudonymized status-only records. The refresh records current metadata and redirect chains; old browser/indexability evidence is separately identified and is not silently advanced to the new SHA. Protected main remained `810d1a975b138331d1a55f1760fb7474ea1295a4` after collection.
