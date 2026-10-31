# TradeHQ — external AdSense gates and opt-in direct contact launch

Date: 31 October 2026. This is a **deployment handoff**, not AdSense approval or evidence of a completed delivery-service activation.

## Optional direct contact: deliberately disabled until real production configuration

The existing /contact page supports native mailto and copy-to-webmail without a third-party contact API. An optional direct-mail transport now exists in `functions/api/contact.ts`, routed by `scripts/prepare-cloudflare.mjs` to `/api/contact` on Cloudflare Pages. GET returns `enabled:false` unless **all five** runtime values below are set AND the request is from the canonical HTTPS host; only then will the optional UI render and load Turnstile. The server refuses direct submission from pages.dev mirrors.

Configure securely in **Cloudflare Pages → tradehq-preview → Settings → Variables and Secrets**, in the **production environment** only:

- `RESEND_API_KEY`: secret Resend API key. Never commit, paste into a prompt, or put in Vite variables.
- `CONTACT_FROM_EMAIL`: a verified sending mailbox on a domain whose DNS/SPF/DKIM requirements have been completed in Resend. Do not use an unverified onboarding sender.
- `CONTACT_TO_EMAIL`: owner's authenticated inbox for received enquiries. Only the server controls the recipient; requests cannot choose it.
- `CONTACT_TURNSTILE_SITE_KEY`: public Turnstile sitekey with the exact www.thetradehq.com and/or thetradehq.com hostname(s) explicitly enabled.
- `CONTACT_TURNSTILE_SECRET`: paired Turnstile secret, private to Cloudflare.

No credentials have been created or set by this code change. Do not assume an old `RESEND_API_KEY` from an undeployed newsletter function works; sender and delivery must be verified independently.

Security properties: server-side challenge validation with exact hostname and action `contact`, single-use tokens, same-origin POST, field validation, honeypot, 8KB maximum body, no user-selected destination, no logged request bodies, no site database storage, no false positive "sent" toast. Resend and the recipient mail provider **do** process/store delivery data as described in Privacy. Turnstile does not eliminate abuse; add Cloudflare WAF/rate limits for `/api/contact` and monitor delivery abuse.

Activation checklist (owner/provider actions):
1. Verify sender domain and recipient inbox, create Turnstile keys for the **actual canonical hostname**, configure all five production secrets.
2. Re-deploy exact tested main commit to propagate new runtime variables if needed.
3. Open /api/contact in production: `enabled:true` with public siteKey, **no secret exposed**. On pages.dev: `enabled:false`.
4. Use a **disposable** legitimate test enquiry on /contact, complete challenge, confirm receipt at destination, reply_to, privacy disclosure and no duplicate sends. With a failed/expired challenge ensure zero emails are sent. Confirm mailto/copy always remain usable.
5. Verify server-side 503 on missing configuration; never present direct send as active without working provider.
6. Confirm WAF thresholds and provider usage limits. Audit Google CMP/ad consent separately.

## Product Hunt and other off-site descriptions

DeepSeek's 31 October audit quotes an old Product Hunt listing stating **$10,000 virtual cash**, **150+** assets, and **live market data**, while the product's current homepage describes **$100,000 virtual cash, 170 practice instruments, and simulated/cached/delayed or unavailable quotes**. Treat historical third-party copies as a **potential conflict to verify on the original listing** before editing; do not assert its latest state from the audit alone. No Product Hunt authenticated editor is attached to this workspace, and GitHub commits cannot alter Product Hunt.

**Proposed accurate listing copy to paste through the owner's Product Hunt account after verification:**

**Tagline:** Free paper trading with $100K in virtual cash — no signup.

**Description:** Practise market orders and portfolio arithmetic across 170 simulated instruments, including stocks, ETFs, crypto, forex and commodities. Charts and quotes may be simulated, cached, delayed or unavailable; TradeHQ is not a live trading feed or brokerage. Optional lessons cover options and futures conceptually, not as executable contracts. No real money or personalized investment advice.

Avoid unverified claims of real-time quotes, profitable trading, financial certification, outcomes or investment performance. Update other owned off-site profiles if they actually contain conflicting descriptions. Real third-party profiles and backlinks cannot be edited through this repository.

## AdSense account, privacy, traffic and regional behavior: not verified by a source-code build

Verify **in the AdSense account and Google Privacy & messaging UI**, not by inferring from an emailed deployment:
- Account ownership and eligibility, site approval status and **exact most recent rejection/policy-center reason**. Approval cannot be guaranteed. The GitHub build does not grant AdSense approval.
- Actual CMP configuration and Google-certified TCF integration for EEA/UK/Swiss visitors when applicable; third-party privacy notices and vendor choices; optional Amplitude analytics must stay separate.
- Ad code actually loaded only in the permitted conditions; placements not obstructing navigation and never encouraging clicks; high-risk content and age-specific/personalization safeguards where applicable.
- Traffic/referrer/invalid-activity diagnostics from account/analytics, not invented from GitHub or a crawler. Do not access genuine user messages or personal financial history.
- Production `/sitemap.xml`, `/robots.txt`, `/ads.txt`, and static/dynamic canonical headers verified from the deployed custom domain with an authenticated browser or reliable HTTP fetch. CI also validates build outputs, but cannot certify Google indexing.
- Review all *monetized* asset pages for substantial unique value. Existing non-indexable practice pages remain accessible; `noindex` does not by itself guarantee AdSense approval or exempt a monetized page from policy.

## Editorial checks and provenance (no fabricated reviewer)

The nine static learning articles in `src/lib/learnArticles.ts` now have **explicit, limited source-check scope**. The source check on 31 October covers selected definitions, simulator capabilities and arithmetic described per article—not line-by-line professional review. Some other dynamic courses, glossary pages and asset pages still honestly report missing independent review dates. They cannot receive retroactive verified dates without being actually checked.

Never manufacture credentials, outside reviews, publication dates, endorsements, age flags, or volume of original research. Distinguish *a cited external definition* from *verification of every claim on an article*.

## Sources
- SEC Investor.gov, Types of Orders: https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders
- SEC Investor.gov, Crypto Asset-Related Investments: https://www.investor.gov/introduction-investing/investing-basics/investment-products/crypto-asset-related-investments
- SEC Investor.gov, Asset Allocation: https://www.investor.gov/introduction-investing/getting-started/asset-allocation
- Cloudflare Turnstile Siteverify: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Resend email sending API: https://resend.com/docs/api-reference/emails/send-email
- Google Publisher Policies: https://support.google.com/adsense/answer/10502938
