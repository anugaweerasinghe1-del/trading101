# Publish an exact owner-reviewed proposal from admin

The existing owner coding queue now offers **Approve and publish this exact code**
only after independent proposal validation passes. The server reauthenticates the
registered, confirmed owner and administrator key. Approval consumes the reviewed
head/view receipt within ten minutes and stores its immutable head, original main,
patch digest and decision time privately. Approval and rejection are exclusive;
repeated approval cannot create a second publication or erase a rejection.

The protected-main native worker claims an approval once, verifies the full
base-to-head comparison with the existing mechanical frontend preflight, then
makes the exact bot draft ready for review. It dispatches only the existing Phase
3 and disposable PostgreSQL workflows on that proposal branch. This handles the
GitHub token event behavior without a PAT, another provider or forged owner PR
reviews. Only this worker gains `actions:write`; the publisher and read-only
preview job cannot dispatch workflows. Existing schedule and code-request/model
budgets are unchanged, and publication itself calls no model.

A separate, credential-free-of-code-execution job runs reviewed **main** scripts,
never proposal code with provider credentials. It waits for exact-head native
Phase 3 / all three protected checks and disposable PostgreSQL, probes the real
immutable Cloudflare preview routes, verifies the authenticated Cloudflare
preview environment/branch/SHA and independently reads the exact READY Vercel
preview twice. Both existing provider read credentials stay in that step. Failure
stops publication rather than inventing preview success or switching providers.

The native publisher must redeem that same request/run once. The server reads
the actual completed preview job on its claimed run, rechecks exact-head native
CI and independently reads the unchanged ready PR. The worker checks current
protected main and head immediately before one exact-head squash merge request.
GitHub branch protection remains enforced for everyone. No owner GitHub review
is submitted or impersonated. A failed or ambiguous merge is not blindly retried.

A merge changes main, so the old job's main-bound identity cannot report success.
A later worker on the new protected main reads actual merged bot PR metadata and
the squash parent, and reconciles the saved attempt without repeating the merge.
It dispatches main Phase 3/PostgreSQL once because GitHub-token merges do not
trigger ordinary push workflows. Main Phase 3 now runs read-only release readiness
for that explicit dispatch, requiring existing provider credentials and checking
native canonical Cloudflare production, direct active READY Vercel production
and the five real public routes. Only a later independently read successful
exact-main native run/three checks/PostgreSQL/readiness changes admin to
**production confirmed**. Merged is a separate, pending state. Changed main, an
unconfirmed completed publishing run or a release still unconfirmed an hour
after its dispatch is recorded as blocked, with the native run available for
inspection. No automatic rollback or paid retry is introduced.

Validation uses the actual handler, database migrations, native preparation,
provider probe and merge helpers in isolated fixtures, including stale receipts,
wrong identities, changing heads/base, wrong preview environments and a lost
response after a simulated merge. Native PostgreSQL additionally checks distinct
session publication locking, idempotent owner approval and one consumed merge
authorization. Compiled Chromium checks exact-receipt approval and distinct
waiting, merged and published displays. Fixture approvals and results are never
inserted into production or counted as operational evidence.

This implements the approval/publication path, pending a real eligible owner
request and deliberate owner approval. No real owner queue request, publication
or native learning outcome existed when preparing this change. The original
14-row maturity remains **33/42**; implementation and fixture success alone do
not establish operational acceptance. Autonomous production source repair and
confirmed incident-learning outcomes remain unfinished. Daily and Watcher tasks,
Daily counters, billing and original stopped repair controls are untouched.
