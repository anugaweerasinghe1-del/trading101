# Website coding queue

The owner authorized continuation, including the previously blocked single Daily
attempt, on 16 October 2026. The existing $0 budget remains binding.

The AI development desk can now save a real code request without a GitHub issue
handoff. The server verifies the registered owner's live Auth session and the
existing administrator key. Requests, immutable request identities, worker
claims, proposal references and independent test outcomes are stored in a private
database queue and event history, displayed in the admin desk.

The existing code workflow polls about every fifteen minutes (GitHub scheduling
can be delayed). A dedicated protected-main job authenticates to Supabase with a
fresh audience-bound GitHub OIDC token. Fixed repository/owner/workflow IDs,
issuer signature, current protected main, exact running native job, first run
attempt and token lifetime are checked. No persistent GitHub token or Supabase
service credential is added to GitHub or the browser. The existing read-only
collector identity retains its separate audience, workflow and job restrictions.

One owner request is admitted per rolling 24 hours, with one active request and
one durable worker claim. Lost workers expire without a model retry. The worker
also checks existing GitHub-owner issue history before claiming, so simultaneous
issue and website requests do not independently consume the same daily budget.
Duplicate form submissions use an idempotency key; a lost response does not
create another request. Queued work can be canceled. No endpoint can reset a
claimed attempt.

Both entry points reuse the same existing bounded frontend proposal engine and
independent scope guard. The model may prepare one or two existing eligible TSX
files, with unchanged restrictions on logic, credentials, finance, backend and
dependencies. An isolated read-only job checks the exact proposed commit before
the result is recorded. Model output never reports its own tests as verified.
The result endpoint reads the native validation job independently.

This release creates draft proposals. It does not enable automatic merge,
production repair, rollback, or a trained incident model. A successful build
establishes build validation, not that a request was semantically fulfilled or
an operational incident repaired. Existing learning must still abstain without
enough real outcomes. The original rubric is unchanged; no point is assigned for
this implementation alone.

Validation includes actual SQL queue/idempotency/claim/event behavior in PGlite,
signed RSA identity boundary tests, the actual shared proposal engine with
disposable source and fixture transports, and the existing compiled Chromium
regression extended with direct website submission, duplicate submission and
cancellation. All test identities and provider responses are fixtures. Release
requires exact-head CI and previews, followed by production migration/function
installation and exact-main Cloudflare/Vercel readiness verification.

The separately authorized Daily attempt is a native one-shot job at 16:16 UTC on
16 October (21:46 Sri Lanka). It removes itself, permits exactly the approved
3-to-2 counter adjustment only for the observed unchanged failed cycle after its
cooldown, and calls the existing authenticated generation path. It does not
publish or create an automatic retry. Its successful execution remains pending.
