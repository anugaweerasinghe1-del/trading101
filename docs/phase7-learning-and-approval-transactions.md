# Statistical incident learning and atomic approval transactions

This continuation builds on the authenticated feedback integration in PR #130.
It adds a real, bounded statistical trainer and replaces the approval service's
previous test-only transaction callback with a reusable tested SQL adapter.
Neither component grants repair, merge or production-release authority.

## What the trainer actually learns

Regularized logistic regression estimates whether a fixed investigation action
will receive a **reported unsuccessful outcome**, using fixed category, route,
action and category/action features. Feedback remains owner-reported and
unverified. The prediction is not the probability of a real root cause or a
successful repair. No model provider or network request is used for training.

The existing read-only monitoring handoff retrains from retained structured
feedback on each cycle. It emits a separate shadow-learning record; deterministic
suppression, risk, investigation advice and release authorization do not change.
Predictions cannot reinstate failed recommendations. Empty or inadequate history
produces abstention, rather than an invented model or an extra provider call.

Training is bounded to 100 records, 250 gradient steps, thirty-day retention and
fixed input features. Duplicate labels count once; contradictory or future
labels are rejected. At least ten distinct incident runs are required. Evaluation
holds out the newest twenty percent of whole run groups and purges training
groups whose later labels overlap the held-out period. Both partitions require
both outcomes. The model must beat an intercept-only training baseline on
held-out log loss before it can emit shadow estimates. Individual predictions
also abstain outside observed context or after twenty-four hours.

Tests use 40 deliberately synthetic run groups: 32 training and 8 held out.
Measured baseline log loss is approximately 0.6931 and trained log loss 0.03475
on those deliberately separable labels. Tests show weights changing with labels,
stable deterministic training, duplicate invariance, time leakage rejection,
unsupported context, single-class/no-benefit abstention and rejection of imported
model objects. This demonstrates training mechanics, **not production accuracy**.
No representative independently verified repair-outcome dataset exists yet.

## Atomic approval adapter

`createRepairApprovalTransaction` implements the existing server approval
service's database callback. It is disabled by default and currently accepts only
the disposable-fixture activation mode. It has no database connection constructor,
credentials, public endpoint, role grant or deployment hook.

Within one transaction it locks the policy and candidate in consistent order,
reads the database clock after acquiring both locks, checks stop/generation,
lease and immutable source/evidence bindings, optionally records validation,
inserts a unique signed receipt, records approval and verifies the exact audit
transition. Any failed insert or later check rolls back every earlier write.
The caller receives acknowledgment only after the database provider commits.

The companion SQL proposal creates a private RLS-enabled receipt registry. It
remains outside migrations and refuses installation without the existing explicit
offline-test setting. It grants no application role access, including service_role.
Unique approval, candidate and digest constraints prevent replay after reconnect.
Owner identifiers are stored only in this private disposable registry, not public
incident logs. This is an internal transaction ledger, not tamper-proof auditing.

PGlite tests call the actual signed owner service and adapter together. They
cover replay, denied roles, changed evidence, stop, expiry, missing state and an
actual trigger fault after validation that must roll back both status and registry.
The existing PostgreSQL 17 harness also exercises the adapter over a separate
connection, observes the real policy-row lock wait, commits an owner stop before
the waiting approval, checks no receipt was inserted, then exercises accepted
approval and replay rejection. Remote exact-head success is required before
claiming those database demonstrations passed.

## Activation requirements that remain

Production still needs an explicitly registered server-verified owner account,
an owner signing identity, an approved private backend role and connection,
installation of reviewed SQL, a live stop interface and independently reproduced
incidents with mechanically constrained source proposals. The existing prototype
is restricted to About typography/layout and keeps permanent fingerprint history;
it is not a general-purpose site repair controller. Do not widen that allowlist
or erase attempt history to make a demonstration pass.

Medium/high-risk final merge and deployment require the owner's consent. Exact-head
CI, PostgreSQL and both hosting previews precede that decision; production CI,
provider metadata and public checks follow any approved merge. There is no automatic
merge, rollback, new model request, paid service, schedule or production SQL mutation
in this continuation. The original 29/42 maturity score stays unchanged until the
relevant operational evidence is demonstrated and reassessed.

Run `node scripts/verify-incident-learning.mjs` and, with locked dependencies,
`node scripts/verify-repair-approval-transaction.mjs`. Both are part of the existing
AI-agent gate. The existing disposable PostgreSQL check runs the actual lock-race
test. Local full dependency/build tests remain unavailable while the workspace's
network proxy refuses connections; remote normal CI supplies those checks.
