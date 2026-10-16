# In-site proposal review and decline

The owner can load a code proposal's GitHub diff directly in the existing admin
coding queue and decline it there. The endpoint independently authenticates the
registered owner and master key, resolves the stored PR, checks its bot identity,
exact head and branch, and rereads the head after loading bounded file patches.
The diff renders as plain text. Missing/oversized patches are unavailable rather
than replaced by a model summary.

A server receipt binds the review to its request, exact head, patch digest and
view time. Declining uses that receipt (ten-minute window), records one durable
owner decision and requests closure. Duplicate submissions do not duplicate the
decision. Independent validation must have finished before review; a validation
pass is not erased from learning history when the owner declines the proposal.

The existing native worker processes one declined draft before its coding budget
check. It rechecks the exact bot PR and current protected main before PATCHing
only `state:closed`. The server independently rereads the actual GitHub state
before confirming closure. A changed proposal is blocked. If a worker disappears
after closing, an expired claim can be reconciled by a later worker: an already
closed draft needs no repeated write. Close claims and outcomes are in the admin
audit, with a link to the actual closure run. The UI distinguishes a saved decline,
a claimed close, confirmed closure and an unconfirmed/changed proposal.

This completes review and rejection from the website. Approval/publication from
admin remains unfinished; code still requires the existing deliberate release
path and all required checks. No merge, production deployment, new credential,
model call or expanded workflow permission is introduced by declining a draft.

Validation uses disposable SQL plus the actual handler and worker helper for
receipt expiry, changed-head rejection, duplicate decisions, lost responses and
independent closure confirmation. Real PostgreSQL covers distinct-session close
claims and one committed closure event. Compiled Chromium covers the actual admin
diff, inert markup in a patch, and saved/pending decline display. These fixture
outcomes are not production owner decisions or rubric points. No fabricated
proposal or owner review is inserted into production to demonstrate the feature.

Original maturity remains 33/42 pending relevant real operational acceptance.
