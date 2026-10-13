# Narrow repair draft runner

`createConstrainedRepairRunner` supplies the orchestration missing between the
existing evidence, mechanical source classifier, durable claims, isolated code
proposal, independent validation and review queue. It is disabled by default;
it has no endpoint, credentials, database connection or production deployment.

The caller supplies only a candidate identity. Server-configured adapters collect
the actual current main, fresh independently reproduced incident and exact base
source. The only admitted repair is a mechanically LOW spacing/typography edit
to existing `src/pages/About.tsx`, concerning heading readability or layout.
Protected routes, unknown causes and larger edits are rejected before admission.

The runner independently reproduces before-failing/after-passing source bytes,
requires a durable claim, rechecks current main and stop/generation/lease before
each subsequent stage, prepares an isolated immutable commit and re-reads its
full change. The independent classifier runs again on that actual change. A
separate exact-head validator must pass before draft publication. No model result
or user JSON can supply a trusted incident or adapter callback.

External draft publication cannot be atomic with a database stop. The runner
therefore checks the actual returned draft and control state after publication.
If stop or another guard wins during publication it closes the draft while
retaining the consumed attempt. Failed cleanup explicitly requires owner
inspection. Unknown publication results also require inspection and cannot be
retried automatically. There is no merge, release, automatic rollback or budget
reset operation in this library.

The fixture test creates a real temporary isolated Git repository and exact
before/after commits. Evidence/control/GitHub adapters in that fixture are
synthetic, with no production access. Tests reject content edits, hidden elements,
protected paths, wrong heads, failed independent tests, stop, changed generation,
expiry and repeated admission. They also cover stop during publication and failed
compensating cleanup. This is an orchestration demonstration, not a genuine
TradeHQ production repair or proof that live adapters are installed.

Run `node scripts/verify-constrained-repair-runner.mjs` with locked dependencies.
The existing AI-agent check runs it. The SQL adapter's independent PGlite and
PostgreSQL tests remain separate. Production still needs verified backend/owner
identity, reviewed control installation, a live stop interface and real reproducer,
source and GitHub adapters; connecting those requires the owner's approved release
and activation plan. Every proposed head then requires independent CI and exact
Cloudflare/Vercel previews, followed by the user's final merge rule and production
verification. No 42-point maturity increment is claimed by this fixture alone.
