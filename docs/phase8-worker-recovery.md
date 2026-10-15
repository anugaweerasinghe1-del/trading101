# Phase 8: process death and durable repair recovery

The existing constrained repair runner now executes inside a disposable child
process against the existing PostgreSQL 17 control fixture. Previously, the
runner's control adapter was synthetic and the PostgreSQL restart test only
recreated a client in the same process. Neither established what happens when
an actual runner dies during a claim or after preparing a proposal.

The existing PostgreSQL check now verifies:

- SIGKILL during an uncommitted claim: an independent session sees no candidate;
  after the dead connection releases the policy lock, no attempt, accepted audit
  event or transition remains. The same candidate can make its first claim.
- SIGKILL after the database commits its claim and the runner creates and rereads
  a real isolated Git commit: exactly one consumed attempt remains. A new runner
  process cannot reclaim it or attempt draft publication.
- A new runner after durable stop is denied. Existing separate-session tests
  still prove policy-lock waiting, stop-winning review/approval races, owner-only
  expired-lease recovery, retained daily budget, replay rejection and app-role
  denial.

IPC checkpoints synchronize the kill with the actual transaction/runner stage;
these are not timed guesses or handled exceptions pretending to be crashes.
Children receive only the fixed disposable database configuration and PATH, not
provider credentials. The child independently checks the existing strict loopback
URL guard and database/user/PostgreSQL identity. Checkpoint and child lifetimes
are bounded. Temporary Git repositories are removed after children exit.

No production SQL, control functions, grants, runner behavior, workflow
permissions, schedules, live adapters or worker activation changes. Incident and
before/after reproduction adapters are explicitly synthetic. The test's
publication adapter is a forbidden local marker, never GitHub. This verifies
actual process/SQL/Git behavior in a disposable environment, not production
repair success, owner consent, independent diagnosis or repeated real incidents.
The durable stop/budget row remains Stage 2 pending genuine operational recovery.

Run the existing `scripts/verify-repair-control-postgres.mjs` only with its
explicit fixture opt-in and fixed empty loopback database. The existing
`TradeHQ Disposable PostgreSQL controls` job invokes it without a new job,
permission or provider secret.
