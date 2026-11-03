# TradeHQ Practice Arena — evidence pilot

**Date:** 3 November 2026  
**Status:** Protocol and optional website form prepared; **no real participant results have been collected by this document**.  
**Product decision:** Test whether the three published five-round scenarios help beginners understand virtual trading mechanics and leave them interested in choosing another exercise. Do not equate engagement or fictional P&L with actual trading competence.

## 1. Research question and limits

**Core hypothesis:** A beginner who makes a short simulated decision, sees the cash/holdings consequence and can review their own reasoning will explain the difference between purchase notional and transaction fee more accurately and feel motivated to practise a similar skill again.

**Competing explanations:** Improvements in a second arithmetic question might simply reflect repetition, guessing or unusually motivated participants. Saying they *would* return is not the same as returning. Five predefined fictional observations may quickly become predictable when replayed. Analytics consent changes the measured population; repeat visits from another browser are not matched.

**Not being tested:** Real-money trading success, income, investment suitability, real-market backtesting or whether the user can safely trade without supervision.

## 2. Participant plan

Recruit **8–12 voluntary participants** outside the founder's usual circle when possible, ideally **6–8 genuine beginners and 3–4 intermediate learners**. Do not announce "the correct answer" or frame participation as a test of intelligence. Invite participants who can freely decline; do not request ages, names, school identification, income, credentials or actual portfolio balances. For minors, use appropriate guardian/teacher permission and follow the relevant privacy and safeguarding requirements. Never pressure users to enable analytics or subscribe to newsletters.

Suggested sharing link: **https://www.thetradehq.com/practice?study=1**. The query only opens a voluntary on-page prompt; it does not include an identity or collected answers.

If the exercise is facilitated in person, use the same opening script:

> TradeHQ is trying to make free virtual-trading practice understandable. Please try one five-round fictional scenario as though you had found the page for the first time. This is not a test of your intelligence. Say what you expect and what confuses you. You can stop at any point, skip the study or keep your answers private. No actual trading is involved.

Do not guide their clicks unless they cannot proceed. Do not peek at or collect private reasoning text. Encourage thinking aloud, not guessing the right market direction. Report observed friction, not a fabricated completion rate.

## 3. Independent, unassisted task

1. Ask the participant to open the invite link and choose their experience category without supplying identifying details.
2. Let them answer the **before** multiple-choice question. Do not correct or explain their answer at this stage.
3. Ask them to choose one scenario they consider relevant and complete all five rounds. "Observe" is a valid outcome; do not require buys or sell orders.
4. Note **whether the participant independently discovers a first action**, understands the cash and the imaginary fee, recognises the fiction-only prices, and can find the next round.
5. Ask them to explain, **without looking at the screen**, what happened to their cash and share holdings when a virtual buy was made. Do not count parroting as an explanation.
6. Let them complete the **after** question and rate clarity. Ask whether they **would voluntarily return**; record it as an expressed intention, not observed retention.
7. If they want to, they may click to prepare an email or copy the anonymous answers. **No automated feedback submission** occurs.
8. Independently invite them to revisit on a future day, without rewards, penalties, streak pressure or repeated reminders. A return must actually occur before it is counted.

Record accessibility issues separately, especially keyboard focus, screen-reader announcements, movement sensitivity, narrow phone width and browser reloads.

## 4. Research recording sheet

Create one row per volunteer in a local owner-owned sheet; use arbitrary participant numbers rather than names. Suggested columns:

| Column | Definition |
| --- | --- |
| Tester code | Researcher's arbitrary test sequence number, not a public device ID |
| Experience | Beginner / returning beginner / intermediate / skipped |
| Device | Desktop / narrow mobile / tablet / unknown |
| Started unassisted? | Yes / needed help / not attempted |
| Completed five rounds? | Yes / no |
| Key obstacle | Quote their own non-identifying description of where they became stuck |
| Before fee question | Correct / incorrect / skipped |
| After fee question | Correct / incorrect / skipped |
| Explained cash vs equity? | Correct in own words / partial / incorrect |
| Clarity 1–5 | Their voluntary answer |
| Said they would revisit? | Yes / maybe / no |
| Actually returned on another day? | Observed / not observed / unknown |
| Suggested fix | One concrete behavior or wording improvement |
| Researcher confidence | Observed directly / volunteer self-report / unknown |

**Baseline concept question:** A $100 fictional one-share purchase plus 0.1% model fee immediately decreases marked account equity by **$0.10** when the displayed price is unchanged. The $100 notional is exchanged for an asset worth $100. **Post-exercise question:** A $200 fictional purchase decreases marked equity by **$0.20** at the same displayed price. These are simplified classroom arithmetic questions, not statements about real execution.

Do not treat a positive answer on these two similar questions as proof of sustained knowledge, real-world skill or a controlled effect.

## 5. Minimal product event plan (existing Amplitude consent only)

The site uses its **existing analytics consent choice**. No new database, client-side fingerprint, location field, identity field, or Arena-specific device identifier is introduced.

| Event name in Amplitude | Trigger | Properties sent |
| --- | --- | --- |
| `TradeHQ Arena Viewed` | Entering the Arena route after accepting analytics | None |
| `TradeHQ Arena Started` | Confirmed start or repeat of one authored scenario | `scenario_id`, `difficulty` |
| `TradeHQ Arena Completed` | Explicitly finishing the fifth round review | `scenario_id`, `difficulty` |
| `TradeHQ Arena Resumed` | Explicitly resuming an unfinished saved exercise | `scenario_id`, `difficulty` |
| `TradeHQ Arena Returned` | A consented browser revisits on a later UTC day, within 30 days of its prior recorded Arena visit | `days_since_last_arena_visit` (1–30) |

These **custom** events never contain virtual P&L, trade action, order size, free text, private journal, survey answers, email or account ID. The existing Amplitude SDK supplies its own consented session/visitor identity; its automatic instrumentation and session-replay behavior follow the separately disclosed general analytics policy. Private Arena note and survey regions are explicitly blocked from replay capture.

**If analytics are rejected, none of the custom Arena events are sent**, and the Arena still works normally. There is no attempt to bypass the browser's preferences. If the Amplitude SDK is blocked, offline or fails to load, the instrument does not interfere with the learning experience. No historical visits can be reconstructed.

**How to interpret numbers:** An Amplitude funnel from Arena Viewed → Arena Started → Arena Completed can show how consented visitors progress. For cohort retention, use Amplitude's retention analysis on Arena Started → Arena Viewed at +1 and +7 days. The `Arena Returned` custom event is a **gap since previous consented same-browser visit**, not a day-7 cohort-retention statistic on its own. Filter out owner's test sessions and automation runs where possible and disclose limitations. Analytics consenters are not a random sample of all users, and distinct people and distinct devices can differ.

**Usability evidence is independent of analytics:** A short observation and a directly explained concept are stronger signals of clarity than a mere five-round completion. Do not build a recommendation system from invented P&L.

## 6. Bounded decision criteria and next build

After an initial group of participants, read the actual results rather than prespecifying success. Investigate an issue when multiple novices independently misread fee accounting, cannot discover the next step, or find the same mobile control unusable. The next feature should address that observed issue, not another broad dashboard.

Promising but **not a statistically validated threshold**: roughly 7 of 10 participants complete without help, roughly 7 of 10 can explain fee-vs-notional in their own words, and a meaningful fraction actually return later without prompting. A failed or mixed result is useful and should change the roadmap.

If the exercise is too repetitive, **do not** simply add dozens of AI-generated or synthetic "realistic" market paths. Prototype one new narrative scenario with the same clear data-provenance and accounting guardrails, then retest. Genuine historical replay requires its own verified data-license and accuracy evaluation.

## 7. Release / privacy checklist

- The test link works with JavaScript and is not a new indexable, thin public route.
- Anonymous participants can choose not to submit any answers.
- No participant answers appear in generated HTML attributes, browser URL query strings, custom analytics properties or database writes.
- Private notes and reflection panels are blocked from the existing consented replay capture.
- The consent banner's Reject choice prevents custom Arena events; revoking consent clears the temporary Arena last-seen day.
- The metrics have tests for invalid dates, same-day revisits and consent rejection.
- Browser reload, dark/light themes and narrow viewport still work.
- Existing main simulated portfolios, leaderboards, subscriptions and approved courses remain unchanged.

**Release does not mean recruitment or empirical evidence has happened.** Mark the study as *prepared* until voluntary real participant responses are actually received.
