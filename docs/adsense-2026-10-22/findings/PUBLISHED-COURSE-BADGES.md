> Release update, 23 October 2026: [PR #216](https://github.com/anugaweerasinghe1-del/trading101/pull/216) merged at `cd05556292fbcc740c18a501c5fa529d11c14613`. Native production and scoped public verification passed. Any held/unmerged wording in the original preparation note below is historical. See the [release ledger](../RELEASE-LEDGER.json) for exact receipts.

# THQ-006: completed published courses missing from own profile

Severity: P2. Interface display correction on `/trader/me`.

In a fresh disposable guest browser on production, completing the six lessons in both published tracks produced two earned badge records in localStorage. The own profile still said “No completion badges yet.” After all26 lessons, six badges were stored but only four bundled-course badges appeared. This was observed through the actual quiz interface; no account, public profile, server record or financial transaction was changed.

The profile derived badges only from the four bundled course definitions. It now renders earned local records, names them from the public course catalog, and shows an explicit course-completion fallback when a catalog entry is unavailable. Existing records remain intact. Financial calculations, progress storage and profile visibility controls are unchanged.

Validation:
- The new compiled-browser regression failed the old app at “Own profile displays both published-course badges.” A separate initial CDP transport interruption is retained and is not treated as the app regression.
- Candidate TypeScript and Cloudflare build passed.
- Full phase-six Chromium suite passed, including actual completion of both published tracks, retention of native/retired earned records, unavailable-catalog display, identical financial tiles and unchanged stored progress after viewing the profile. Badge layout fits all five audit widths.
- Live disposable quiz collection:26 interfaces passed, zero blocked Supabase write attempts, zero runtime/interception errors. Factual feedback review remains separately staged.

This is a secondary functionality/trust defect, not a claimed specific Google Publisher Policy violation. Rollback is a reviewed revert of this display correction and its regression; no progress or account data rollback is needed.

Release remains held for current Cloudflare API credential repair and serial exact-commit production verification. This candidate has not been merged or deployed to production.
