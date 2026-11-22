import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GLOSSARY_WORKSHEETS } from "../src/lib/glossaryWorksheets";
import { tradingGlossary } from "../src/lib/tradingGlossary";
const references = {
  "fomo": "https://www.investor.gov/protect-your-investments/fraud/protect-your-money",
  "fud": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/social-media-stock-scams",
  "satoshi-nakamoto": "https://satoshi.nakamotoinstitute.org/emails/cryptography/1/",
  "flash-crash": "https://www.sec.gov/newsroom/speeches-statements/spch101310geb-market-participants-may-6-flash-crash",
  "drawdown": "https://www.morningstar.com/investing-terms/maximum-drawdown",
  "backtesting": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-47",
  "correlation-trading": "https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/correlat.htm"
};
for (const [slug, href] of Object.entries(references)) assert.ok(GLOSSARY_WORKSHEETS[slug].references.some(r=>r.href===href),slug+": claim-specific source");
const glossary=tradingGlossary.map(t=>[t.definition,t.expertDefinition,t.studentPerspective,...t.keyPoints].join(" ")).join("\n");
assert.doesNotMatch(glossary,/Combat FOMO with pre-defined trading plans and alerts|Satoshi's creation of Bitcoin introduced the concept of decentralized money/);
assert.doesNotMatch(readFileSync("scripts/content.ts","utf8"),/Practise anything you learn with/);
assert.doesNotMatch(readFileSync("src/pages/About.tsx","utf8"),/free to use, with no signup required/);
assert.doesNotMatch(readFileSync("scripts/staticCopyExtra.ts","utf8"),/Every page states that the platform is educational and simulated/);
console.log("PASS scoped glossary references and publisher wording");

// Remaining glossary review: text must preserve the educational distinction.
const reviewedTerms = new Map(tradingGlossary.map(t => [t.slug, t]));
assert.match(reviewedTerms.get('risk-reward-ratio')!.expertDefinition, /risk:reward of 1:3; gain divided by loss is instead the reward-to-risk multiple of 3/);
assert.match(reviewedTerms.get('limit-order-vs-market-order')!.keyPoints.join(' '), /not an exact fill price/);
assert.match(reviewedTerms.get('day-trading')!.keyPoints.join(' '), /substantial losses/);
assert.match(reviewedTerms.get('fair-value-gap')!.definition, /full price ranges/);
assert.match(reviewedTerms.get('liquidation-cascade')!.keyPoints.join(' '), /alone cannot establish/);
for (const [slug, hostPath] of [["fibonacci-retracement","https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/fibonacci-retracement"],["bollinger-band-squeeze","https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/bollinger-bands"],["day-trading","https://www.investor.gov/introduction-investing/investing-basics/glossary/day-trading"],["hodl-strategy","https://www.investor.gov/introduction-investing/investing-basics/investment-products/crypto-asset-related-investments"]] as [string,string][]) assert.ok(GLOSSARY_WORKSHEETS[slug].references.some(r=>r.href===hostPath), slug);
console.log('PASS glossary precision and additional source references');
