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
    id: "stock-ownership",
    title: "What do you actually own when you buy a stock?",
    puzzle: "Fictional example: Mira buys two shares in a company for $30 each. A week later the quoted price is $27. How much are the two shares now worth at that quote, before fees? Is the company required to pay Mira $30 per share to make her whole?",
    answer: "Two shares at $27 have a quoted value of $54, compared with the $60 purchase cost: a $6 unrealized decrease. Owning shares is owning part of a business, not holding a bank deposit or a promise of repayment.",
    limitation: "Fictional prices, and a quoted price does not guarantee what someone would receive when selling. Shareholders can lose all their investment, and dividends are not automatic.",
    takeaway: "A share is an ownership interest whose market value can move. Separate what you own from what you hope its price will do.",
    sourceTitle: "SEC Investor.gov — Stocks FAQs",
    sourceUrl: "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks",
    sourceScope: "Stocks represent a share of ownership in a company and prices can rise or fall, with no guarantee of profit or repayment.",
  },
  {
    id: "compound-growth",
    title: "Why growing by 10% twice is not the same as 20% once",
    puzzle: "Fictional savings illustration: $100 increases by a fixed 10% in year one and again by 10% in year two, with the entire balance left in place. What is the final balance? Compare it with simply adding 20% of the original $100.",
    answer: "After year one the balance is $110. The next 10% applies to $110, giving $121. Simply adding 20% of the starting $100 would give $120; the extra $1 is growth earned on earlier growth.",
    limitation: "A fixed 10% return is a teaching assumption, not a forecast or a guaranteed investment rate. Real investments can fall and fees or taxes change outcomes.",
    takeaway: "When percentages repeat over time, ask which amount each percentage is calculated from.",
    sourceTitle: "SEC Investor.gov — Introduction to Investing",
    sourceUrl: "https://www.investor.gov/introduction-investing",
    sourceScope: "Compound growth includes returns on both the original invested amount and earlier returns, and investments involve risk.",
  },
  {
    id: "time-horizon",
    title: "Why the date you need your money matters",
    puzzle: "Fictional situation: A student needs $500 for a fixed payment in four weeks. Option A holds exactly $500 in cash. Option B puts it in a volatile investment that may rise or fall before the bill is due. Which option better preserves the known $500 payment under the stated assumptions, and what important risk does Option B add?",
    answer: "Under these simplified assumptions, Option A preserves the $500 available for the payment. Option B can be worth less when the payment comes due, even if the investment might do well over a much longer period. The time until you need the money changes the risk you can tolerate.",
    limitation: "This is not a personalized savings recommendation. Cash can still face inflation and institutional risks, and actual savings products, guarantees and access rules vary by country.",
    takeaway: "Before focusing on possible profit, write down when you actually need the money and what happens if prices fall before then.",
    sourceTitle: "SEC Investor.gov — Asset Allocation and Diversification",
    sourceUrl: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
    sourceScope: "Time horizon and willingness to bear losses are important considerations when choosing an investment mix.",
  },
  {
    id: "diversification-first",
    title: "Five investments can change the size of one company's mistake",
    puzzle: "Fictional comparison: Portfolio A puts $500 into one company. Portfolio B puts $100 into each of five unrelated companies. Suppose that one company drops 40% and every other position stays unchanged. How much does each portfolio lose under these assumptions?",
    answer: "Portfolio A loses 40% of $500, or $200. Portfolio B loses 40% of the single $100 holding, or $40, while the other four remain unchanged in this fictional scenario. Spreading exposure changes the impact of one holding.",
    limitation: "The assumptions are invented. Investments can decline together; owning several tickers does not eliminate market risk or guarantee smaller losses.",
    takeaway: "Ask what the investments are exposed to, not merely how many different names appear on a list.",
    sourceTitle: "SEC Investor.gov — Asset Allocation and Diversification",
    sourceUrl: "https://www.investor.gov/introduction-investing/getting-started/asset-allocation",
    sourceScope: "Spreading investments among different holdings can reduce concentration, although diversification does not eliminate investment risk.",
  },

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

/**
 * Unlike a single article template, these formats rotate deterministically.
 * There are 10 formats and 12 topics: the same combination recurs only every
 * 60 weeks, and no adjacent week has the same format or topic.
 */
export type NewsletterFormat = {
  id: string;
  title: string;
  requiredHeading: string;
  teachingApproach: string;
  exerciseHeading: string;
  answerLabel: string;
};
export const NEWSLETTER_FORMATS: NewsletterFormat[] = [
  { id: "fictional-story", title: "A tiny fictional story", requiredHeading: "## The moment that matters",
    teachingApproach: "Start with a vivid fictional character facing a small everyday financial surprise. Reveal the hidden mechanism gradually, then explain the lesson in plain English.",
    exerciseHeading: "## Your turn: finish the story", answerLabel: "What the example shows" },
  { id: "myth-check", title: "Myth or fact?", requiredHeading: "## A claim worth questioning",
    teachingApproach: "Lead with one believable misconception a first-time reader might have. Test it against an easy fictional scenario and explain gently why it is incomplete.",
    exerciseHeading: "## Myth-check challenge", answerLabel: "The correction" },
  { id: "two-choices", title: "Two choices, two trade-offs", requiredHeading: "## Two ways to think about it",
    teachingApproach: "Compare two reasonable-sounding decisions or explanations side by side. Show the important trade-off and when each assumption breaks, not a simplistic winner.",
    exerciseHeading: "## Compare the outcomes", answerLabel: "How to reason it through" },
  { id: "money-detective", title: "Money detective", requiredHeading: "## Find the missing detail",
    teachingApproach: "Present a fictional receipt, claim or brief calculation with a missing assumption. Guide the reader to discover the overlooked detail without treating them as foolish.",
    exerciseHeading: "## Solve the case", answerLabel: "Case explained" },
  { id: "everyday-analogy", title: "An analogy that teaches", requiredHeading: "## Picture this instead",
    teachingApproach: "Start with an everyday non-financial analogy a complete beginner knows. Map it carefully onto this week's financial idea, and clearly state where the analogy stops working.",
    exerciseHeading: "## Test the analogy", answerLabel: "What really happens" },
  { id: "beginner-mailbag", title: "A beginner's question", requiredHeading: "## A question from a first-time reader",
    teachingApproach: "Answer one fictional email from someone with zero experience. Give a warm direct answer, define necessary words, then add a counterexample and a practical thought experiment.",
    exerciseHeading: "## Try answering this", answerLabel: "A useful answer" },
  { id: "walkthrough", title: "A three-step walkthrough", requiredHeading: "## Walk through the decision",
    teachingApproach: "Work through an invented example in three natural, clearly distinct steps. At each step show the simple reasoning rather than introducing complex terminology.",
    exerciseHeading: "## Run the example", answerLabel: "Step-by-step answer" },
  { id: "fork-in-road", title: "What happens next?", requiredHeading: "## Two possible endings",
    teachingApproach: "Describe one starting situation and two alternative imaginary outcomes. Explain which assumption changes the ending; avoid predictions or implied guarantees.",
    exerciseHeading: "## Predict the ending", answerLabel: "Why the outcomes differ" },
  { id: "spot-the-error", title: "Spot the beginner mistake", requiredHeading: "## What sounds right—but isn't?",
    teachingApproach: "Offer one short fictional beginner explanation with a tempting error. Give the reader an opportunity to catch it, then show a correct and kinder way to think.",
    exerciseHeading: "## Catch the error", answerLabel: "The missing piece" },
  { id: "five-minute-lab", title: "Five-minute mini lab", requiredHeading: "## Try a tiny experiment",
    teachingApproach: "Teach with a low-stakes mental or pen-and-paper experiment that requires no account and no money. Show each assumption, a surprising but simple result, and the limit of the exercise.",
    exerciseHeading: "## Check your result", answerLabel: "Worked explanation" },
];
export function newsletterFormat(week: string): NewsletterFormat {
  const weekNumber = Math.floor(Date.parse(week + "T00:00:00Z") / (7 * 86_400_000));
  if (!Number.isFinite(weekNumber)) throw new Error("Invalid newsletter week");
  return NEWSLETTER_FORMATS[((weekNumber % NEWSLETTER_FORMATS.length) + NEWSLETTER_FORMATS.length) % NEWSLETTER_FORMATS.length];
}

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

/** Server-attached, source-grounded checkpoint. Its framing rotates too. */
export function appendVerifiedLab(narrative: string, lab: NewsletterLab, format: NewsletterFormat): string {
  return [
    narrative.trim(),
    format.exerciseHeading,
    lab.puzzle,
    "**" + format.answerLabel + ":** " + lab.answer,
    "**Keep in mind:** " + lab.limitation,
    "**One thing to remember:** " + lab.takeaway,
    "**Independent source:** [" + lab.sourceTitle + "](" + lab.sourceUrl + "). " + lab.sourceScope,
  ].join("\n\n");
}

export function validateNewsletterCopy(
  subject: unknown, preheader: unknown, body: unknown, lab: NewsletterLab, format: NewsletterFormat,
): boolean {
  if (typeof subject !== "string" || subject.trim().length < 12 || subject.length > 140) return false;
  if (typeof preheader !== "string" || preheader.trim().length < 20 || preheader.length > 240) return false;
  if (typeof body !== "string" || body.length > 10000) return false;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  if (words < 210 || words > 800) return false;
  // One format-specific heading enforces different structures across weeks,
  // while other headings remain editorially flexible.
  if (!body.includes(format.requiredHeading) || !body.includes(format.exerciseHeading)) return false;
  const links = [...body.matchAll(/https?:\/\/[^\s)>\]]+/g)].map(m => m[0].replace(/[.,;]$/, ""));
  const approvedExternal = new Set(NEWSLETTER_LABS.map(t => t.sourceUrl));
  const internal = links.filter(url => url.startsWith("https://www.thetradehq.com/"));
  if (links.length < 1 || links.length > 3 || !links.includes(lab.sourceUrl) ||
      links.some(url => !approvedExternal.has(url) && !url.startsWith("https://www.thetradehq.com/learn/article/")) ||
      internal.length > 1) return false;
  if (!body.includes("**" + format.answerLabel + ":**") || !body.includes(lab.answer) ||
      !body.includes("**Keep in mind:**")) return false;
  if ((body.match(/\bTradeHQ\b/gi) || []).length > 1) return false;
  if (/guarantee(?:d|s)?\s+(returns?|profit)|risk[- ]free\s+(trading|investing)|real[- ]time\s+(market|price|data)|licensed\s+(financial|adviser)/i.test(subject + " " + body)) return false;
  return true;
}
