# PR441 — confirmed review-contract mismatch

One explicitly approved diagnostic request reproduced a concrete service/application defect: Gemini returned HTTP200/STOP, PASS, and three positive checklist notes in findings. The requested old schema permits that response, but the application requires an empty findings array for PASS. The prompt did not specify that findings must contain defects only. This mismatch can produce the unavailable/invalid-response banner even when the provider returned a completed response.

The failed production attempt at2026-11-15T10:29:11.414Z did not retain its raw provider body. Its logs show that only the two CoinGecko references were available and that the handler failed in about4seconds. The controlled probe used saved Bitcoin revision9 and the same available citation pair from captured excerpts; the original attempt’s excerpts were not retained. Do not claim that the probe is an exact replay of the lost body or that its praise proves financial accuracy/AdSense approval.

## Authorization and controlled request

Automatic approval review rejected the unapproved server-side probe because it would send unpublished draft text and an audit prompt to Google. No request was made under that rejection. The user then explicitly answered “Approve one Gemini diagnostic request”. Exactly one diagnostic request11247 was sent using the existing free-confirmed Gemini3.5FlashLite configuration. Supabase supplied the stored key directly in its HTTPS authentication header; the key was not returned to the assistant, browser or published artifacts. No course publication, source edit, account change or review attestation was performed.

The response was HTTP200, finishReason STOP, promptTokenCount7444, candidatesTokenCount98. See `approved-probe-evidence.json` for the bounded response and scope. The authorization is consumed; there were no further real diagnostic model calls. All following tests use offline fixtures. The provider’s account billing/quota status was not independently certified.

## Fix and verification

STRICT-PRE-005 uses a documented property-level anyOf schema: decision PASS/findings[] or BLOCK/findings1..8. The prompt explicitly reserves findings for unresolved defects, excluding praise/checklist notes. Local validation remains strict. It never drops notes to manufacture PASS, converts legacy/contradictory replies into approval, or selects PASS from conflicting candidates. A complete STOP result is required; truncation remains blocked.

Bounded failure codes and safe metadata now reach private logs and the protected error adapter. Contract contradiction, incomplete/truncated output, malformed envelope/JSON, and request/HTTP/read failures have distinct categories. Raw provider envelopes and credentials are withheld. Existing owner authorization, revision locking, model,1700-token output budget and no-paid-fallback behavior remain intact.

PR: https://github.com/anugaweerasinghe1-del/trading101/pull/441

Validated head: `fa91c3028a759862a4d8b57d59d505141ca5466f`.

Protected merge: `b9b6a147304eed200a51d2bfbd09492a85544588`.

All five required checks passed on that exact head. Backend admin-courses version21 is ACTIVE; all12 deployed files match merged source. Runtime method/auth checks passed405/200/401 without credentials or a model call. Production’s actual served adapter passed eight existing synthetic failure cases, preservation of designated concern fields, and three new diagnostic cases for PASS_WITH_FINDINGS/OUTPUT_TRUNCATED/INVALID_JSON. Synthetic results are not actual provider verdicts.

Native Cloudflare account verification PASSED at2026-11-15T11:22:46.985Z: deployment `b51bbdfc-afe5-4971-8ddd-edeccbf29705`, production/main/success, exact merged SHA. The account collector verified an active native token and canonical deployment. Source job and filtered receipt are retained in `native-production-receipt.json`. Main validation, native release signals and read-only release readiness also passed.

## Evidence and remaining limits

Tests retain the actual approved response as a minimal fixture. Existing Zod independently validates that the old request schema accepts it while the new conditional contract rejects the contradiction. Tests also cover valid empty PASS/nonempty BLOCK, malformed data, conflicting candidates, truncation, protected handler propagation and secret exclusion. TypeScript, course workflow/admin safety and the Cloudflare build passed. Current official Google structured-output documentation was read for anyOf/enum/array cardinality and its unenforced string-length limits; the existing600-character application limit remains enforced. The new protocol has not received an additional standalone live Gemini request, because only one was authorized.

The final independent database read at2026-11-15T11:24:46.864Z still shows drafts9/5/5 and published6/3/3, all draft statuses. See `final-publication-state.json`. One normal owner publishing attempt for Bitcoin9 was requested after the code/deployment verification; its result is pending.

The normal owner publishing flow still needs a successful current-revision review and publication, followed by stored-document/live parity checks for all three courses. This diagnostic result is not inserted into independentReviewStatus or used to bypass the application gate. Prior19-proposal completion remains18/19. The fresh strict site audit remains0 completed pages and all480 queue rows unread; this service repair is not paragraph-level page review.

Previously blocked FINRA/Morningstar source checks remain separate. Their failed fetches are not proven content errors or proof of what a future worker request can access. No human/Google acceptance is claimed.
