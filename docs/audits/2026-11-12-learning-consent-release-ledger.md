# TradeHQ learner journey + consent: implementation and release ledger

**Opened:** 2026-11-12 UTC
**Scope:** Audience consent, Amplitude surveys, unfinished learning journey/milestone integration, trophy navigation, release notices, acceptance, Cloudflare verification.
**Original implementation branch:** `feat/learner-journey-insights-20261112`; **correction branch:** `fix/private-journey-consent-simplification-20261112` based on main after PR #421. Daily Practice PR #420 remains separate.
**Concurrency note:** PR #421 merged in parallel and included the original new journey Amplitude telemetry; this correction deliberately removes it rather than presuming prior `v3` consent covers it. Original PR #422 is superseded by this clean correction branch.
**Rule:** Do not claim release complete until GitHub checks, merge, and Cloudflare production are positively verified.

## Evidence and legal decision log

| ID | Finding | Decision | Source / verification |
| --- | --- | --- | --- |
| C01 | One custom `ConsentBanner` governs **optional Amplitude** (`tradehq_consent_v3`). | Keep one analytics preference, shorten copy, preserve decline and adult-only self-attestation; expose change settings in footer. | `src/components/ConsentBanner.tsx`, `src/components/MegaFooter.tsx` |
| C02 | Separate Google CMP controls advertising where applicable. | Do not remove or conflate with Amplitude permission. | `src/components/AdvertisingPrivacyChoices.tsx`; Google Privacy & Messaging remains an external account-side check. |
| C03 | Newsletter opt-in and email verification are delivery permission, not a redundant analytics banner. | Retain. | `src/components/NewsletterSignup.tsx`; newsletter routes |
| C04 | Practice Arena's optional usability questionnaire is participant-initiated; responses are not automatically posted to analytics. | Retain as voluntary feedback, with provider-independent email action. | `src/components/arena/ArenaStudy.tsx` |
| C05 | Amplitude contains four saved survey/guide designs, but the engagement plugin is absent from the website. | Do **not** silently inject Guides & Surveys for non-consenting visitors. The existence of a saved survey is not proof it is displayed or running. | Connected Amplitude project 870121; website consent initializer |
| C06 | Earlier branch introduced new `TradeHQ Journey *` Amplitude events despite existing consent copy covering Arena and leaderboard events only. | **Removed** new journey telemetry and saved-progress instrumentation before merging; no retroactive expansion of prior permission. Count privately synced journey records in Supabase instead. | `src/lib/beginnerJourney.ts`, `src/pages/BeginnerJourney.tsx`; deleted `src/lib/journeyTelemetry.ts` |
| C07 | Sri Lankan PDPA main sections scheduled for 2027-01-01, with international visitor-law exposure. UK limited statistical exception does not cover broad individual profiling. | No blanket no-consent browser analytics rule for all visitors. Keep identifiable or pseudonymous Amplitude consented. | Sri Lanka DPA `https://dpa.gov.lk/notice.php`; UK ICO `https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/`; Amplitude `https://amplitude.com/docs/data/privacy-and-consent-implementation` |
| C08 | Local browser survey, voluntary messages, essential simulation storage, and newsletter permission do not require asking the visitor to turn on Amplitude. | Keep analytics reject non-blocking and do not record non-consent visit/event streams in Amplitude. | Consent, Arena survey, Contact/Newsletter source |
| C09 | Google CMP and external AdSense settings are outside repo authority and have their own compliance gates. | Do not disable account-side CMP or assert its deployment from repo-only review. | `src/components/AdvertisingPrivacyChoices.tsx`, `index.html` |

## Learning and rewards changes

| ID | Implementation | Status |
| --- | --- | --- |
| L01 | Daily case mistakes produce a **private, secondary** link to worked explanations after saved case completion, without claiming trading proficiency. | Code written; automated verification pending |
| L02 | Signed-in trading history continues to determine trade actions; never treats unavailable server snapshot as zero trades. | Preserved, previous feature |
| L03 | Guided first-trade completion provides optional Trophy Cabinet link; no duplicate primary CTA. | Code written; verification pending |
| L04 | Existing 20 verified trophy definitions, private awards and certificate mechanisms retained; no new double-award mechanism. | Existing; verify before merge |
| L05 | New approved feature release in `src/content/releases/approved.json`; dynamic published-course notes remain automatic, general feature notes approval-gated. | Code written; verify announcement on production |
| L06 | Build's postbuild verification now includes `scripts/verify-journey-funnel.ts` (renamed purpose: privacy/learning checks). | Code written; CI pending |

## Production observations — read-only aggregates at audit time

- 106 registered profiles; **25** stored account learning-progress rows.
- 14 learning-progress rows updated in the prior seven days; 11 accounts had saved structured-course activity.
- 5 saved journey lesson-completed flags; 4 saved first journey trade IDs; 3 portfolio-explained flags; 2 complete journey records.
- 22 awards in `trophy_awards_v1` across 2 accounts, **not** verified distinct people.
- Caveats: test accounts, nonhuman accounts and guest browser-only activity make these **neither** total site learner counts **nor** deduplicated human counts.
- No database mutations made for this release.

## Acceptance / rollout checklist

- [ ] Confirm branch diff excludes Daily Practice generator, ad CMP and newsletter delivery.
- [ ] TypeScript/build and postbuild regressions pass, including trophy, privacy, course, release, Daily compatibility and journey tests.
- [ ] Confirm no Amplitude SDK or engagement plugin loads for fresh/rejected visitors; consented adult Arena and leaderboard events still work; withdrawal stops future collection.
- [ ] Confirm only one TradeHQ analytics prompt on fresh browser; choice persists; analytics settings can reopen; no age gate for Reject.
- [ ] Confirm voluntary feedback remains available with analytics rejected.
- [ ] Confirm guest/signed-in/mobile/completed-course user flows; no extra primary action.
- [ ] PR CI passes at exact head SHA and protected main merges successfully.
- [ ] Cloudflare Pages reports success for merged main SHA; independently fetch live public routes and verify updated compiled content.
- [ ] If Cloudflare account status is not accessible, record **unverified** and do not say deployment succeeded.
- [ ] Record remaining account-owner and legal gates separately rather than calling them code failures.

## Isolation / out-of-scope

- Do not modify Daily Practice draft generation and editorial duplication logic (PR #420 remains separate).
- No unconsented third-party profiling, covert event capture, automatic research feedback submission or child behavioural targeting.
- Do not automatically publish new AI-generated exercises or bypass owner approval.
- Do not alter Google AdSense consent management from this branch.
- Legal review may be required for international data protection, advertising and youth-oriented features; this engineering ledger is not a legal opinion.

## Release state

**Not yet deployed.** Append exact PR, CI, merge and Cloudflare evidence before marking complete.
