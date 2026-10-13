# GitHub repair workload identity preparation

The installed owner-control plane remains stopped. This server-only library is
preparation for authenticating a future repair job without installing another
long-lived service key in GitHub. It does not mint a token, deploy a route, grant
GitHub id-token permission, change database grants or start a worker. The factory
is disabled by default and currently permits only identity-only-fixture mode.

The verifier uses native WebCrypto RSA signature verification and fetches signing
keys only from GitHub's fixed HTTPS issuer/JWKS address. Token-provided key URLs,
keys, unsupported algorithms/critical headers and ambiguous key IDs are rejected.
Key responses are bounded to 64 KiB/16 keys; stages have ten-second deadlines.
Header/payload/signature sizes and canonical base64url are bounded. Only RS256,
public RSA 2048–4096-bit keys, and the required GitHub issuer/custom audience are
accepted. No token or exception details are logged or returned.

The signed identity must bind repository 1130435580 and owner 297117529, the exact
current repository name, public visibility, main branch, workflow_run event,
GitHub-hosted runner and the existing trusted-evidence workflow path. Source and
workflow SHAs must match. Both documented legacy and immutable-ID main subject
formats are accepted while immutable repository/owner claims are mandatory in
either case. Custom subjects, environments, PR events, other workflows and
unapproved reusable workflows deny access rather than guessing their intent.

After signature/claim checks, operator-owned GET-only GitHub reads independently
verify protected current main, workflow ID 381133473, current run/attempt, immutable
repository/head identity, and the actually running collect job/check ID from the
complete bounded attempt job list. Main is re-read afterward. Missing, completed,
stale, changed, ambiguous and incomplete metadata fails closed. The input cannot
provide those facts or callback functions; a future server owns the reader wiring.

Tokens must have been issued less than 60 seconds ago, with a valid not-before and
expiry and no more than fifteen minutes of signed lifetime. That fifteen-minute
bound is a local acceptance ceiling, not a claim about GitHub's actual default
lifetime. Returned principals expire at the earlier of signed expiry and the
60-second local freshness limit. They have an in-process private brand: imported
JSON, clones, changed main and expired principals cannot pass the consumer guard.
Only a hash of issuer/JTI is retained; the raw bearer token is not returned.

Authentication is not repair or owner approval. All action-authority flags remain
false. In particular, repeated valid tokens are **not** an atomic replay ledger.
Before any future side effect, a separately reviewed server must atomically consume
the token digest with the stopped/generation/lease/one-candidate/attempt controls,
recollect independent incident and exact source evidence, reproduce before/after,
and require independent exact-head tests. No machine token can substitute for
the user's medium/high-risk final merge consent. This module cannot confer those
permissions or alter the deployed owner's binding/key/session controls.

The fixture generates real disposable RSA keys in process, cryptographically
signs sample tokens and exercises 56 adversarial cases: signatures, algorithms,
key URLs/ambiguity, times, subject/IDs, fork/PR/ref/workflow/runner metadata,
run/attempt/check identity, pagination, main change and imported/expired principals.
Keys, claims and GitHub transport responses are isolated fixtures. No actual
GitHub OIDC token or live issuer acceptance has been demonstrated. Activation
requires an owner-approved protected-main job permission/endpoint/control change
and successful real minted-token verification before any proposal action.

Primary contract checked on 13 October 2026:
https://docs.github.com/en/actions/reference/security/oidc . GitHub documents both
subject formats and the immutable-ID rollout beginning July 2026. Existing
workflow permissions were inspected and remain unchanged by this proposal.
