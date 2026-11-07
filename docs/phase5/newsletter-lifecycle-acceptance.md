# Public newsletter lifecycle acceptance

The public subscription implementation is exercised by
`scripts/verify-newsletter-lifecycle.mjs`, which executes the actual TypeScript
Edge handler through the installed TypeScript compiler. Existing source, privacy
and SEO assertions in `verify-newsletter-public.mjs` also run this fixture, so the
normal build gates cover these HTTP branches.

The fixture replaces only the Supabase adapter, limiter, environment and email
transport. Its storage is isolated in memory; every recipient is at
`example.invalid`. The supplied email transport is a local function, never a
network client. Unexpected tables/destinations or forwarded visitor headers fail.
This is application handler coverage, not a live database, real mailbox, provider
receipt or deliverability claim. Separate existing PostgreSQL tests cover grants
and private signup boundaries; the actual production subscriber registry is not
queried or changed by this fixture.

Covered workflows:

- OPTIONS/GET behavior; explicit consent, honeypot and email validation.
- Pending opt-in, normalized address, stored token digest and resend cooldown.
- Expired, malformed, consumed and racing confirmation tokens. Exactly one
  confirmation succeeds and no confirmation activates a contact due to email API
  acceptance alone.
- No GET unsubscribe mutation; valid one-click and JSON unsubscribe, idempotence,
  invalid tokens, and preservation of existing opted-out state.
- Confirmation provider rejection, missing configuration, database failure,
  admission rate limit and the existing daily confirmation cap fail safely.
- Visitor cookies, authentication and IP headers never enter the email request.

No real confirmation/subscriber email, production editorial action or user-data
mutation is part of this test. Genuine owner no-send readiness and real mailbox
acceptance remain separate evidence; do not use this fixture to claim either.

## Subscriber-count outage recovery

The same fixture executes the real newsletter dispatch status handler. It
reproduced HTTP200 with a false zero when any exact-count request failed.
The handler now returns HTTP503 for errors, nulls, negative or fractional totals;
the existing admin refresh/error handling keeps that feed unavailable or stale
instead of presenting an invented zero. Valid zero counts remain valid.

Cases cover every returned contact status and denied master-key reads, with no
mail/provider request. No send, approval, recipient selection, quota, owner gate
or private-contact mutation behavior changes. Deploy only the reviewed dispatch
bundle after exact-head CI/merge, then verify source parity and safe auth denial.

The compiled Chromium fixture also covers HTTP503 audience recovery: the old
confirmed total and its successful refresh timestamp remain intact with a visible
error, and a later successful read updates the total. No editorial mutation or
email dispatch occurs while refreshing or recovering counts.
