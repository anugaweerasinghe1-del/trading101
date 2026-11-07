# The Trade HQ rewards design review

Proposed for [Phase 5 issue #353](https://github.com/anugaweerasinghe1-del/trading101/issues/353). This design supports the [Phase 5 master checklist](implementation-plan.md).

## Twenty trophies

| Trophy | Sculpted silhouette | Proposed earning rule | Required evidence |
| --- | --- | --- | --- |
| First Light | Bronze lantern | Pass the first Foundations checkpoint | One passed checkpoint for the account |
| Field Notes | Embossed open notebook | Pass any three different Foundations checkpoints | Three distinct passed checkpoint IDs |
| Market Compass | Brass gimbal compass | Pass the markets and instruments checkpoint | Markets checkpoint pass |
| Order Desk | Silver order ticket in a stone slot | Pass the market-order and execution checkpoint | Execution checkpoint pass |
| Price Detective | Smoked-glass loupe | Pass the quote provenance and freshness checkpoint | Quote checkpoint pass |
| Risk Aware | Enamel shield with a bronze rim | Pass the downside and risk checkpoint | Risk checkpoint pass |
| Position Architect | Three graduated stone blocks | Solve all position-sizing questions in a single scored exercise | Sizing assessment rubric scored by server |
| Exit Planner | Hinged silver gate | Complete the exit-planning case and pass its reasoning checks | Exit case ID and server-scored rubric |
| Cost Counter | Stacked brass abacus | Pass the fees and spread exercise | Costs exercise pass |
| Portfolio Lens | Faceted prism on a dark base | Pass the allocation and exposure exercise | Exposure exercise pass |
| First Practice Trade | Bronze handwheel | Complete a first eligible authenticated simulated trade | Own recorded eligible trade, using the existing source rules |
| Pause Button | Two upright ceramic pillars | Choose to hold in the specified Arena scenario and pass the reasoning check | Bound Arena attempt and server-scored answer |
| Scenario Explorer | Folded topographic map | Complete three distinct scored Arena scenarios | Three distinct completed Arena scenario IDs |
| Decision Review | Hinged mirror in a wood frame | Finish a structured review of a completed scored Arena scenario | Own completed scenario and scored review receipt |
| Second Look | Twin offset lenses | Correct a missed concept on a different follow-up question | Server-marked initial miss and correct linked follow-up |
| Case Solver | Interlocking slate pieces | Pass a scored Daily Practice case | Server-scored case and bank version |
| Case Collector | Five individually cut archive tabs | Pass five distinct scored Daily Practice cases | Five distinct bank-version and case ID pairs |
| Steady Learner | Silver constellation on midnight enamel | Log a qualifying learning action on seven distinct days, with no streak reset | Server timestamps in a fixed programme timezone, one qualifying day counted once |
| Knowledge Builder | Six brass pillars supporting an arch | Pass all six fixed Foundations checkpoints | Six distinct checkpoint pass receipts for Foundations v1 |
| Foundations Graduate | Gold laurel surrounding a hexagonal seal | Meet Foundations v1 completion requirements | Server eligibility record for the same programme version as the certificate |

The existing first recorded practice trade can use TradeHQ's established authenticated trade evidence. Current course badges, Daily Practice responses, Arena history and learning progress rely on learner-writable state. Keep those personal records visible and preserve existing recovery and sync. Verified awards other than First Practice Trade need new server-graded checkpoints or authenticated action records. An authenticated browser submitting a score or timestamp cannot attest to its own result.

For the proposed scoreable actions, serve a versioned question/attempt identity, grade fixed answers on the server, scope events to the authenticated account, and persist minimal server-owned result records. Each award must have a unique account-and-award key, transactional issuance, and bounded idempotent retries. Validate cross-account access, duplicate requests, and client tampering. Use only verified records for profile display. A failed evidence read has its own unavailable state.

## Cabinet and sharing

The [cabinet mockup](trophy-cabinet-preview.svg) shows representative earned and locked states. Keep discovery in Learn and the learner profile. Render states with labels and accessible text. Display incremental progress only when its evidence is available. Keep the unlock animation short and respect reduced motion.

Proposed sharing is private by default. Let a user explicitly select one earned trophy as optional username flair and pin up to three in a public profile. Public profile eligibility and trophy consent must both apply. Revocation takes effect at the source. Share cards expose only information the learner explicitly chose. No sharing exposes balances, trades, reflections, study dates or account identifiers. Awards never affect the return leaderboard.

## Foundations certificate

The [certificate template preview](foundations-certificate-preview.svg) uses a fictional recipient and a visibly invalid sample ID. The proposed programme freezes six topics in Foundations v1: markets and instruments, order execution, quote provenance and freshness, downside and risk, position sizing, and practice reflection. The sizing and reflection checkpoints are independent of the optional mastery trophies.

Proposed eligibility requires all six fixed checkpoints passed at 4/5 or better each, plus a scored final case at 8/10 or better. The final case combines virtual order and price interpretation, fees, sizing and a decision review. Curriculum, questions, and thresholds are proposals for owner review. Freeze the approved question/rubric revisions and store the programme version with each pass. Prior awards retain their original rules if a later version adds or changes requirements.

Once eligibility is proven, the learner reviews the name before issuance. Use a single authoritative record keyed by account and programme version. Generate repeat PDFs from the same name snapshot, ID, date and template version. Corrections replace an issuance through an auditable history, and superseded verification links should cease returning valid. Keep private downloads available without public verification. Enable optional verification using a separate opaque token, never a user ID or a predictable certificate number. Show only the programme, version, issue date and valid status by default, with the name excluded. Withdraw the token on request. A downloaded copy can remain on the recipient’s device.

Before enabling issuance, review the curriculum, assessment threshold, wording, template and public presentation. Test Unicode and supported font fallback, long names, A4 landscape layout, repeat rendering, downloads on mobile and desktop, duplicate requests, retries, forged progress, sharing and withdrawal. Measure resource use on isolated fixtures. The current preview does not issue or verify certificates.
