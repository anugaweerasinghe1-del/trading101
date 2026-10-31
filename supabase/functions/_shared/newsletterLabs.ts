/**
 * Editorial fact bank. These are NEW teaching exercises prepared for the
 * newsletter, not copied blog summaries. Only the specific cited
 * institutional claim is represented as externally sourced. Arithmetic and
 * toy scenarios are constructed explicitly as hypothetical teaching aids.
 * Primary sources last checked 2026-10-31.
 */
export type NewsletterLab = {
  id: string;
  title: string;
  puzzle: string;
  answer: string;
  limitation: string;
  takeaway: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceScope: string;
};

export const NEWSLETTER_LABS: NewsletterLab[] = [
  {
    id: "stop-gap",
    title: "A stop price is a trigger—not a loss ceiling",
    puzzle: "Fictional example: 100 shares bought at $50 each. A stop order triggers at $47 but fills at $44 after a price gap. Compare the loss imagined at $47 with the loss at the actual fill. Ignore fees.",
    answer: "At $47 the imagined loss is 100 × ($50 − $47) = $300. At $44 the actual hypothetical loss is 100 × ($50 − $44) = $600: $300 more than the original expectation.",
    limitation: "The figures are invented, and a stop order may execute at another price, partially fill, or be unavailable. TradeHQ itself does not execute stop orders.",
    takeaway: "For a risk worksheet, distinguish the *trigger price* from an execution scenario rather than treating a stop as a guaranteed maximum loss.",
    sourceTitle: "SEC Investor.gov — Stop, Stop-Limit, and Trailing Stop Orders",
    sourceUrl: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-15",
    sourceScope: "A triggered stop order becomes a market order and is not guaranteed to execute at the stop price.",
  },
  {
    id: "spread-cost",
    title: "The tiny spread that quietly eats repeated trades",
    puzzle: "Fictional market: best ask $10.04 and best bid $9.96. Assume both quotes stay unchanged, no separate commission, and immediate buy-then-sell of 50 shares. Calculate the round-trip cost; then repeat the same exercise 25 times.",
    answer: "Spread per share = $10.04 − $9.96 = $0.08. For 50 shares the cost of one round trip is $4. For 25 identical round trips the hypothetical total is $100 before any other costs.",
    limitation: "Real spreads, available liquidity, price moves, order sizes and fees vary. These quotes are invented, not live market quotes or a prediction.",
    takeaway: "Before comparing paper strategies, compute their break-even movement after spreads, commissions and possible execution slippage.",
    sourceTitle: "SEC Investor.gov — Executing an Order",
    sourceUrl: "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order",
    sourceScope: "Order execution and the difference between buying and selling prices affect the overall cost of a transaction.",
  },
  {
    id: "fund-overlap",
    title: "Two ETFs can be one concentrated bet",
    puzzle: "Fictional portfolio: 50% is in Fund A and 50% in Fund B. Both funds happen to allocate 20% to the same company. What fraction of the total portfolio is exposed to that one company through these two funds?",
    answer: "Through Fund A: 0.50 × 0.20 = 10%. Through Fund B: another 10%. Total overlapping company exposure = 20% of the portfolio, despite owning two different fund tickers.",
    limitation: "These fund weights are invented, real holdings change, and overlap is not the only measure of diversification. Read dated holdings before drawing conclusions.",
    takeaway: "Diversification is about what you *actually own*, not how many ticker symbols are displayed.",
    sourceTitle: "SEC Investor.gov — Asset Allocation and Diversification",
    sourceUrl: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
    sourceScope: "Investors holding multiple funds should inspect top holdings for overlap rather than assuming multiple funds automatically diversify.",
  },
  {
    id: "fee-hurdle",
    title: "The return your fees consume before you notice",
    puzzle: "Fictional one-year comparison: $10,000 grows 6% before fees to $10,600. At year-end, Fund A charges 1.00% of that ending amount and Fund B charges 0.25%, with no other fees. What is the value difference after that one assumed fee charge?",
    answer: "Fund A fee = 1% × $10,600 = $106; ending value $10,494. Fund B fee = 0.25% × $10,600 = $26.50; ending value $10,573.50. Difference = $79.50 for that single fictional year.",
    limitation: "Real fund expenses are usually accrued through fund NAV over time, not deducted as a single year-end charge. This is an arithmetic comparison, not an exact fee model or return forecast.",
    takeaway: "Ask how fees are actually assessed before comparing headline returns; small rate differences can compound over longer periods.",
    sourceTitle: "SEC Investor.gov — Understanding Fees",
    sourceUrl: "https://www.investor.gov/introduction-investing/getting-started/understanding-fees",
    sourceScope: "Investment expenses reduce the amount remaining invested and can meaningfully change outcomes.",
  },
  {
    id: "drawdown-math",
    title: "A 20% loss needs more than a 20% recovery",
    puzzle: "Fictional account starts at $1,000 and declines 20%. How large a percentage increase, measured from the *remaining* balance, is needed merely to return to $1,000, ignoring costs and new deposits?",
    answer: "After the drop the balance is $800. The missing $200 is 200 ÷ 800 = 25% of the remaining balance. A subsequent 20% gain would reach only $960.",
    limitation: "This explains percentages, not the probability of recovering from a loss or which investments to choose.",
    takeaway: "When a balance changes, the base of the percentage changes too. Translate percentage gains and losses back into actual dollar amounts.",
    sourceTitle: "SEC Investor.gov — Investment Products",
    sourceUrl: "https://www.investor.gov/introduction-investing/investing-basics/investment-products",
    sourceScope: "All investment products carry varying risks, including losing some or all invested funds.",
  },
  {
    id: "periodic-buying",
    title: "Why the average price is not always your average cost",
    puzzle: "Fictional investor makes three equal $100 purchases at prices $20, $10 and $25 per share, assuming fractional shares are allowed and no costs. How many shares are acquired? What is cost per share?",
    answer: "Shares bought = $100/$20 + $100/$10 + $100/$25 = 5 + 10 + 4 = 19. Total cost $300, giving a cost basis of $300/19 ≈ $15.79 per share. The simple mean of the three prices, $18.33, is NOT the equal-dollar cost basis.",
    limitation: "These prices are invented; equal-amount periodic investing can lose money and does not guarantee a return. Fractional-share rules and fees differ.",
    takeaway: "For fixed-dollar purchases, aggregate the dollars and quantities; do not substitute the arithmetic average of displayed prices.",
    sourceTitle: "SEC Investor.gov — Dollar-Cost Averaging",
    sourceUrl: "https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging",
    sourceScope: "Investing fixed dollar amounts periodically generally buys more units at lower prices and fewer at higher prices.",
  },
  {
    id: "limit-fill",
    title: "A good limit price is not a guarantee of execution",
    puzzle: "Fictional trader places a buy limit order for 100 shares at $20. The lowest available selling price during the order's lifetime remains $20.30 and no matching seller offers shares at $20 or below. How many shares are filled under those assumptions?",
    answer: "Zero shares are filled in the stated toy scenario. The buy limit constrains the highest acceptable price; it does not force another participant to sell at that price.",
    limitation: "Real markets can have price improvement, partial fills and changing liquidity. TradeHQ's simulation currently does not accept pending limit orders.",
    takeaway: "Separate a plan's maximum price condition from its assumption that execution is certain.",
    sourceTitle: "SEC Investor.gov — Types of Orders",
    sourceUrl: "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders",
    sourceScope: "Limit orders constrain execution price, but are not guaranteed to fill.",
  },
  {
    id: "turnover-friction",
    title: "Break-even is a moving target once trading has costs",
    puzzle: "Fictional transaction: buy $1,000 of a security and pay a separate $3 purchase commission; later sell the entire position with a separate $3 selling commission. With no spread or taxes, what gross sale proceeds are needed to offset both commissions?",
    answer: "Total commission = $3 + $3 = $6. Required gross sale proceeds = $1,006 just to break even on the $1,000 security cost plus commissions. That is a 0.6% rise versus the purchase amount, ignoring other costs.",
    limitation: "Broker fee schedules, quote spreads, tax and execution vary. This single example is not a recommendation to trade or an estimate of real commissions.",
    takeaway: "Compare net, after-cost outcomes, not just the difference between two chart prices.",
    sourceTitle: "SEC Investor.gov — How Fees and Expenses Affect Your Investment Portfolio",
    sourceUrl: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated",
    sourceScope: "Fees reduce the value of investments and can change net results materially.",
  },
];

export function newsletterLab(week: string, topicId?: string): NewsletterLab {
  if (topicId) {
    const chosen = NEWSLETTER_LABS.find(topic => topic.id === topicId);
    if (!chosen) throw new Error("Unknown educational topic");
    return chosen;
  }
  const weekNumber = Math.floor(Date.parse(week + "T00:00:00Z") / (7 * 86_400_000));
  if (!Number.isFinite(weekNumber)) throw new Error("Invalid newsletter week");
  return NEWSLETTER_LABS[((weekNumber % NEWSLETTER_LABS.length) + NEWSLETTER_LABS.length) % NEWSLETTER_LABS.length];
}

export function appendVerifiedLab(narrative: string, lab: NewsletterLab): string {
  return [
    narrative.trim(),
    "## Try the numbers yourself",
    lab.puzzle,
    "**Answer check:** " + lab.answer,
    "**Where this example stops:** " + lab.limitation,
    "**Original takeaway:** " + lab.takeaway,
    "**Check the primary source:** [" + lab.sourceTitle + "](" + lab.sourceUrl + "). The source supports: " + lab.sourceScope,
  ].join("\n\n");
}

export function validateNewsletterCopy(subject: unknown, preheader: unknown, body: unknown, lab: NewsletterLab): boolean {
  if (typeof subject !== "string" || subject.trim().length < 12 || subject.length > 140) return false;
  if (typeof preheader !== "string" || preheader.trim().length < 20 || preheader.length > 240) return false;
  if (typeof body !== "string" || body.length > 10000) return false;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 230 || words > 800) return false;
  const links = [...body.matchAll(/https?:\/\/[^\s)>\]]+/g)].map(m => m[0].replace(/[.,;]$/, ""));
  const approvedExternal = new Set(NEWSLETTER_LABS.map(t => t.sourceUrl));
  const internal = links.filter(url => url.startsWith("https://www.thetradehq.com/"));
  if (links.length < 1 || links.length > 3 || !links.includes(lab.sourceUrl) ||
      links.some(url => !approvedExternal.has(url) && !url.startsWith("https://www.thetradehq.com/learn/article/")) ||
      internal.length > 1) return false;
  if (!body.includes("**Answer check:**") || !body.includes(lab.answer) || !body.includes("**Where this example stops:**")) return false;
  // Promotional mentions belong in the sender branding, never the teaching body.
  if ((body.match(/\bTradeHQ\b/gi) || []).length > 1) return false;
  if (/guarantee(?:d|s)?\s+(returns?|profit)|risk[- ]free\s+(trading|investing)|real[- ]time\s+(market|price|data)|licensed\s+(financial|adviser)/i.test(subject + " " + body)) return false;
  return true;
}
