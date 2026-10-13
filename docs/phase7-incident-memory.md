# Phase 7: offline feedback memory experiment

This draft implements a bounded, deterministic foundation for a memory-based agent. It is isolated from the operational monitor, admin panel, repair worker and production database. It does not train a model, diagnose a demonstrated root cause, create repairs or grant release authority.

Run `node scripts/verify-incident-memory.mjs`. The existing AI-agent regression suite runs the same test. Runtime uses Node built-ins only; no dependencies, provider calls, storage service, schedules, paid fallbacks, credentials or production writes are introduced.

## Implemented behavior

`recommendIncidentInvestigation` accepts a current structured incident, a versioned memory snapshot and an explicit evaluation time. `parseIncidentMemory` bounds a JSON snapshot to 64 KiB. At most 100 records are accepted; records older than 30 days are excluded from recommendations. Snapshots exceeding limits are rejected rather than silently dropping evidence. The caller retains responsibility for storage; there is no persistence worker in this prototype.

Records contain only a fixed category, allowlisted public route, GitHub run ID, commit SHA, fixed inspection action, reported outcome and canonical UTC time. Free text, query strings, arbitrary URLs, verification claims, prompts, credentials and permission fields are rejected. There is no user-data ingestion. Evidence references are syntactically constrained, but this offline module does not authenticate them: every imported record remains `UNVERIFIED_IMPORT`.

Reported unsuccessful or rejected suggestions are suppressed for the same category and route during retention. Any recently attempted suggestion receives a 24-hour cooldown. Duplicate records count once; conflicting reports for the same run/action are rejected. Reported successes never become verified successes and do not improve rankings. If all applicable suggestions are suppressed, or the category is unknown, the system abstains. Negative feedback can conservatively reduce suggestions; untrusted feedback can therefore deny a suggestion but cannot authorize a repair.

All output remains an investigation suggestion with `rootCauseVerified: false`. Model calls, code proposals, production writes, merges and releases remain disallowed. Imported memory cannot rewrite these rules. Protected routes receive the same denial of authority. A caller-controlled clock or clearing a snapshot cannot be relied on as a durable operational cooldown; neither is an authorization mechanism.

## Measured result and limits

Six synthetic category replays report one previously failed suggestion each. The stateless baseline repeats 6/6; the memory variant repeats 0/6 and selects the remaining inspection suggestion. Tests also demonstrate all-candidate abstention, unknown-category abstention, unverified-success distrust, duplicate/conflicting evidence handling, retention/cooldown boundaries, fixed privacy schema, inert output and rejection of accessor inputs. Model calls and production writes are zero.

These scenario labels are synthetic, not fabricated production history. Category labels are supplied as input, so category identification accuracy is not evaluated. There is no established production false-positive rate, recommendation usefulness, verified repair outcome, reduction in owner interventions or model training result. The evaluation is a regression demonstration, not an estimate of generalization. No original-rubric maturity point is claimed by adding this experiment.

## Architecture comparison

| Architecture | Feasibility here | Remaining requirement |
| --- | --- | --- |
| A: memory-based LLM agent | Extend the existing agent using this structured retrieval/suppression foundation. The memory changes context and recommendations; model weights do not change. Offline deterministic behavior needs no API. | Independently authenticated incident/outcome ingestion, durable bounded retention, evaluation on real permitted records, account-specific Gemini quota and billing verification before any additional calls. |
| B: genuine statistical learning | A small local classifier could train on independently labeled categories using permitted structured features. This would be actual training, unlike stored memory. | A sufficiently representative labeled dataset and held-out evaluation showing benefit over the existing deterministic classifier. Neither is established. Training on the six scripted examples would not establish useful production learning. Local LLM hosting capacity has not been verified. |

Choose A's deterministic offline foundation now. Defer external LLM use and genuine ML until their data, capacity and cost gates are demonstrated. A chatbot and daily repair bot require further integration and cannot be called operational from this draft.

Google's public Gemini documentation checked on 2026-10-12 says rate limits are project-wide, model/tier-dependent, observable in AI Studio and not guaranteed. Free-to-paid transition requires billing setup. Public documentation cannot establish the connected account's current plan, spare capacity or billing configuration. The additional expected model usage in this draft is exactly zero, with zero retries and no alternate provider. No new schedule or paid resource has been enabled.

Primary references: https://ai.google.dev/gemini-api/docs/rate-limits and https://ai.google.dev/gemini-api/docs/billing .

## Next integration gate

Keep the draft unmerged while the preceding production release's required readiness evidence remains unresolved. After that gate clears, independently review and validate this exact head and its previews before merge. A subsequent integration must authenticate GitHub evidence and independently verified investigation outcomes without accepting JSON trust assertions. It must reuse the existing durable stop, budget, lease, owner approval and separate release checks. This module supplies no substitute for them.
