# TradeHQ newsletter — weekly AI editorial workflow (31 Oct 2026)

## What the user asked for
Once per week, create a friendly educational newsletter draft with AI. The owner should open the existing private TradeHQ admin area, edit the draft, inspect links and claims, and explicitly approve the edition. **No automatic sending**. A full email newsletter also requires permission-based signups, unsubscribes, provider delivery and a reliable history.

## What this PR actually implements (draft-only)
- `/admin/newsletter` Newsletter Desk, linked from `/admin`, protected by the **existing** master key through `newsletter-editor`. The admin key is held in memory and is never committed, stored in localStorage or sent to GitHub.
- `newsletter_editions` service-role-only Supabase table with a unique `week_of`, an atomic revision number and independent editorial states (`generating/draft/failed/approved`); no audience table is queried and **no email is sent**.
- Edge function `newsletter-editor`: authenticated **list, generate-weekly, save, approve** actions. Only a valid one-time weekly slot is drafted; a second request for that week does not overwrite an editorial revision. Saving edits bumps the revision; approval checks both the revision and a confirmed reviewer.
- Gemini free-tier-capable draft writing, with a strict prompt restricted to **existing published TradeHQ educational articles**. No prices, returns, breaking news, invented market commentary, financial credentials or "risk-free" claim. The model produces a subject, preheader and 300–450 word educational body with actual site links; local validation checks length, link allowlist and dangerous promises. Editing remains mandatory before approval.
- Supabase `pg_cron` and `pg_net` schedule a **draft-only** call every Monday at 09:00 Asia/Colombo (03:30 UTC). The cryptographically generated token stays encrypted inside Vault. The action never sends emails. Weekly duplicate drafts are prevented by the unique week constraint.
- The older, unconfigured Supabase function `send-newsletter` is **not enabled, called or changed**. It has no unsubscribe, deduplication or permission evidence and should not be deployed as-is.

## Deployment prerequisites — not completed by GitHub alone
1. Connect the existing Supabase project using a Supabase administration integration; confirm that the project matches `supabase/config.toml`, back up migration state and apply `supabase/migrations/20261031103000_weekly_newsletter_editorial.sql`.
2. Deploy Supabase function `newsletter-editor` with `verify_jwt=false`, because it independently validates the existing owner key (and scheduler secret), and uses rate-limiting before any data access.
3. The site **already has** a Gemini key stored securely in Supabase Vault and a model configured in course generation. The newsletter Edge function reuses this existing key and model only when the existing free-tier confirmation is enabled. No additional Gemini key or plan required; actual quota still varies by project, so check usage without enabling paid billing.
4. The SQL migration creates a unique 256-bit scheduler secret in Supabase Vault, never stored in GitHub, logs or the client. It also creates a minimal service-role-only RPC to load the existing free Gemini key. The scheduler requires installed `pg_cron` and `pg_net`, already observed on the connected project.
5. Log into `/admin/newsletter` with the same TradeHQ administrator master key. First load the empty queue and generate one private draft. Check actual rendered content, links, mathematical claims, privacy and status updates. Save an edit; verify a stale revision fails; explicitly approve the saved draft. Confirm there are **zero sent messages**.
6. With a valid owner key, trigger the admin's **Generate this week's draft** once and test the private edit/approval cycle. Query `cron.job` for the Monday 03:30 UTC entry; inspect `cron.job_run_details` after the first scheduled occurrence. Failed generation should leave a private `failed` entry (no approval, no sending), not fabricated copy.
7. Review normal ad/consent and privacy impacts before enabling **any subscriber-facing signup or sender**.

## Why the historic newsletter was not safe to enable
The 10 October 2026 `docs/newsletter-feasibility-20261010.md` report found an old `send-newsletter` source with stale "institutional", "149 assets" and "risk-free" copy. It had no verified sender, double opt-in, unsubscribe controls, email delivery ledger or deduplication. It had **two legacy email records, not two confirmed permissions**. Do **not** import, email, expose, or count them as newsletter subscribers.

## Second phase before actual publication by email
Not implemented or claimed done by this PR: a **new explicit opt-in**, confirmation/double-opt-in records, separate consent purpose/version, no public address access, unsubscribed/bounce/complaint suppression, a one-click unsubscribe endpoint and visible footer, per-recipient delivery idempotency, retry/unknown-outcome handling, rate/quotas, provider verification, sender-domain DNS validation, and editorially approved publishing to that confirmed list. An authenticated publish button must check all gates before sending any message. No automatic recipient sends should ever occur on a weekly cron.

Resend currently advertises a $0 transactional plan with **3,000/month and 100/day**, and different limits for marketing broadcasts/contacts. The actual user's free account limits and domain eligibility have not been verified. Do not assume the Cloudflare contact sender is configured, or that the old Lovable gateway works. This PR needs **no Resend credentials** to generate private drafts.

## AdSense and audience
The user's AdSense account is owned by their father. This editorial newsletter does **not** alter AdSense, make age claims, or create any visitor data flows while subscriber signup/sending is disabled. Publishing financial education remains contingent on the human checking facts; no autogenerated market prices or third-party financial endorsement are claimed. Unsubscribe and consent protections are required before a real campaign.

## Cost and platform sources
- Resend pricing: https://resend.com/pricing
- Gemini free pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
