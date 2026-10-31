# TradeHQ newsletter: original value-first lessons (31 Oct 2026)

This document updates the earlier `newsletter-editorial-rollout-20261031.md` design. The original first AI issue mainly advertised/linked TradeHQ beginner articles and included a weak percentage arithmetic question; the owner asked for genuine, independently useful educational content that is **not just a summary of the website**.

## What changed
- Every scheduled Monday private draft focuses on one of eight **originally authored**, reproducible learning problems: stop-order execution gaps, spread friction, overlapping fund holdings, fee hurdles, drawdown recovery, dollar-cost basis, missed limit fills and commissions.
- The Gemini API writes a 330–460 word explanatory **narrative** explaining a non-obvious misunderstanding, the decision tradeoff and realistic failure mode. The server appends the approved hypothetical exercise, its **prechecked numerical answer**, its limitations and an institutional reference.
- **External primary sources only are necessary** (SEC Investor.gov), not forced TradeHQ product CTAs. Each SEC page supports a narrow mechanism; it does not certify the fictional numbers or the wider narrative.
- An issue may optionally include one useful TradeHQ educational link in a human edit; newsletter prose may contain **at most one brand mention** in an automatically generated issue. No exclusivity or current news claim is implied.
- An editor can select the week's topic and request an **unsaved AI preview**. A preview cannot silently change any approved newsletter. Previously approved issues must be deliberately **reopened for revisions**, which clears approval and increments the revision number while preserving the original text. The owner must then save and explicitly approve the revised issue.
- Every automatic draft remains a **private draft**, not an outbound newsletter. No subscriber addresses, message delivery, mail provider or consent settings are touched.

## Facts, calculations and limitations
Source URLs are restricted to exact trusted SEC Investor.gov pages that were checked on 31 October 2026. Their scopes and example arithmetic are in `supabase/functions/_shared/newsletterLabs.ts`. The eight specific checks are covered in the repository build test `scripts/verify-newsletter-original-lessons.mjs`. No personal investment advice, simulated return predictions, guaranteed outcomes, fictitious expert review or new market data are allowed.

This does not establish that a lesson contains a novel financial fact never published on the internet; the value is in an **original worked case** and a reusable analytical process for the reader.

## Approved edition before change
The week beginning **26 October 2026** was approved by the owner on 31 October, but **not sent**. This deployment leaves that approval and its text intact. In the Admin Newsletter Desk the owner can choose **Reopen for revisions**, choose a deeper topic, generate an AI preview, edit, **Save edits**, tick review and **Approve draft** again. Generated preview content does not replace the stored issue until Save.

## Further safeguards
Don't activate subscriber delivery until the opt-in, unsubscribe, provider verification, bounce/complaint suppression and delivery ledger are implemented. No automatically generated email is sent on the Monday schedule. Site and server project IDs are unchanged.

## Primary resources
- [SEC Investor.gov — Stop and Stop-Limit Orders](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-15)
- [SEC Investor.gov — Executing an Order](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order)
- [SEC Investor.gov — Asset Allocation](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)
- [SEC Investor.gov — Fees](https://www.investor.gov/introduction-investing/getting-started/understanding-fees)
