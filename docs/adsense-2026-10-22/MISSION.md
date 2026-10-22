TRADEHQ — FINAL HUMAN-STYLE ADSENSE REVIEWER SIMULATION, EXHAUSTIVE SITE AUDIT & SAFE PRODUCTION REMEDIATION
Date: 22 October 2026
Execution environment: Codex, connected GitHub repository, live production browser, CI/CD and deployment verification

Repository: https://github.com/anugaweerasinghe1-del/trading101
Production: https://www.thetradehq.com
Cloudflare Pages project: tradehq-preview
Vercel project: trading101
Budget: Strictly $0 additional ongoing expenditure
PRIMARY MISSION
Conduct the most thorough independently defensible simulation of a strict human Google AdSense website review possible using publicly available requirements.

Your objective is not merely to pass automated tests.

Your objective is to examine TradeHQ as a real visitor, critical editor, experienced website quality auditor, accessibility tester, security-conscious engineer and sceptical AdSense reviewer.

Review every discoverable public page individually. Read its substantive content, evaluate its usefulness, test its interface and identify problems that automated structural checks might miss.

At the same time, look for ANY other genuine defect or unsuitable element, including problems unrelated to AdSense.

Find problems, reproduce them, implement safe fixes, test them, merge them through the approved workflow, verify successful Cloudflare production deployment, and recheck the affected live pages.

Repeat until the complete inventory has been reviewed and all substantiated fixes within your permitted scope have been addressed.

Do not fabricate problems to justify changes.

Do not declare success merely because tests pass.

Do not promise AdSense approval. You do not have access to Google's confidential review procedures or internal scoring systems.
CRITICAL RULE ZERO — THIS IS A LIVE WEBSITE WITH REAL USERS
TRADEHQ HAS ACTIVE DAILY USERS. PROTECTING THOSE USERS AND THEIR DATA TAKES ABSOLUTE PRIORITY OVER THIS AUDIT.

You must work as a careful production engineer.

The site contains registered accounts, virtual portfolios, trading history, lessons, achievements, user-generated content and potentially active sessions.

You must NOT disrupt existing users while attempting to improve website quality.
Absolutely prohibited without explicit owner approval
- Modifying, resetting, deleting or recalculating user portfolios or virtual balances.
- Changing trade execution, order processing, fees, positions or financial calculation logic.
- Changing authentication, sessions, access control or permissions.
- Altering database schemas, migrations, production records or row-level security.
- Removing or invalidating users' progress, achievements, streaks or histories.
- Changing privacy policies, consent handling or data collection behavior.
- Altering AdSense implementation, account settings or ad serving behavior.
- Changing production secrets, API credentials, infrastructure ownership or DNS.
- Introducing paid services, dependencies requiring ongoing spending or unknown external data-sharing services.
- Running destructive production tests or test trades against real user accounts.
- Disabling major user-facing functionality to simplify an audit.
If a problem requires a change in one of these protected areas, document the issue, its severity, reproduction steps, proposed fix, risk assessment and rollback procedure.

STOP THAT CHANGE AND ASK FOR OWNER APPROVAL. Continue with independent safe work where possible.

No approval is implied merely because the change appears beneficial.
Production safety requirements
Before any modification:
1. Identify which pages and application components are affected.
2. Determine whether the change is content-only, interface-only or behavior-changing.
3. Inspect dependencies and possible side effects.
4. Check whether an existing user workflow could break.
5. Use isolated test data and nonproduction environments.
6. Preserve existing functionality and compatible interfaces.
7. Avoid unnecessary refactoring and broad rewrites.
8. Ensure the change is reversible.
9. Prepare a rollback strategy before merging.
10. Avoid making multiple unrelated changes simultaneously.
Prefer the smallest reliable fix over an extensive redesign.

Finding more issues is encouraged. Making more changes is not inherently better.
PHASE 1 — ESTABLISH THE VERIFIED BASELINE
Check the latest GitHub main commit and current production state.

Review the existing AdSense remediation work, particularly PRs #188–211.

Read:
- docs/adsense-2026-10-21/Final-Production-Evidence.json
- docs/adsense-2026-10-21/Part-1-Final-Closeout.md
Previously recorded work included 357 production routes, 155 indexable pages, 202 intentionally noindex pages and 714 browser viewport observations.

These figures are historical evidence, not permanent facts. Recalculate the current inventory.

Review the actual code, prior fixes and previous audit limitations.

Do not assume the earlier audits were either perfect or useless.

Avoid reintroducing previously corrected errors.

Establish a baseline covering public page functionality, navigation, build status and core smoke tests.
PHASE 2 — DISCOVER EVERY PUBLIC PAGE
Begin with:

https://www.thetradehq.com/sitemap.xml

Also inspect supplementary sitemaps, internal links, route generation, source-code routing definitions, existing audit inventories and publicly discoverable pages outside the sitemap.

Include all applicable categories:
1. Homepage and primary navigation.
2. Learning articles and educational hubs.
3. Individual courses, lessons and quizzes.
4. Trading terminology and glossary pages.
5. Strategies and how-to-trade tutorials.
6. Psychology and risk-management content.
7. Asset comparison pages.
8. Asset and instrument information pages.
9. Country-specific educational guides.
10. Public user profiles, leaderboard and public-facing interactive features.
11. Trading simulator screens accessible to guests.
12. Portfolio, journal and account-entry screens accessible without authentication.
13. About, Contact, Privacy, Terms and other trust pages.
14. Help pages, errors, redirects and publicly accessible utility pages.
15. Any other discoverable route not listed above.
Record indexability and canonical behavior without assuming all pages ought to be indexed.

Do not access private accounts or bypass authentication.

Produce an inventory containing the URL, page category, main purpose, intended audience, indexing status, inspection status and evidence references.

Every discovered route must receive its own audit record.
PHASE 3 — SIMULATE A STRICT HUMAN ADSENSE REVIEWER
For every page, behave as a sceptical visitor deciding whether the website genuinely helps its intended audience.

Read the actual visible content rather than relying on metadata, word counts or source-code existence.

Evaluate:
A. Originality and substantive value
Determine whether the page provides useful original explanation, educational reasoning, worked examples, contextual guidance or other meaningful value.

Look for:
- Recycled paragraphs.
- Near-identical articles with different keywords.
- Repeated introductory and concluding sections.
- Formulaic AI-generated writing patterns.
- Thin articles with little useful information.
- Pages existing primarily to attract search traffic.
- Unnecessary filler.
- Contradictory educational explanations.
- Content that promises insight but delivers generic statements.
Templated layouts are not automatically defects. Shared navigation, disclaimers and consistent design are normal.

Judge the actual value of each page.
B. Factual accuracy and financial education
Check whether financial and trading terminology is explained correctly.

Pay particular attention to:
- Trading fees and hypothetical profit calculations.
- Market order execution.
- Asset classifications and data sources.
- Price quotation delays.
- Risk-management examples.
- Leverage and derivatives explanations.
- Technical indicators.
- Claims about profitability or successful trading.
- Statements confusing paper trading with real investing.
Never invent citations, statistics or financial facts.

Verify material claims against credible, relevant sources.

Correct misleading explanations while retaining the website's educational, simulation-only scope.
C. Reader trust and credibility
Inspect:
- Author and publisher identification.
- Editorial transparency.
- Source citations and reference links.
- Educational disclaimers.
- Contact information.
- Misleading promises.
- Inconsistent descriptions of website capabilities.
- Outdated statements.
- Broken or irrelevant references.
Distinguish genuine policy requirements from general quality recommendations.
D. Human readability
Read content as a real beginner.

Ask whether someone unfamiliar with trading would understand the explanation.

Look for:
- Robotic language.
- Excessive repetition.
- Awkward sentences.
- Undefined jargon.
- Unnecessary complexity.
- Inconsistent tone.
- Misleading headings.
- Unhelpful examples.
- Missing explanations of important concepts.
Do not rewrite content merely because you prefer a different writing style.

Special homepage protection: Previous remediation changed homepage copy. Avoid further homepage rewriting unless a clear, reproducible problem justifies it. Preserve positioning, purpose, important messaging, visual identity and established SEO intent.

Any substantial homepage restructure or positioning change requires owner approval.
PHASE 4 — COMPLETE DESKTOP AND MOBILE VISUAL REVIEW
THIS IS MANDATORY FOR EVERY PUBLIC PAGE.

Inspect every route in real browser rendering at these viewport sizes where supported:
Device class	Viewport
Small mobile	360 × 800
Typical mobile	390 × 844
Tablet	768 × 1024
Desktop	1280 × 800
Large desktop	1920 × 1080


At minimum, every page must receive actual mobile and desktop browser inspection.

Where necessary, investigate intermediate sizes to reproduce responsive defects.

Test content after fonts load, scripts initialize and layout transitions settle.

For each page, check:
- Horizontal overflow.
- Cut-off text.
- Buttons extending outside the screen.
- Overlapping components.
- Broken navigation.
- Misaligned cards.
- Missing images.
- Distorted aspect ratios.
- Text unreadable against backgrounds.
- Excessive empty space.
- Unnecessarily dense content.
- Broken responsive grids.
- Sidebar interference.
- Unusable dropdowns.
- Broken sticky headers.
- Footer overlap.
- Unreadable tables.
- Modal overflow.
- Mobile keyboard interactions.
- Touch targets.
- Form usability.
- Focus visibility.
- Heading hierarchy.
- Basic accessibility and keyboard navigation.
- Major layout shifts.
- Pages that look visibly unfinished or unsuitable.
Inspect both the initial and settled interfaces where meaningful.

Do not mistake a temporary loading state for a permanent failure.

For real defects, capture browser evidence before changing anything.

Do not report a page as visually reviewed solely because a Chromium navigation command returned successfully.
PHASE 5 — TEST ACTUAL FUNCTIONALITY
Evaluate public interactions safely.

Examples include:
- Navigation and links.
- Course progression in disposable test contexts.
- Lesson controls.
- Quiz interfaces.
- Search and filters.
- Tabs, dropdowns and selectors.
- Public profile navigation.
- Leaderboard sorting.
- Glossary navigation.
- Asset guide links.
- Error screens.
- Public forms without making actual submissions.
- Simulator entry navigation without placing trades.
- Accessibility controls.
- Browser back/forward behavior.
Use isolated testing environments for interactions that create or alter data.

DO NOT use real user accounts, submit real contact messages, create production trades or alter production records.

Report protected functionality that cannot be safely tested rather than marking it as verified.
PHASE 6 — LOOK FOR ANY OTHER BAD OR UNSUITABLE ELEMENT
Do not limit the investigation to AdSense policy violations.

While inspecting pages, proactively identify any substantial issue harming quality, trust, usability, security or visitor satisfaction.

Consider:
- Broken internal or external links.
- Misleading buttons.
- Conflicting canonical tags.
- Unexpected noindex behavior.
- Duplicate or irrelevant page titles.
- Broken structured data.
- Missing page content.
- Incorrect redirects.
- Publicly exposed debug messages.
- Obvious accessibility failures.
- Incorrect data presentation.
- Misleading AI feature descriptions.
- Inaccurate tool limitations.
- Severe performance regressions.
- Unnecessary third-party scripts.
- Unexpected console errors.
- Publicly visible sensitive information.
- Broken error states.
- Poorly handled empty states.
- User interfaces that suggest real-money trading when functionality is simulated.
Check compatibility with Google's published policies, but do not misrepresent SEO recommendations as mandatory AdSense rules.

Look for the problems a critical human visitor would notice.

Your job is to FIND genuinely important problems, not to produce a long report saying everything looks excellent.

However, if a page is genuinely good, mark it as passing and move on.
PHASE 7 — REPRODUCE, PRIORITIZE AND FIX
For every identified issue, record:
- Unique finding ID.
- Affected URLs.
- Type of defect.
- Exact observed behavior.
- Expected behavior.
- Desktop/mobile impact.
- Severity.
- AdSense relevance, if any.
- User impact.
- Reproduction steps.
- Supporting screenshot or test evidence where appropriate.
- Root cause.
- Proposed minimal fix.
- Code files affected.
- Risk level.
- Tests performed.
- Fix status.
- PR number.
- Merge SHA.
- Deployment verification.
- Final production recheck result.
Use these severity categories:

P0 — Critical: Active user data loss, unauthorized access, material security exposure, or critical service failure. Do not undertake risky emergency production changes without owner approval.

P1 — High: Reproducible major functionality failures, significant policy concerns, materially misleading information or serious accessibility/usability defects.

P2 — Medium: Meaningful editorial issues, broken secondary flows, mobile layout defects and noncritical misleading content.

P3 — Low: Minor wording, spacing or cosmetic improvements.

Fix substantiated low-risk problems that fall within your authorization.

Do not automatically change production-critical or protected systems.

Prioritize P1/P2 items that materially improve the website. Avoid destabilizing production for P3 cosmetic issues.
PHASE 8 — STRICT MERGE AND DEPLOYMENT RULES
THIS IS A NON-NEGOTIABLE RELEASE GATE.

Aim for approximately 2–5 focused PRs for the entire remediation where practical, depending on findings and risk.

Do not force unrelated changes together merely to meet that target.

You may review and prepare independent future batches while deployment is pending, but you must not merge or release the next batch until the previous one is fully verified.
Required release cycle
1. Identify and reproduce an issue.
2. Prepare the smallest safe fix.
3. Run relevant unit, integration, browser and regression tests.
4. Run the full required CI suite.
5. Verify that tests ran against the exact candidate commit.
6. Confirm there are no unexpected protected-area changes.
7. Check the Cloudflare preview.
8. Check the Vercel preview where applicable.
9. Merge only after all required checks succeed and approval rules are satisfied.
10. Record the exact merge commit SHA.
11. Verify that Cloudflare Pages reports SUCCESS for the exact merged commit and production environment.
12. Verify Vercel production deployment where relevant.
13. Revisit the affected pages on the actual public domain.
14. Confirm the intended correction is visible.
15. Confirm unrelated critical user journeys still work.
16. Check for new runtime errors, layout defects or broken navigation.
17. Record the verification evidence.
18. Only then continue to merging the next batch.
If Cloudflare deployment fails
DO NOT CONTINUE MERGING.

Diagnose the failure and attempt a safe correction, with tests and the same release process.

If the failure cannot be safely resolved, stop releases, preserve the evidence and report the blocker.

Never claim deployment success based solely on a GitHub merge, successful build or preview.
If production becomes unstable
Stop further releases.

Inspect the deployment, errors and health checks.

Use an established, safe rollback mechanism if authorized, or request owner approval where necessary.

Do not attempt repeated speculative changes against the live website.

Do not leave production in a known broken state merely to complete the audit.
PHASE 9 — POST-DEPLOYMENT REGRESSION PROTECTION
After each successful production deployment, verify a representative set of critical guest-facing workflows.

At minimum:
- Homepage loads normally.
- Learning hub and sample article work.
- Course and lesson navigation work.
- Trading simulator public interface loads.
- Asset selection and quote/error displays behave correctly.
- Portfolio entry or authenticated guard behaves correctly.
- Leaderboard and public profiles load appropriately.
- About and Contact pages remain accessible.
- Internal navigation works.
- Desktop and mobile layouts remain stable.
Where an isolated staging environment exists, use it for deeper authenticated regression testing with disposable data.

No production test should modify real user data.

Compare expected behavior with the pre-change baseline.

Also verify that unrelated route families were not inadvertently changed by shared component edits.

Keep the production footprint as small as possible.
PHASE 10 — GENUINE INDIVIDUAL PAGE REVIEW LEDGER
Create a new evidence file under:

docs/adsense-2026-10-22/

For every URL, record:
Field	Required
URL and route category	Yes
Individual HTTP and browser inspection	Yes
Desktop and mobile results	Yes
Substantive content assessment	Yes
Originality/duplication assessment	Yes
Factual concerns	Yes
Credibility and source assessment	Yes
Functionality results	When safely testable
Specific issues	When present
Evidence for pass or finding	Yes
Fix and PR reference	When changed
Post-deployment verification	When changed
Limitations	When applicable


A generic repeated statement such as "quality looks good" on hundreds of pages is not acceptable evidence of independent editorial review.

For each page, include a concise, page-specific assessment reflecting what the page actually teaches, explains or enables.

If examining an entire page reveals that its content is materially redundant with another page, compare both pages and record the specific overlap.

Do not fake human reading, browser interaction or source verification.

Maintain distinct statuses for:
- Not yet inspected.
- Structurally checked only.
- Substantively reviewed.
- Finding reproduced.
- Fix prepared.
- Fix tested.
- Merged.
- Deployed.
- Publicly verified.
- Blocked or requires approval.
Do not silently change statuses to "complete" merely because a PR was merged.
PHASE 11 — FINAL INDEPENDENT ADSENSE VERDICT
When the work is genuinely complete, reassess TradeHQ from the perspective of a first-time visitor who has never seen the development history.

Do not give the website credit simply because hundreds of PRs were completed.

Assess the actual current product.

Use the following categories:
- Content originality and independent value.
- Educational usefulness.
- Financial accuracy and responsible claims.
- Navigation and accessibility.
- Desktop and mobile usability.
- Functional reliability.
- Publisher transparency and trust.
- Published content consistency.
- Discoverability and technical presentation.
- Public AdSense policy concerns.
- Remaining external/account-side uncertainties.
For each category, produce a clear PASS, CONCERN, FAIL or NOT VERIFIED verdict with specific reasoning.

Separate actual policy issues from ordinary quality improvements.

Do not manufacture a numerical Google approval score or present an invented probability as fact.

Final decision must be one of:

A. SITE-SIDE READY FOR PART 2: No outstanding substantiated, actionable site-side blocker remains in the completed review scope.

B. READY WITH NONBLOCKING RECOMMENDATIONS: No known blocking issue, but documented lower-priority improvements remain.

C. NOT READY: Specific, substantiated blocking issues remain, with evidence and required next actions.

Do not confuse Part 1 website readiness with Part 2 account eligibility or Google's eventual approval decision.
PHASE 12 — FINAL REPORT AND HANDOFF
Produce a concise executive summary followed by detailed evidence.

Include:
1. Latest production SHA.
2. Total public routes discovered.
3. Total individually inspected.
4. Total substantively reviewed.
5. Total mobile and desktop browser observations.
6. Number and severity of reproduced issues.
7. Number of successfully repaired issues.
8. PRs created and merged.
9. Cloudflare and Vercel release verification.
10. Remaining unresolved findings.
11. Protected changes requiring owner approval.
12. Production regressions encountered and resolved.
13. Areas that could not be verified.
14. Final site-side AdSense readiness verdict.
15. Next steps for Part 2.
Include direct links to GitHub evidence, changed files, PRs, workflows and deployment records.

Report the most significant remaining limitations plainly.

If exact coverage is not possible within the available execution or tooling constraints, preserve the completed evidence and disclose the precise unfinished pages and work.

Never replace unfinished work with an unsupported "100% complete" statement.
FINAL OPERATING INSTRUCTIONS
Your priority order is:

1. Protect existing users and production data.

2. Find genuine policy, content, usability and functionality problems.

3. Fix safely reproducible low-risk defects with minimal changes.

4. Verify exact-head tests and successful production deployment after every merge.

5. Record page-specific evidence, including both desktop and mobile observations.

6. Provide a truthful final readiness verdict.

Do not rewrite excellent existing pages simply to demonstrate productivity.

Do not add unneeded functionality, redesign the brand or expand scope into unrelated feature development.

Do not silently modify protected user systems.

Do not merge the next batch until Cloudflare has successfully deployed the previous one and production rechecks pass.

Do not claim Google's approval is guaranteed.

Keep investigating independent pages and safe findings until the full review scope is complete, or a genuine execution/permission blocker prevents further safe progress.

BEGIN WITH THE LIVE REPOSITORY, CURRENT PRODUCTION DEPLOYMENT AND COMPLETE PAGE INVENTORY.

BE EXTREMELY STRICT AS AN AUDITOR. BE EXTREMELY CAUTIOUS AS A PRODUCTION ENGINEER.

THE GOAL IS A TRUSTWORTHY, USEFUL, RELIABLE AND ADSENSE-READY WEBSITE — WITHOUT HARMING THE PEOPLE ALREADY USING IT.

CRITICAL CORRECTION — ALL-RISK ADSENSE REMEDIATION
Your mission covers AdSense-related issues of ALL severity levels (P0, P1, P2 and P3). Do not restrict remediation to low-risk defects.
Distinguish the severity of a discovered issue from the risk of implementing its fix.
Every substantiated AdSense-related defect must be investigated, given a proposed solution and resolved wherever safely authorized.
High-severity problems must receive greater priority, not be automatically postponed. High-risk implementations require stronger testing, safeguards and, where protected systems are involved, explicit owner approval.
Do not leave an actionable AdSense blocker unresolved simply because it requires substantial engineering effort.
However, never compromise real users, production data or site availability to complete remediation.
After every merge, wait for successful Cloudflare production deployment, perform live regression checks, and only then proceed to the next release.
If a protected change requires approval, continue independent safe work and clearly report the approval blocker.
The final objective is zero outstanding substantiated, actionable AdSense site-side blockers, not merely zero easy-to-fix problems.
