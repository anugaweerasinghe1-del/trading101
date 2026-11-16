# Diversification source-access repair — PR 443

Original remediation: **18/19**. Fresh exhaustive site audit: **0 completed pages**. The 480-URL queue, including 163 current sitemap entries, remains unread for the new audit. This release repairs the publication prerequisite; technical checks and a source-document review do not count as a fresh AdSense page review.

## What was confirmed and fixed

- **STRICT-PRE-006:** Diversification draft 5 could not reach independent review because both cited Investor.gov sources were unavailable. Public Supabase requests 11420–11422 returned explicit HTTP 403 Access Denied, including robots.txt. No attempt was made to evade the refusal. Add two freshly read ASIC Moneysmart primary references to the exact publication allowlist and to each lesson's citations, retaining the original references. Supabase public requests 11424–11426 verified robots and both canonical HTML pages. There is no cached approval, source snapshot fallback, uncited substitution or relaxed two-source gate. Generation inputs are unchanged.
- **STRICT-PRE-007:** A fresh complete draft read found three factual inconsistencies: continuous simulator prices, an execution explanation omitting fixed simulator inputs, and an unconditional claim about crypto-driven portfolio drift. Correct all three exact passages in the saved document and in shared server/client display corrections. The fresh source-document ledger covers 24 body paragraphs, 12 headings, 12 questions, 48 choices, 12 explanations and metadata (165 hashed string fields). All quiz answer indices and course/lesson URLs are preserved. Schema/quality checks, renderer identity and independent worksheet arithmetic pass.

The saved revision 6 exactly matches the intended guarded repair. Its status is draft; published revision remains 3. The save used the existing procedure after matching revision 5 and the full expected document, preserving optimistic concurrency. No publication was performed by the assistant. No new standalone model request was made; the earlier single approved diagnostic remains consumed.

These are source-access/integration and factual teaching findings, not asserted Google violations. Reviewer: Codex, a prior contributor; no independent human or Google certification is claimed. Media rights and a complete live-page policy review are outside this source-document checkpoint.

## Release evidence

PR: [443](https://github.com/anugaweerasinghe1-del/trading101/pull/443). Exact head: `bd7693f899e7f6c3792b07070bde14c2c692377f`. Protected squash merge: `6d1346afdc4ee4ba272c9617a0dabe77ab24e91e`. All five required checks passed on that head, including Cloudflare compatibility/route checks and the actual Pages preview. See [check snapshot](pr443-final-checks.json).

Local TypeScript and full Cloudflare build/postbuild checks passed. New reference fixtures verify exact cited canonical URLs, deduplication, rejection of arbitrary/query-modified URLs, disabled redirect following, no uncited fallback requests, and fail-closed HTTP 403 behavior. Fixtures do not invoke the real model. See [local checks](local-validation.json).

The production `admin-courses` function is active version **22**, bundle `c2b2f337dd95e8b3a38fa51d62b84abf2b33b1b5726db05fd528981c85ebefff`. All 12 read-back source files exactly match the merge commit; only the publication reference allowlist changed from the previous backend. Existing JWT/body-owner authorization settings were preserved. GET/OPTIONS/unauthenticated publish return 405/200/401. See [deployment](backend-deployment-receipt.json), [source binding](function-source-binding.json), and [runtime checks](backend-runtime-verification.json).

The actual preview and production lesson pages return HTTP 200. Their native course data contains all three exact corrections; both affected body paragraphs render, and all 12 quiz answer indices remain intact. This is an affected-passage recheck against published revision 3's display copy, **not** proof that source revision 6 has been published. See [preview](preview443-live-verification.json) and [production](production443-live-verification.json).

Native Cloudflare production identity is independently verified: deployment `dfb4fb9f-7e76-442d-b973-25cd6e2dd76f`, production/main/success, exact merge `6d1346afdc4ee4ba272c9617a0dabe77ab24e91e`. The existing read-only account collector observed it at 2026-11-16T01:39:51.248Z with an active native token. Main run 43786546879 completed successfully, including release signals/readiness. See [filtered native receipt](native-production-receipt.json) and [main workflow jobs](main443-final-jobs.json). No billing data or credentials are published.

## Remaining gates and next action

Bitcoin revision 9 and Price Feeds revision 5 are independently verified in storage and across all four live routes each. Price Feeds also matches the exact originally prepared revision 5. Their verification records are in [the source-access evidence directory](../source-access/).

Release verification is complete. The owner must refresh the course desk, reopen saved Diversification revision 6, review it and publish through the normal registered-owner workflow. The connected owner-browser provider cannot start because of its reported credit limit; no credentials are extracted or owner gate bypassed. The final four routes must then match the complete stored publication and intended revision 6, including all body paragraphs and quiz objects. Only that result can complete the original 19/19 remediation. Then begin the new word/block review with the homepage, following the documented sequential loop.

Investor.gov source retrieval remains externally blocked and is recorded separately, rather than labelled verified or false. The new citations provide current independent-review inputs; their presence does not guarantee that a fresh model review or Google review will pass. Ad serving and the existing account-access/optional-analytics policy remain unchanged.

Final storage checkpoint: [dated record](final-publication-state.json) confirms Bitcoin 9/9 and Price Feeds 5/5 with exact draft/publication equality; Diversification remains draft 6/published 3. The original count remains 18/19.
