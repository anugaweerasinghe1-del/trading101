# October 11 implementation ledger

Verified main remains `0a31f949bfcbe6f03becc27d63ee4f688c082ed7`. All work below is in owner-reviewable drafts; none is merged, deployed to production or installed in Supabase. Planning #97 remains separate and AI proposal #95 is untouched.

## Implemented and independently checked

| Milestone | Code and validation evidence | Production state |
| --- | --- | --- |
| CI/protection prerequisites, [#98](https://github.com/anugaweerasinghe1-del/trading101/pull/98) | `acc19c5bdb85efd60defae71c114338294c7c9e1`; all three uniquely named gates passed in run 38114026842; trusted Pages deployment `e2d18184-1324-4f9d-858d-8fe60d79f508`; public preview routes/noindex/canonicals checked | Draft only; branch protection not activated; live docs-only/bot-origin demonstrations pending approved base workflow |
| Trusted evidence collector, [#99](https://github.com/anugaweerasinghe1-del/trading101/pull/99) | Initial head `74f83eaf9a9d1738cdc06f16e47a51adb7644203` passed runs 38114844878/38114844932 and Pages `a0c93b06-5adf-4083-bd3d-2958d6a65438`; public preview checks and Chrome Daily rendering passed. This PR also tightens CI check-suite/attempt binding; use its current head and newly reported checks, not the initial head's green status | Draft only; live monitoring predates producer attestations; no positive production collection claimed |
| Durable controls prototype, [#100](https://github.com/anugaweerasinghe1-del/trading101/pull/100) | `09da392ef9fa5a6f335c76ff74f38cab9a7123eb`; runs 38115397890/38115397805 passed; trusted Pages `1c908cd3-5651-48b0-9a9e-e2186a5e19c2`; home/courses/Daily/auth 200, invented route 404, preview noindex preserved | Offline SQL/test only, outside migrations; no database installation, grants, owner interface or live stop service |

Each PR records the latest exact head, runs, Pages deployment, preview tests and separate Worker result. Any changed head requires fresh verification. After an approved main merge, rebase and validate the remaining drafts against the new main before a separate release decision. The evidence collector's operational CI contract requires #98's three gates, although the edits are independent and do not import its new files.

## Local tests and practical limits

- CI: real gate CLI, malformed/missing/inconclusive upstream results, immutable checkout/outputs, current-suite/freshness checks and mocked proposal branch movement. Docs-only/bot behavior is structurally tested, not live demonstrated on main.
- Collector: real intercepted GET reader, producer digests, tampered/legacy/duplicate/conflicting evidence, freshness, identities/attempts, re-read races, trusted Pages, independent Worker, pagination gaps, request/time/size bounds, stripped redirect credentials and private-data omission. All authorization flags remain false. The amended collector also rejects absent/ambiguous/stale/wrong-suite required jobs and mismatched PR contexts.
- Controls: disposable PGlite persistence/restart, default/missing stop, attempt/frequency history, one-active database constraint, SHA/digest/generation binding, expiry and denied application roles. Real PostgreSQL multi-session concurrency and live owner identity remain unproven.
- Existing repair, monitoring, AI/release and offline backend trading/isolation regressions passed. A local combined checkout of the three independent code drafts applied without conflicts and passed their combined gates; this was never pushed or released. Subsequent collector amendments require updated combined validation, recorded in #99.
- Ordered production-equivalent build stages passed with 349 prerendered routes (147 indexable, 202 noindex), SEO and Cloudflare course checks. Local standard npm is blocked by executor `tsx` IPC EPERM; remote normal npm builds passed for the heads above. This environmental failure is not hidden as a local npm pass.

## Verified baseline and blockers

Main remains unprotected with no active rulesets. Its Phase 3 and Pages deployment passed. Vercel reported READY for main; www is served by Cloudflare and the Vercel apex redirect preserves path/query. Public critical routes returned 200. These responses do not establish authenticated trading functionality.

Read-only Supabase inspection found the existing functions and active five-minute portfolio/course/Daily schedules. A recent portfolio refresh reported 51 of 52 symbols updated; a bounded seven-request log sample returned 200. These samples do not erase prior 429s, demonstrate account quota headroom, or prove future Daily regeneration/user persistence. No financial behavior or polling changed.

The separate `thetradehq` Worker still fails on all three draft heads. Repository references and owner screenshots do not prove absence of external dependencies. Cloudflare dashboard access remains sign-in blocked. Before any release decision, obtain its current triggers, bindings, routes/domains, request traffic and external-caller evidence. Pages success does not resolve Worker failure.

Provider billing-cycle usage, free-tier exceptions, AI quota headroom, current AdSense status and a verified eligible production rollback remain unresolved. No provider, schedule, quota, model call, secret or billing setting was added or expanded. No new authenticated account or production user mutation was performed. A non-production test environment is still needed for complete authenticated end-to-end regression.

## Next work and maturity

First: owner review of #98's exact configuration, with activation only after approved code and disposable docs/bot demonstrations. Second: after separately approved collector code and an existing subsequent monitor run, demonstrate trusted collection with already authorized read access; legacy reports stay blocked. Third: test real PostgreSQL serialization and design verified owner/backend identity before requesting any database installation or grants. Full typed failure evidence, root-cause reproduction, constrained repair proposal integration and authenticated regressions remain later prerequisites.

The 14-capability baseline stays **17/42 evidence-stage points**, approximately 40% of the defined maturity rubric. This is not a percentage of maintenance work automated. Unmerged code, preview success and an uninstalled prototype do not justify increasing the production maturity score. No unattended repair, merge or release is enabled.
