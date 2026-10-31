# TradeHQ Weekly — real public subscriber setup

## What is already connected

- The owner opted in explicitly, using the previously verified test inbox. Exactly one new `public.newsletter_contacts` record was inserted as `confirmed`; legacy `public.subscribers` entries were not copied.
- The separate `newsletter-public` Supabase function accepts an explicit opt-in, sends an email confirmation through the already verified Resend sender, confirms only after a token action, and supports unsubscribe with a long random token.
- `newsletter-dispatch` is private and requires the existing TradeHQ admin master key, exact approved edition revision, and explicit Publish confirmation.
- `newsletter-provider-events` verifies the provider's Svix signature, records delivered/bounced/complained events and removes problematic recipients from eligible sends.
- Application limits: at most 20 unique recipients per Publish call, no more than 60 newsletter recipients per UTC day and 2,500 per UTC month (by the app's receipt ledger). Public confirmation emails are also capped at 30/day. Resend's own limits take precedence.
- Every published email has a visible unsubscribe link and one-click List-Unsubscribe headers, using the existing verified domain. Unsubscribe is effective immediately without a login.
- The footer and home page now link to a true independent educational newsletter, not the old unused contact-card proxy.

## Required ONE-TIME external setup before real publishing

The public signup/confirmation endpoints do **not** need the webhook to work. Publishing is fail-closed until Resend's signed event webhook is configured:

1. Go to [Resend Webhooks](https://resend.com/webhooks) → **Add Endpoint**.
2. Enter the exact URL:
   `https://cbdktpjgczhthflspqjb.supabase.co/functions/v1/newsletter-provider-events`
3. Choose `email.delivered`, `email.bounced`, and `email.complained` events (add `email.suppressed` if offered). Save.
4. Copy the **signing secret** (starts `whsec_`) privately. In Supabase project **Edge Functions → Secrets**, create `RESEND_WEBHOOK_SECRET` with that exact value. Never paste it into chat or GitHub.
5. Use Resend's webhook test event and confirm successful HTTP 200. In the private Newsletter Desk refresh subscribers. Publishing will unlock when the secret exists. Do not manually email historical contacts.

## Weekly workflow

Every Monday 9 AM Asia/Colombo, the existing private AI automation creates the next unsent newsletter draft (subject to configured free Gemini quota). The owner reviews it and explicitly **approves**, then presses **Publish approved issue to subscribers**. Publishing requires deliberate confirmation and sends to confirmed contacts only. `Approve` alone never emails people. The same issue cannot be resent to the same person, even if the button is pressed again.

For over 20 subscribers, use Publish again after each completed batch; the server skips already reserved/sent edition-contact combinations. Free-tier limits can stop a run. Unknown provider outcomes are deliberately not retried automatically, to prevent duplicate messages.

The site records `accepted` when Resend acknowledges a send; this is not proof of inbox delivery. Signed webhooks later provide delivered, bounced or complained status. Any send failures or quota exhaustion should be investigated through Resend before continuing. No automatic billing upgrades should be enabled.

## Privacy boundary

The old `public.subscribers` table has two unverified legacy email records, still isolated. They do not count as confirmed and are never mailed. User-facing signup asks for explicit consent and confirmation, and `/privacy` documents storage, purpose and removal requests.

Public URLs:
- `https://www.thetradehq.com/newsletter`
- `https://www.thetradehq.com/newsletter/confirm?token=...`
- `https://www.thetradehq.com/newsletter/unsubscribe?token=...`

## Known rollout gates

The public website signup is only live when GitHub PR and Cloudflare production deployment succeed. At the time of authoring, the backend is independently deployed but the PR may still be protected pending CI; do not claim public web forms are live without checking. Vercel rate-limit errors must not be bypassed by purchasing an upgrade without user consent.

Relevant provider documentation:
- https://resend.com/pricing
- https://resend.com/docs/knowledge-base/how-do-i-set-up-webhooks
- https://resend.com/blog/microsoft-bulk-sending-requirements-2025
