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
