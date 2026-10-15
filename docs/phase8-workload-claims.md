# Disposable workload replay and claim transaction

The existing GitHub verifier authenticates a short-lived, privately branded
principal. It does not authorize repair. Its JTI digest alone was not a durable
replay ledger. This preparation adds a **disabled, disposable-only** claim adapter
that combines that identity with the existing PostgreSQL stop/attempt boundary.
No runtime route, database connection, migration, grant, worker, new credential,
workflow permission, model call or publication method is added.

The operator must own the database and current-main adapters and independently
collect/reproduce the incident before entering this boundary. Callers/models
cannot provide trusted adapters or import a principal from JSON. The exact scalar
candidate/source/symptom/base/evidence/generation binding is copied before any
await. Only the existing mechanically LOW About-page scope is eligible.

One transaction locks the existing policy row, rejects stop/generation changes,
re-reads main, and checks principal freshness against the database clock **after**
lock/network waiting. It applies the existing one-candidate, one-attempt and
daily-budget claim function, inserts a unique token/candidate receipt and checks
the resulting claim and freshness again. Failure rolls back the candidate,
accepted-transition audit and receipt together. The receipt stores only a token
digest and public immutable coordinates, never a bearer token or raw claims.
The existing owner approval and release paths remain separate.

Receipts have RLS and no PUBLIC/anon/authenticated/service-role access. A policy-
serialized 100-receipt capacity fails closed for owner review; no automatic
pruning, budget reset or production cleanup is introduced. PostgreSQL cannot
atomically lock GitHub main/job state or an eventual external draft request.
The existing runner's fresh checks before every side effect remain necessary.
Claim authorization at transaction time is not ongoing action authority.

The new tests extend the already guarded fixed-loopback PostgreSQL17 fixture.
They use actual disposable RSA signatures and distinct database connections:

- A cloned principal cannot reach the durable boundary.
- A committed stop, changed generation or changed main defeats a waiting claim.
- A token expires against real wall/database time while waiting for a row lock.
- Two sessions actually wait; exactly one claim/receipt/audit commits.
- A new connection independently verifies the same fixture token. Even after
  explicitly advancing disposable history to isolate the replay check, its
  consumed digest rejects a second candidate and rolls back that new audit.
- A forced transaction failure leaves no claim, receipt or audit.
- Explicitly synthetic capacity rows cause admission to fail closed.
- Existing app roles cannot read receipts; input mutation cannot switch binding.

The test's history resets/aging affect only the independently checked disposable
database. They are not a production recovery mechanism. Initial local execution
correctly rejected the missing disposable-context setting after an older reconnect
test replaced its session; restoring the setting after fixed fixture identity
validation made the complete suite pass. The SQL remains outside migrations.

Production main `491bcf0612314040cc01570b297dbb03c691308d` was verified on canonical
Cloudflare `5466da00-f137-487a-af7f-b7e919125588`, native job `116340702947`, and
Vercel `dpl_D4FjTaryWQhHSmJCR8u4iFZzapua`. The real collector `38710928531`, job
`116341807764`, passed timestamp checks but explicitly reported BLOCKED at
CLAIM_SCOPE/noReusableWorkflow: supplied job-workflow claims are still rejected.
No genuine live identity acceptance or worker operation is claimed. That separate
compatibility issue needs a strict exact-self-workflow proposal and owner review.

The production worker remains stopped. This disposable demonstration is not a
confirmed repair outcome, ML training example or new original-rubric point.
Original maturity remains **32/42**.
