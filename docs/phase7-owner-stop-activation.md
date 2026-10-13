# Stopped owner control installation proposal

This release prepares a real Supabase Edge endpoint and admin desk stop/status UI.
It does not install SQL, configure a production owner, deploy an Edge Function or
start a repair worker. The endpoint denies operations unless its explicit
`owner-stop-only-v1` code mode and independently registered database owner UUID
are available. A missing approved installation/registration denies operation.

The owner's selected account was found in the existing production project's
Auth records with its email confirmed. Its UUID is private database configuration, never
in this repository or a browser permission flag. Every endpoint request verifies
the bearer session through `supabase.auth.getUser(token)` and separately checks
the existing administrator master key. Anonymous, unconfirmed, different-owner,
invalid-session and missing-key requests cannot reach control RPCs. The browser's
`getSession()` only retrieves the bearer token; it never establishes authority.

The only accepted input is exactly `{ "action": "status" }` or
`{ "action": "stop" }`, bounded to 128 bytes/five seconds. Responses include only
policy generation, stopped state and active-candidate count. No incident, owner
record, receipt or key is returned. Status has a 20/minute owner budget; emergency
stop bypasses that budget so an exhausted/unavailable counter cannot block it.
Stop still needs live Auth and the database; an unavailable or lost response is
explicitly unconfirmed. Retrying stop is safe and idempotent. Neither UI nor API
has resume, reset, approve, code write, model, merge or release controls.

The UI requires a deliberate click, clears stale state while checking and allows
Stop to interrupt a pending status request. It abandons pending replies when the
workspace is locked/unmounted. A successful stop must acknowledge a stopped
policy and zero active candidates. No optimistic stopped state is shown.

## Reviewable installation and owner approval

`generateStoppedControlInstallation(verifiedOwnerId)` in
`scripts/agent-stopped-control-installation.mjs` produces SQL only. It does not
connect to a database or apply migrations. It assembles the previously tested
private policy/candidates/audit/receipts core and the new stop-only access proposal
under a distinct production installation guard, without setting the offline test
guard in production. The output requires a separately supplied
`tradehq.repair_control_install = owner-approved-stopped-v1` context.

Installation is one fresh transaction and must fail if the selected UUID does not
belong to a confirmed, non-anonymous Auth account. It refuses an existing schema
or non-fresh policy rather than overwriting it. The owner binding references that
account; transferring/deleting the binding requires a separately reviewed change.
The policy starts stopped at generation zero with no claims or approvals.

All private tables/functions remain denied to PUBLIC, anon, authenticated and
service_role. RLS stays enabled. Only three new public SECURITY DEFINER functions
are callable by the existing service_role: an internal owner configuration read,
owner status and owner stop. All use
an empty search path, fully qualified objects and the independently registered
UUID. The runtime supplies the verified UUID internally, never a client-selected
identity. The trusted server service credential can invoke these functions; its
possession is a server trust boundary, not proof of a human owner session.
No new database role is created and the service role receives no claim, resume,
approval or private table grant. Stop holds the existing policy row lock,
invalidates active candidates and commits its audit atomically. Repeated stop
does not increment generation or clear consumed attempts/quota history.

The separate owner approval must identify this tested code head, the generated
SQL artifact for the selected verified account, the existing Supabase project
`cbdktpjgczhthflspqjb`, and deployment of `repair-owner-control` in stop-only mode.
The server reads its owner UUID from the private installed binding after validating
the master key. No additional environment secret/configuration step is needed.
It must explicitly exclude starting a worker, production repair claims, new
credentials, model calls and autonomous merge/deploy. The existing admin key and
server service key are reused through secure server configuration, never read or
copied into source/chat. Installation/Edge deployment needs fresh production
checks before any later live repair adapter is activated.

## Independent verification

The HTTP fixture exercises real Fetch requests through the handler, server owner
verification and independent master-key denial, exact action/body limits, paused
configuration, status-budget exhaustion/outage, malformed/lost stop acknowledgments
and zero trusted client authority. All accounts and credentials are fixtures.

The generated SQL runs in PGlite and a newly created, fixed-name disposable
PostgreSQL 17 database. These tests exercise absent approval context, unconfirmed
account rollback, initial stopped policy, all app-role denial, service stop-only
access, wrong owner rejection, candidate invalidation, idempotency, retained
attempts and a real audit trigger fault that rolls back the stop. An independent
PostgreSQL connection must demonstrably wait on the policy lock while the service
endpoint stop holds it, then reject its claim after stop commits. The PostgreSQL
harness accepts only the existing explicit loopback disposable fixture; it
refuses existing target databases and removes only the database it created.

The compiled Chromium fixture checks signed-out denial, paused/unverified UI,
explicit stop acknowledgment, forged authority rejection, stop interrupting a
pending status request, and late response isolation after locking the workspace.
Full CI/preview results must be recorded for the exact proposal head; local
Chromium/dependency absence is not a passing browser/SQL result.

The statistical trainer now executes inside production's trusted evidence cycle.
Run 38401711740 on released main d74e72f produced NO_VERIFIED_INCIDENT and
ABSTAIN_INSUFFICIENT_HISTORY with zero records/runs; it did not fabricate a
trained model or confirmed repair outcome. This control proposal does not change
that learning policy or claim 42/42 maturity. Live repair adapters, signing/review,
operational repair outcomes and provider recovery evidence remain necessary.
