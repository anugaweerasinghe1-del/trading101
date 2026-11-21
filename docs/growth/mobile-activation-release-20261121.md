# Mobile-first activation & retention: evidence, implementation, safeguards

**Date:** 21 November 2026  
**Scope:** Existing /trade/:symbol, /trade, /learn and voluntary mobile order drawer only. No new indexable pages.

## First-party observations

- Live read-only Supabase baseline: **125 non-anonymous registered users**, **47** accounts with recorded virtual trades, **18** accounts with recorded learning activity, **12** users signed in during the last 7 days. These are account-level counts, not funnel conversion, retention, or complete guest activity.
- Consented Amplitude `[Amplitude] Page Viewed` last recorded on 18 November; a small number of Practice Arena events were more recent. Current data does **not** prove a specific mobile conversion bottleneck or the impact of releases #495–#497. Do not claim otherwise.
- The `/trade/:symbol` source placed its only mobile order drawer *after* asset FAQs, analysis, worksheets, related markets and footer disclaimer. This is objectively poor product-action discoverability on small screens even if the page remains useful for SEO.
- The mobile order drawer previously closed and cleared quantity, journal and side when the `onTrade` promise resolved, including when the parent showed `Order Failed`. A user could lose their input without a confirmed order.

## Hypotheses challenged

1. **"Moving the order CTA up will triple retention" — unsupported.** This intervention primarily addresses mobile task discovery and completion. Measure meaningful educational returns, not just virtual trade frequency.
2. **"SEO text harms mobile UX" — oversimplified.** Keep every authored reference, AI summary, FAQ and disclaimer. Place secondary editorial sections after usable controls and charts instead of removing content.
3. **"All rejected orders are harmless to retry" — false.** An interrupted signed-in request can leave the actual result uncertain. The new drawer preserves inputs and explicitly advises checking portfolio before attempting again. Existing owner-isolation checks remain authoritative.
4. **"More tracking creates a valid retention dataset" — false without consent and adequate volume.** New generic milestones reuse the existing Amplitude consent gate. Never emit symbols, quantities, notional values, P&L, emails, user IDs or content of journal/quiz answers. Guest browser clearing and cross-device usage are invisible to this measurement.
5. **"Rewrite all SEO metadata now" — too risky.** Bitcoin titles/canonicals were just changed in #496. This release preserves all existing URL identities, SEO titles, schema, sitemap and indexability.

## Implementation / success criteria

- On asset pages, show one clearly labelled mobile virtual-order launcher immediately after the short asset intro and before the chart and long-form SEO material. The chart retains its previously validated 520px height: the speculative 360px reduction coincided with a SHIB tiny-price axis test timeout and was reverted as a precaution. The mobile action remains above the chart.
- The drawer retains inputs on explicitly rejected or thrown outcomes; both /trade and /trade/:symbol return a boolean outcome. Do not report "executed" to the drawer on failed saves or owner mismatches. There must be no automatic trade, sign-up requirement, streak, reminder, ranking reward or deceptive success state.
- The learning hub now counts as a consented entry point, as distinct from a quick-read completion. Measure (consented): Bitcoin simulator viewed → mobile order panel opened → virtual practice outcome → learning hub/review → saved lesson completion → later-day educational return.
- Guardrails: ensure the user can read charts without an order, preserve all SEO blocks and disclaimers, keep mobile order drawer out of the desktop view, retain recovery prompts and quote-provenance labels, verify declined analytics consent suppresses all new milestones.
- Current tracking is an **observed same-browser** proxy for later-day return, *not* causal D7 signed-in retention. No first-party database migration or additional user tracking is authorized or needed for this release.

## Release validation and measurement

- Build plus new postbuild regression `verify-mobile-activation-funnel.ts`: element order, one mobile CTA, fail-safe order state, duplicate-submission guard, consent boundaries, two trading interfaces, exact SEO routes unchanged.
- Existing Phase 3 application, content/AdSense privacy safeguards, disposable PostgreSQL controls, full browser desktop/mobile editorial route matrix, Cloudflare preview and required validation must pass **for the exact PR head SHA** before merge.
- Verify merge SHA on `main` and an actual **Cloudflare Pages production-success check for that same SHA**; do not treat a preview as deployment confirmation.
- After 7–28 days compare meaningful educational sessions across consented clients, review starts/completions and returned visits while watching rejection/error rates, direct trading completion and signed-in server learning progression. Keep Google Search Console /trade/btc CTR, impressions and average position as separate SEO guardrails. Sample sizes are small: no claims of 3× retention, #1 rank or statistical significance without data.
