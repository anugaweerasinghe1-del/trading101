# Published Daily illustration corrections — approved operation

Read-only production checks confirm the effective50-exercise bank is `authored-2026-10-depth`, row `3ab17e80-bfa7-45a7-b6f0-5d70e1c26199`, revision1, effective2026-10-09. At2026-10-25T04:38:08.301464Z its `md5(document::text)` was `de727a5648082f5230dd7f34dc0aee17`. These observations concern published content, not user attempts. No write was performed.

| Exercise | Field in visual | Current | Proposed |
| --- | --- | --- | --- |
| practice-18 | bars[2].label | Transactions | Total fees |
| practice-18 | bars[2].value | 20 | 10 |
| practice-24 | bars[0].value | 40 | 2880 |
| practice-24 | bars[1].value | 0.1 | 2 |
| practice-24 | unit | illustrative age in hours | illustrative age in minutes |
| practice-32 | bars[0].value | 4 | 3 |
| practice-32 | bars[1].value | 6 | 4 |

The first case gives20 transactions ×$500×0.1%=$10fees. The second specifies Friday16:00 to Sunday16:00=48hours=2880minutes, and Sunday15:58 to16:00=2minutes. The third explicitly specifies fourth-interval losses of3% and4%, matching the existing $30/$40 keyed losses on $1000 holdings.

PRs233/234 already corrected these seven bundled fields. The published row still has all seven old fields. The earlier non-depth bank is not the active bank and is excluded from this proposal.

Requested scope is a guarded content-only correction of these seven fields in the active published bank. Before any approved write, re-read identity, revision, hash and old fields; a mismatch stops the operation. Preserve all50exercise IDs,500questions, keys, explanations, scenario text, bank identity/effective date, user records and started-attempt snapshots. Publication revision/audit metadata must follow the existing reviewed publication mechanism; no revision or permission bypass is proposed. Validate a complete cloned bank and compare it field-for-field before publishing, then verify the anonymous read response and rendered affected cases. No schema, auth, grants, financial engine or user-progress change is required.

The mission's section6 explicitly requires owner approval before production data modification. Prior PR233 records a separate approval claim for practice-32, but this session does not treat a PR description as new authorization for all three cases. The two additional cases require a concrete owner decision. No AdSense application or account setting is part of this request.

## Approval and release plan, 2026-10-25

The owner explicitly approved this seven-field plan in the continuation conversation: “Yes ofc dont stop just to ask me, continue and deploy, wait till successful move on”. This supersedes the decision-required checkpoint above. It does not authorize unrelated protected changes.

` scripts/operations/correct-daily-20261025.sql ` is a one-time operation, not an automatically applied migration. It locks the existing draft and batch, requires revision1, exact original hash and matching draft/document/effective date, constructs the seven-field edit, validates all50cases/500questions, then uses existing save/publish functions to produce revision2 and reviewer/timestamps. The general publisher changes a seeded document ID to its draft UUID; the operation restores the original public document ID inside the same atomic statement so existing progress stays associated with the same bank. All content besides the seven approved fields is checked against the candidate before commit. No schema, permissions, generation state or user table is changed.

The exact SQL is exercised by `scripts/verify-daily-practice.ts` against the original migration seed, including full content equality, stable ID, revision/reviewer metadata, stale-checkpoint rejection and duplicate-run rejection. Existing frozen-attempt regressions remain in the same suite. Required CI additionally exercises a disposable real PostgreSQL instance.

Release sequence: validate and merge the reviewed operation; wait for exact merged-SHA Cloudflare production success and live route checks; rehearse the production operation with rollback; execute once only if all guards still match; read back revision2 and verify the anonymous API and actual rendered `/daily` page. A released frontend alone does not resolve these published-content issues. Final immutable deployment/publication evidence belongs in the implementing PR description.
