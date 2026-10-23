> Release update, 23 October 2026: [PR #214](https://github.com/anugaweerasinghe1-del/trading101/pull/214) merged at `40ba79c2b65d88badbddada705df80ab65acc2ab`. Native production and scoped public verification passed. Any held/unmerged wording in the original preparation note below is historical. See the [release ledger](../RELEASE-LEDGER.json) for exact receipts.

# THQ003 and THQ004 — small publisher-copy inconsistencies

Both findings are P3. They are ordinary clarity/consistency defects, with no specific AdSense policy violation established.

## THQ003 — outdated course count on Contact

The settled public Contact page says “Courses — the four structured tracks, with quizzes and completion badges.” The current catalog contains six tracks and 26 lessons. The literal is in `src/pages/Contact.tsx`. Remove the hardcoded count while keeping the existing course link and description; this remains accurate as published courses change.

Evidence: fresh production `evidence/PUBLISHER-COPY-BEFORE.json` and `evidence/contact-course-count-before-1280.png`, compared with the settled six-track `/courses` catalog. This changes one descriptive fragment, with no form, mail-client, privacy or contact-data behavior change.

## THQ004 — profile timestamp runs into the preceding sentence

Public profiles with a fetched timestamp render the end of the pricing explanation as `prices.Fetched …`, with no separating space. This was visible in an actual 1280px screenshot of a public unranked profile (`evidence/profile-timestamp-before-1280.png`), as well as its captured main text. Profiles without a timestamp do not show this concatenation.

Root cause: `src/pages/PublicTrader.tsx` places two JSX string expressions next to each other, and a source newline does not supply a literal text separator. Add an explicit space after `PRICE_REFRESH_COPY`. Retain all quote labels, formatting functions, timestamps, source fields and simulated portfolio values. This is text presentation only; it does not alter pricing, return calculations, visibility, account records or permissions.

## Scope, validation and release

The two corrections affect two existing text fragments only. No dependency, schema, finance, auth, consent, ad or infrastructure change. Existing type/build/browser checks and exact-head required CI apply; no new test mirroring a literal whitespace change is warranted. A candidate preview and both affected live pages must be inspected before claiming the corrections are deployed.

Prepare this batch independently while the course-layout PR is pending. Do not merge until the previous release cycle is verified and native Cloudflare access is restored. Rollback is a reviewed revert of the two text fragments; no data/settings reversal. Baseline main is `aa216a24c68c30c9251f96a050da098b33364686`. Draft preparation is not production release evidence.


## THQ-007: doubled punctuation in six guide quick answers (P3)

All six actual guide pages append a full stop to a third step which already ends in one, rendering `.. Practise`. Remove the redundant appended full stop in the shared HowToTrade quick answer. This changes punctuation only; steps, calculations, links, functionality and structured course records are untouched. Fresh actual public rendered text was checked for all six guides and a BTC desktop excerpt captured. Candidate build and deployed preview recheck must be recorded after this added correction. No new unit test for a literal copy edit. Rollback is a reviewed revert of this single punctuation change.

## THQ-014: generated money FAQ implies browser-only account storage (P2)

Fresh production /trade/sui FAQ expansion at360/1280 says every portfolio is stored in the browser. The existing live Privacy text distinguishes guest browser data from signed-in cash, positions and server-recorded trades in Supabase. Read-only source confirms this distinction. A source-derived inventory finds this generic answer on152of170asset terminal routes; this is not152individual fresh browser reproductions.

Remove only the inaccurate storage clause from the no-real-money FAQ, retaining virtual-currency/no-real-funds scope. Visible answers and FAQ structured data share this generator. No privacy-policy, consent, actual storage, accounts, auth, records or financial calculations change. The minimal correction belongs with this PR's existing publisher copy fixes.

Clean exact-main compiled output fails the browser-storage assertion. Updated candidate Cloudflare build, app-project TypeScript and full phase6 PASS, including safe FAQ expansion for five representative asset classes at360/1280. Fresh exact-head CI/provider/actual-preview checks must replace the previous1139acb receipts. Rollback is an ordinary reviewed revert; no data rollback or production release claimed. Native Cloudflare authentication401 still blocks the required serial production release.

## THQ-017: irregular category plurals (P3)

The visible generated FAQ misspells cryptocurrencies as cryptocurrencys; the same label+s pattern produces commoditys. SUI before screenshots demonstrate the former, and source-derived inventory covers59affected asset routes. Use the two correct irregular plurals, preserving regular plurals and singular question labels. Static wording only; no account/privacy/storage/calculation behavior change. Existing build/type/browser/CI and actual-preview checks are refreshed for the final candidate; no extra unit test merely mirrors the string. Normal reviewed revert, no data rollback or production release.
