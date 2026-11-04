# Leaderboard signup funnel — consented, aggregate-only interpretation

**Created:** 4 November 2026  
**Release:** PR #336 (draft until its base leaderboard release #334 and the admin release #333 are verified)  
**Scope:** Website event instrumentation only. No Supabase user-table writes, customer emails or production automation.

## Exact observable events

Only after an adult visitor separately selects **Accept optional analytics** under the new `tradehq_consent_v3` preference, and only after the existing optional Amplitude client starts:

1. `TradeHQ Leaderboard Eligible Visit` — at most once per seven-day window per consenting browser when `/leaderboard` is viewed while logged out, after Supabase auth startup resolves.
2. `TradeHQ Leaderboard New Account Confirmed` — once if that same browser later authenticates with a *newly created* Supabase account whose authoritative `created_at` is not earlier than the visit and within seven days of it. Existing-account logins do not count.

**Custom events send no properties.** Do not send user IDs, names, emails, account identifiers, asset lists, balances, questionnaire results, IP fields, route query strings, form values or account creation timestamps. The underlying Amplitude SDK uses its own **pseudonymous browser identity** and normal network metadata; these events are *not* anonymous to the provider. No session replay or auto capture is enabled. Never set Amplitude's user ID from Supabase auth.

The temporary client-side marker contains only a single `visitedAt` integer. It is eligible for seven days and expires logically; browser storage may retain its timestamp until the next relevant visit, explicit withdrawal or site-data clearing. Successful registration attribution clears it. If consent is rejected or unset, do not set an attribution marker, dispatch an event, or initialize optional Amplitude. Withdrawing accepted consent clears Arena and leaderboard markers and disables the already loaded SDK. Prior v1/v2 consent is **not** inherited.

## Reporting method and limitations

Use Amplitude's **unique-user funnel**, ordered from eligible visit to confirmed new-account event, conversion window seven days, and report only aggregate counts or proportions. Explicitly label it:

> Among consenting adult browsers that loaded the leaderboard while signed out, X% were subsequently observed authenticating a newly created account in that same browser within seven days.

Never call this a site-wide conversion rate or proof the leaderboard **caused** a signup. It excludes minors, people who rejected analytics, people with blocked scripts, cross-device email confirmations, visitors in different browsers, and cases where a new account is made without completing login. One pseudonymous browser can represent different people and visits, and one person can use multiple browsers. Browser clock changes and clearing storage also bias the estimate.

**Small sample safeguards:** avoid showing event-level records or individual visitor journeys in a public or staff-wide dashboard. Do not report any funnel breakdown with fewer than ten eligible consenting browsers or fewer than five measured conversions. Use a private owner-only aggregate report and disclose the denominator and date range. These thresholds are conservative product defaults, not a legal certification or a statistical confidence guarantee.

## Release and testing requirements

- `scripts/verify-leaderboard-funnel.ts` passes in the Cloudflare postbuild pipeline; historical v2 consent cannot authorize funnel tracking.
- `scripts/verify-practice-arena.ts` passes under renewed v3 consent without changing private Arena data collection.
- Account creation and password/Google OAuth callbacks are attributed from `AuthProvider`, not a button click or unverified signup attempt.
- On a staging/isolated browser, test guest view, declined consent, new accepted consent, direct signup, existing-account login, delayed confirmation, offline or blocked Amplitude, one event per browser cohort and withdrawal.
- PR #334 must land and exact production source be independently verified first; then PR #336 must pass exact-head validation before any merge or release.
- Leave AdSense, newsletter dispatch and editorial approvals untouched.
