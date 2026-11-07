# The Trade HQ rewards design review

Tracked in [Phase 5 issue #353](https://github.com/anugaweerasinghe1-del/trading101/issues/353). This design supports the [Phase 5 master checklist](implementation-plan.md).

## Twenty trophies

The owner approved the 20 earning rules on 7 November. The implementation must honor these rules and the evidence boundaries below.

| Trophy | Sculpted silhouette | Approved earning rule | Required evidence |
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

The [twenty-piece collection](trophy-collection-preview.svg) shows all approved trophies. The [cabinet mockup](trophy-cabinet-preview.svg) shows representative earned and locked states. Keep discovery in Learn and the learner profile. Render states with labels and accessible text. Display incremental progress only when its evidence is available. Keep the unlock animation short and respect reduced motion.

Proposed sharing is private by default. Let a user explicitly select one earned trophy as optional username flair and pin up to three in a public profile. Public profile eligibility and trophy consent must both apply. Revocation takes effect at the source. Share cards expose only information the learner explicitly chose. No sharing exposes balances, trades, reflections, study dates or account identifiers. Awards never affect the return leaderboard.

## Foundations certificates

The owner approved the white-and-teal artwork with the Apex logo, rising candlestick chart and teal seal. These exact, unmodified PNGs are fictional design references. Production rendering must set the name, date and ID from the issued record.

| Certificate | Issuance milestone | Preview |
| --- | --- | --- |
| First Course Certificate | Complete one course in Foundations v1. | [Approved First Course](first-course-certificate-preview.png) |
| Core Studies Certificate | Complete three distinct courses in Foundations v1. | [Approved Core Studies](core-studies-certificate-preview.png) |
| Foundations Completion Certificate | Complete all four courses in Foundations v1 and score at least 8/10 on the final case. | [Approved Foundations Completion](foundations-certificate-preview.png) |

### Fixed v1 curriculum

| Course | Required checkpoints |
| --- | --- |
| Markets and Orders | Markets and instruments, order execution |
| Reading Prices | Quote provenance and freshness |
| Risk and Position Sizing | Downside and risk, position sizing |
| Practice and Reflection | Simulated decisions and reflection |

Every required checkpoint passes at 4/5 or better. The final case combines virtual order and price interpretation, fees, sizing and a decision review. The first two milestones count any distinct completed v1 course. Additional courses or content outside this fixed version cannot change previously earned milestones. The Foundations Graduate trophy uses the full completion rule.

The server eligibility policy is executable and has tests for partial courses, repeats, incorrect scores, version separation, and final-case requirements. It assumes authenticated, account-scoped, server-graded evidence. The private issuance service gates new records on this policy, handles confirmed recipient names, and delegates atomic creation to a store. Tests use an in-memory store. The draft now adds service-only PostgreSQL evidence and issuance records and a private authenticated Edge handler. Disposable PostgreSQL fixtures exercise the actual SQL, including denied browser roles, version and score bounds, immutable retry, account separation and account erasure. No hosted migration or function is active. The draft serves and scores versioned assessments from an immutable, service-readable bank. The learner receives prompts and choices; scoring keys remain in the private bank. No assessment content is seeded in this migration. The fixed v1 lessons and assessment items require editorial review and a coordinated seed before release. Learner UI, PDF rendering, correction and verification flows remain open.

Once eligibility is proven, the learner reviews the recipient name before first issuance. Use an authoritative record keyed by account, programme version and milestone. Generate repeat PDFs from the same name snapshot, certificate ID, date and template version. Maintain an auditable correction history and invalidate superseded verification links. A separate opaque verification token is voluntary. By default show only the milestone, programme version, date and validity, with no name or account identifier. Withdraw verification on request. Recipients retain downloaded copies.

The templates are design previews. Test supported names and fonts, long-name layout, one-page landscape PDF output, phone and desktop downloads, duplicate/racing requests, retries, forged progress, sharing and withdrawal. Measure resource use with isolated fixtures. Public trophy display and certificate verification require explicit opt-in.
